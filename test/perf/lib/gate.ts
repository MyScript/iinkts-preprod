/**
 * The gate's decision, as a pure function of two reports.
 *
 * It is a separate module from `compare.ts` for one reason: the rule below is what failed twice on
 * unchanged code, so it needs unit tests, and a top-level script that reads files and calls
 * `process.exit` cannot have any. `compare.ts` is now I/O and printing around this.
 *
 * Deliberately free of imports, including type-only ones, so the unit test needs no `.ts`-extension
 * resolution and no change to the shared jest config. `TRunReport` from `../lib/harness.ts`
 * structurally satisfies `TGateReport`.
 */

/** The subset of a run report the decision actually reads. The gate declares its own input. */
export type TGateReport = {
  ratios: Record<string, number>
  /**
   * Absolute median latency per case. Read for one purpose only — deciding whether a case was
   * measurable at all. Never for a verdict: absolute milliseconds move with the machine, which is
   * why the gate compares ratios in the first place.
   */
  cases?: { name: string; p50Ms: number }[]
  /** Largest relative distance from the median observed across the independent processes. */
  ratioMaxDeviation?: Record<string, number>
  /** Median absolute deviation. Reported, never used to set a threshold — see `stats.ts`. */
  ratioSpread?: Record<string, number>
  /** How many independent processes contributed. 1 means a single-process run. */
  processes?: number
  controlSpread: number
}

/**
 * Floor under every threshold. A suspiciously quiet pair of runs must not be allowed to make the gate
 * hair-trigger, because the next run on the same agent will not be as quiet.
 */
export const MIN_THRESHOLD = 0.15

/**
 * How many times a case's own observed tail it must exceed to count as a regression.
 *
 * 1.5 rather than the 2 a MAD-based rule needed: the tail is already the worst observed value, so
 * doubling it would produce a threshold no realistic regression could cross on the noisier cases.
 */
export const DEVIATION_FACTOR = 1.5

/**
 * Below this median latency a case is not measured, it is timed against the clock's own cost.
 *
 * `performance.now()` costs tens of nanoseconds to call and tinybench times every iteration
 * individually, so at a few microseconds per iteration the timer is a visible share of the number.
 * The evidence is `read: getRootSymbol by id @500 x20`, which reported 0.00003 ms per iteration —
 * 1.6 ns for twenty `Map.get` calls, below what one real lookup costs. Its dispersion looked tight
 * because a clock is consistent, so its threshold fell to the floor, and it then failed CI at +21%
 * against a 15% limit on code nobody had touched.
 *
 * 0.05 ms leaves the timer's own cost about three orders of magnitude below the measurement. Cases
 * are sized to clear it deliberately (IIC-2041); this is the guard for when one later drifts under,
 * because the library got faster or a case was rewritten.
 */
export const MIN_GATED_MS = 0.05

/**
 * A case whose observed tail is wider than this cannot be gated: any threshold that tolerated its
 * noise would also tolerate a real regression. Reported and skipped, loudly, rather than silently
 * widened until it can never fire.
 */
export const MAX_GATED_DEVIATION = 0.25

/**
 * Above this the whole run is refused rather than believed. A gate that cannot tell a regression from
 * noise has to say so, not guess.
 */
export const MAX_USABLE_SPREAD = 0.35

/**
 * The current run must aggregate at least this many independent processes for its medians to be
 * comparable to the baseline's.
 *
 * Why it is checked at all: repeats inside one process share JIT state, heap layout and GC history,
 * so their median carries the whole between-process variance as a bias. That is what produced a
 * +13.9% drift against a 15% limit on code that had not been touched. A single-process current run is
 * fine to read, and not fine to gate on.
 */
export const MIN_CURRENT_PROCESSES = 3

export type TVerdict = {
  name: string
  baselineRatio: number
  currentRatio: number
  drift: number
  threshold: number
  /** False when the case's own noise makes a verdict meaningless; it is reported, not gated. */
  gated: boolean
  /** Why the case was not gated. Absent when it was. The two causes call for different fixes. */
  ungatedReason?: "timer-floor" | "noise"
  regressed: boolean
  improved: boolean
}

