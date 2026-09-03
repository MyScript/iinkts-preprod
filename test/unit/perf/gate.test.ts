import {
  DEVIATION_FACTOR,
  MAX_GATED_DEVIATION,
  MAX_USABLE_SPREAD,
  MIN_CURRENT_PROCESSES,
  MIN_THRESHOLD,
  evaluate,
  thresholdFor,
  type TGateReport,
} from "../../perf/lib/gate"

/**
 * The perf gate's decision rule. It is unit-tested because it twice reported a near-regression on code
 * that had not been touched, and both times the cause was in this arithmetic rather than in the
 * measurement: a threshold that read the run it was judging, and a dispersion statistic blind to the
 * tail it was supposed to bound.
 */

const CONTROL = "control: float arithmetic"

function report(over: Partial<TGateReport> = {}): TGateReport {
  return {
    ratios: { [CONTROL]: 1, case: 10 },
    ratioMaxDeviation: { [CONTROL]: 0, case: 0.02 },
    ratioSpread: { [CONTROL]: 0, case: 0.02 },
    processes: 5,
    controlSpread: 0.03,
    ...over,
  }
}

describe("thresholdFor", () => {
  test("floors the threshold at MIN_THRESHOLD for a very stable case", () => {
    const baseline = report({ ratioMaxDeviation: { case: 0.001 } })
    expect(thresholdFor(baseline, "case")).toBe(MIN_THRESHOLD)
  })

  test("scales with the widest deviation the baseline observed", () => {
    const baseline = report({ ratioMaxDeviation: { case: 0.2 } })
    expect(thresholdFor(baseline, "case")).toBeCloseTo(0.2 * DEVIATION_FACTOR, 10)
  })

  test("ignores the current run's dispersion entirely", () => {
    // The defect this replaces: max(baseline, current) let a noisy run widen its own limit, so a
    // regression that also destabilised timing bought itself room.
    const baseline = report({ ratioMaxDeviation: { case: 0.02 } })
    const noisyCurrent = report({ ratioMaxDeviation: { case: 0.9 }, ratioSpread: { case: 0.9 } })

    const before = thresholdFor(baseline, "case")
    const result = evaluate(baseline, { ...noisyCurrent, ratios: { case: 12 } })

    expect(before).toBe(MIN_THRESHOLD)
    expect(result.verdicts[0].threshold).toBe(MIN_THRESHOLD)
  })

  test("falls back to the floor when the baseline predates ratioMaxDeviation", () => {
    const baseline = report({ ratioMaxDeviation: undefined })
    expect(thresholdFor(baseline, "case")).toBe(MIN_THRESHOLD)
  })
})

describe("evaluate — regression detection", () => {
  test("passes a drift below the threshold", () => {
    const result = evaluate(report(), report({ ratios: { case: 11 } }))
    expect(result.regressions).toHaveLength(0)
    expect(result.verdicts[0].drift).toBeCloseTo(0.1, 10)
  })

  test("flags a drift above the threshold", () => {
    const result = evaluate(report(), report({ ratios: { case: 12 } }))
    expect(result.regressions.map((v) => v.name)).toEqual(["case"])
    expect(result.verdicts[0].regressed).toBe(true)
  })

  test("does not flag the +13.9% drift that the old rule nearly failed on", () => {
    // The measured case: transform's MAD was 2.2% and its real tail far wider. With the tail recorded,
    // its limit clears the drift instead of sitting 1.1 points under it.
    const baseline = report({ ratios: { case: 12.35 }, ratioMaxDeviation: { case: 0.14 } })
    const current = report({ ratios: { case: 14.06 } })

    const result = evaluate(baseline, current)

    expect(result.verdicts[0].drift).toBeCloseTo(0.1385, 3)
    expect(result.verdicts[0].threshold).toBeCloseTo(0.21, 10)
    expect(result.regressions).toHaveLength(0)
  })

  test("still catches a 20% step on a stable case", () => {
    // The gate's stated purpose. A rule tuned only to stop false positives is worthless.
    const baseline = report({ ratios: { case: 10 }, ratioMaxDeviation: { case: 0.02 } })
    const result = evaluate(baseline, report({ ratios: { case: 12 } }))
    expect(result.regressions).toHaveLength(1)
  })

  test("marks a symmetric drop as improved rather than regressed", () => {
    const result = evaluate(report(), report({ ratios: { case: 8 } }))
    expect(result.verdicts[0].improved).toBe(true)
    expect(result.verdicts[0].regressed).toBe(false)
  })

  test("sorts verdicts worst drift first", () => {
    const baseline = report({
      ratios: { a: 10, b: 10, c: 10 },
      ratioMaxDeviation: { a: 0.02, b: 0.02, c: 0.02 },
    })
    const result = evaluate(baseline, report({ ratios: { a: 10, b: 13, c: 8 } }))
    expect(result.verdicts.map((v) => v.name)).toEqual(["b", "a", "c"])
  })
})

describe("evaluate — cases it refuses to gate", () => {
  test("reports but does not gate a case noisier than MAX_GATED_DEVIATION", () => {
    const baseline = report({ ratios: { case: 10 }, ratioMaxDeviation: { case: MAX_GATED_DEVIATION + 0.01 } })
    const result = evaluate(baseline, report({ ratios: { case: 20 } }))

    expect(result.verdicts[0].gated).toBe(false)
    expect(result.verdicts[0].regressed).toBe(false)
    expect(result.regressions).toHaveLength(0)
  })

  test("refuses the whole run when the control case is too noisy", () => {
    const result = evaluate(report(), report({ controlSpread: MAX_USABLE_SPREAD + 0.01 }))

    expect(result.refusal?.kind).toBe("control-too-noisy")
    expect(result.verdicts).toHaveLength(0)
    expect(result.regressions).toHaveLength(0)
  })

  test("refuses a single-process current run", () => {
    // A run of repeats inside one process has a median biased by the between-process variance. It is
    // readable and not gateable, and saying so is the point.
    const result = evaluate(report(), report({ processes: 1, ratios: { case: 30 } }))

    expect(result.refusal?.kind).toBe("current-not-multi-process")
    expect(result.refusal?.message).toContain("yarn bench:ci")
    expect(result.regressions).toHaveLength(0)
  })

  test("refuses a current run that does not declare its process count", () => {
    const result = evaluate(report(), report({ processes: undefined }))
    expect(result.refusal?.kind).toBe("current-not-multi-process")
  })

  test("accepts exactly MIN_CURRENT_PROCESSES", () => {
    const result = evaluate(report(), report({ processes: MIN_CURRENT_PROCESSES }))
    expect(result.refusal).toBeUndefined()
  })

  test("checks the control before the process count, so a noisy run is not mislabelled", () => {
    const result = evaluate(report(), report({ processes: 1, controlSpread: MAX_USABLE_SPREAD + 0.01 }))
    expect(result.refusal?.kind).toBe("control-too-noisy")
  })
})

describe("evaluate — case inventory", () => {
  test("lists cases the current run added, without gating them", () => {
    const result = evaluate(report(), report({ ratios: { [CONTROL]: 1, case: 10, fresh: 4 } }))
    expect(result.added).toEqual(["fresh"])
    expect(result.verdicts.map((v) => v.name)).not.toContain("fresh")
  })

  test("lists cases the current run failed to produce", () => {
    const result = evaluate(report(), report({ ratios: { [CONTROL]: 1 } }))
    expect(result.missing).toEqual(["case"])
    expect(result.regressions).toHaveLength(0)
  })
})
