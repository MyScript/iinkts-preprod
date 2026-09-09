import {
  MAX_USABLE_SPREAD,
  MIN_GATED_MS,
  MIN_ROUNDS,
  REGRESSION_THRESHOLD,
  evaluate,
  type TPairedGateReport,
} from "../../perf/lib/gate"

/**
 * The perf gate's decision rule. It is unit-tested because its predecessor twice reported a
 * near-regression on code that had not been touched, and both times the cause was in this arithmetic
 * rather than in the measurement.
 */

const CONTROL = "control: float arithmetic"

function report(over: Partial<TPairedGateReport> = {}): TPairedGateReport {
  const rounds = over.rounds ?? MIN_ROUNDS
  return {
    rounds,
    samples: { [CONTROL]: Array(rounds).fill(1), case: Array(rounds).fill(1) },
    paired: { [CONTROL]: 1, case: 1 },
    onlyReference: [],
    onlyCurrent: [],
    reference: {
      cases: [
        { name: CONTROL, p50Ms: 0.1 },
        { name: "case", p50Ms: 5 },
      ],
      controlSpread: 0.03,
    },
    current: { controlSpread: 0.03 },
    ...over,
  }
}

/** A case whose paired median is `ratio`, paired in every round. */
function withCase(ratio: number, over: Partial<TPairedGateReport> = {}): TPairedGateReport {
  const base = report(over)
  return { ...base, paired: { ...base.paired, case: ratio } }
}

describe("evaluate — regression detection", () => {
  test("passes a build that costs the same as its reference", () => {
    const result = evaluate(report())
    expect(result.regressions).toHaveLength(0)
    expect(result.verdicts.every((v) => v.gated)).toBe(true)
  })

  test("passes a drift below the threshold", () => {
    const result = evaluate(withCase(1 + REGRESSION_THRESHOLD - 0.01))
    expect(result.regressions).toHaveLength(0)
  })

  test("flags a drift above the threshold", () => {
    const result = evaluate(withCase(1 + REGRESSION_THRESHOLD + 0.01))
    expect(result.regressions.map((v) => v.name)).toEqual(["case"])
  })

  test("does not flag a drift sitting exactly on the threshold", () => {
    // The threshold is a bound the run has to pass, not reach: a case landing exactly on it has not
    // been shown to be worse than the noise the limit was drawn from.
    expect(evaluate(withCase(1 + REGRESSION_THRESHOLD)).regressions).toHaveLength(0)
  })

  test("reports the drift as the distance from parity", () => {
    expect(evaluate(withCase(1.4)).verdicts[0].drift).toBeCloseTo(0.4, 10)
  })

  test("marks a symmetric drop as improved rather than regressed", () => {
    const result = evaluate(withCase(1 - REGRESSION_THRESHOLD - 0.01))
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.improved).toBe(true)
    expect(verdict?.regressed).toBe(false)
  })

  test("sorts verdicts worst drift first", () => {
    const base = report()
    const result = evaluate({
      ...base,
      samples: { a: Array(8).fill(1), b: Array(8).fill(1), c: Array(8).fill(1) },
      paired: { a: 1, b: 1.3, c: 0.8 },
      reference: {
        cases: [
          { name: "a", p50Ms: 5 },
          { name: "b", p50Ms: 5 },
          { name: "c", p50Ms: 5 },
        ],
        controlSpread: 0.03,
      },
    })
    expect(result.verdicts.map((v) => v.name)).toEqual(["b", "a", "c"])
  })
})

describe("evaluate — cases it refuses to gate", () => {
  test("reports but does not gate a case measured below the timer floor", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS / 2 }] },
    })
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.gated).toBe(false)
    expect(verdict?.ungatedReason).toBe("timer-floor")
    expect(result.regressions).toHaveLength(0)
  })

  test("gates a case sitting exactly on the floor", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS }] },
    })
    expect(result.regressions.map((v) => v.name)).toEqual(["case"])
  })

  test("reports but does not gate a case that rarely paired", () => {
    // One build failing to produce a case half the time is telling you something, and it is not how
    // fast the case is.
    const base = withCase(2)
    const result = evaluate({ ...base, samples: { ...base.samples, case: [1, 1] } })
    const verdict = result.verdicts.find((v) => v.name === "case")
    expect(verdict?.ungatedReason).toBe("too-few-rounds")
    expect(result.regressions).toHaveLength(0)
  })

  test("gates a case paired in exactly the required share of rounds", () => {
    const base = withCase(2)
    const result = evaluate({ ...base, samples: { ...base.samples, case: Array(6).fill(1) } })
    expect(result.verdicts.find((v) => v.name === "case")?.gated).toBe(true)
  })

  test("blames the timer floor rather than the round count when a case is both", () => {
    const base = withCase(2)
    const result = evaluate({
      ...base,
      samples: { ...base.samples, case: [1] },
      reference: { ...base.reference, cases: [{ name: "case", p50Ms: MIN_GATED_MS / 100 }] },
    })
    expect(result.verdicts.find((v) => v.name === "case")?.ungatedReason).toBe("timer-floor")
  })

  test("reports how many rounds each case actually paired", () => {
    const base = report()
    const result = evaluate({ ...base, samples: { ...base.samples, case: Array(7).fill(1) } })
    expect(result.verdicts.find((v) => v.name === "case")?.rounds).toBe(7)
  })
})

describe("evaluate — runs it refuses outright", () => {
  test("refuses a run with fewer rounds than the minimum", () => {
    const result = evaluate(report({ rounds: MIN_ROUNDS - 1 }))
    expect(result.refusal?.kind).toBe("too-few-rounds")
    expect(result.verdicts).toHaveLength(0)
    expect(result.regressions).toHaveLength(0)
  })

  test("accepts exactly the minimum", () => {
    expect(evaluate(report({ rounds: MIN_ROUNDS })).refusal).toBeUndefined()
  })

  test("refuses when the reference side's control was too noisy", () => {
    const base = report()
    const result = evaluate({
      ...base,
      reference: { ...base.reference, controlSpread: MAX_USABLE_SPREAD + 0.01 },
    })
    expect(result.refusal?.kind).toBe("control-too-noisy")
  })

  test("refuses when the current side's control was too noisy", () => {
    // Either side being unreadable makes the pair unreadable; the noisy one is not always the one
    // that changed.
    const result = evaluate(report({ current: { controlSpread: MAX_USABLE_SPREAD + 0.01 } }))
    expect(result.refusal?.kind).toBe("control-too-noisy")
  })

  test("checks the round count before the control, so a short run is not mislabelled", () => {
    const result = evaluate(report({ rounds: 1, current: { controlSpread: MAX_USABLE_SPREAD + 0.01 } }))
    expect(result.refusal?.kind).toBe("too-few-rounds")
  })
})

describe("evaluate — case inventory", () => {
  test("passes through the cases only one build has, without gating them", () => {
    const result = evaluate(report({ onlyCurrent: ["fresh"], onlyReference: ["gone"] }))
    expect(result.onlyCurrent).toEqual(["fresh"])
    expect(result.onlyReference).toEqual(["gone"])
    expect(result.verdicts.map((v) => v.name)).not.toContain("fresh")
  })
})