export type TRefusal = {
  kind: "control-too-noisy" | "current-not-multi-process"
  message: string
}

export type TGateResult = {
  /** Set when no verdict can honestly be given. Verdicts are empty in that case. */
  refusal?: TRefusal
  verdicts: TVerdict[]
  /** Cases present in the current run but absent from the baseline. Reported, never gated. */
  added: string[]
  /** Cases in the baseline that the current run did not produce. */
  missing: string[]
  regressions: TVerdict[]
}

/**
 * The threshold rule.
 *
 * It reads the **baseline only**. The previous rule took `max(baseline spread, current spread)`,
 * which had two defects that compounded: a noisy current run widened its own limit — so a regression
 * that also destabilised timing bought itself more room — and the two spreads were not the same
 * quantity, the baseline's being measured between processes and the current run's inside one.
 */
export function thresholdFor(baseline: TGateReport, name: string): number {
  const tail = baseline.ratioMaxDeviation?.[name] ?? 0
  return Math.max(MIN_THRESHOLD, tail * DEVIATION_FACTOR)
}

export function evaluate(baseline: TGateReport, current: TGateReport): TGateResult {
  const empty: Omit<TGateResult, "refusal"> = { verdicts: [], added: [], missing: [], regressions: [] }

  if (current.controlSpread > MAX_USABLE_SPREAD) {
    return {
      ...empty,
      refusal: {
        kind: "control-too-noisy",
        message:
          `control spread is ${pct(current.controlSpread)}, above the ${pct(MAX_USABLE_SPREAD)} ceiling. ` +
          "The machine is too noisy for this run to mean anything — rerun on a quieter agent, or raise " +
          "the process count. Not reporting a verdict.",
      },
    }
  }

  const processes = current.processes ?? 1
  if (processes < MIN_CURRENT_PROCESSES) {
    return {
      ...empty,
      refusal: {
        kind: "current-not-multi-process",
        message:
          `the current run aggregates ${processes} process(es); the gate needs at least ` +
          `${MIN_CURRENT_PROCESSES}. Repeats inside one process share JIT and heap state, so their ` +
          "median carries the between-process variance as a bias and drifts on unchanged code. " +
          "Run yarn bench:ci instead of yarn bench. Not reporting a verdict.",
      },
    }
  }

  const verdicts: TVerdict[] = []
  const missing: string[] = []
  for (const [name, baselineRatio] of Object.entries(baseline.ratios)) {
    const currentRatio = current.ratios[name]
    if (currentRatio === undefined) {
      missing.push(name)
      continue
    }
    const drift = currentRatio / baselineRatio - 1
    const threshold = thresholdFor(baseline, name)
    // The floor is checked before the noise, because a case timed against the clock has a dispersion
    // that means nothing either — calling it noisy would send someone off to stabilise a number that
    // was never measured.
    const ungatedReason = belowTimerFloor(baseline, name)
      ? ("timer-floor" as const)
      : (baseline.ratioMaxDeviation?.[name] ?? 0) > MAX_GATED_DEVIATION
        ? ("noise" as const)
        : undefined
    const gated = ungatedReason === undefined
    verdicts.push({
      name,
      baselineRatio,
      currentRatio,
      drift,
      threshold,
      gated,
      ...(ungatedReason ? { ungatedReason } : {}),
      regressed: gated && drift > threshold,
      improved: gated && drift < -threshold,
    })
  }

  verdicts.sort((a, b) => b.drift - a.drift)

  return {
    verdicts,
    added: Object.keys(current.ratios).filter((n) => baseline.ratios[n] === undefined),
    missing,
    regressions: verdicts.filter((v) => v.regressed),
  }
}

/**
 * A baseline that predates per-case milliseconds cannot be judged on them, and refusing to gate every
 * case because the record is old would be worse than the problem. Absent means "no opinion".
 */
function belowTimerFloor(baseline: TGateReport, name: string): boolean {
  const p50Ms = baseline.cases?.find((c) => c.name === name)?.p50Ms
  return p50Ms !== undefined && p50Ms < MIN_GATED_MS
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
