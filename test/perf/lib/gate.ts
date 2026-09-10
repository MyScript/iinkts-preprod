/**
 * The gate's decision, as a pure function of one paired run.
 *
 * It used to compare a run against `baseline.json`, a recording of another machine on another day.
 * That was abandoned for a measured reason: the dispersion such a baseline reports is not
 * reproducible — recorded three times from unchanged code on one quiet machine, every case's tail
 * moved by a factor of two to five — so every threshold derived from it was a lottery. What the gate
 * reads now is the ratio of two builds measured here, alternating, which has no baseline to go stale
 * and no second machine to disagree with.
 *
 * It is a separate module from `compare.ts` for one reason: the rule below is what failed on
 * unchanged code more than once, so it needs unit tests, and a top-level script that reads files and
 * calls `process.exit` cannot have any.
 *
 * Deliberately free of imports, including type-only ones, so the unit test needs no `.ts`-extension
 * resolution. `TPairedReport` from `../lib/multiProcess.ts` structurally satisfies `TPairedGateReport`.
 */

/** The subset of a paired report the decision actually reads. The gate declares its own input. */
export type TPairedGateReport = {
  /** How many times each build was measured. */
  rounds: number
  /** The current build's cost as a multiple of the reference's, per case, one entry per round. */
  samples: Record<string, number[]>
  /** The median of those samples: the number a verdict is given on. */
  paired: Record<string, number>
  /** Cases only one build has. Facts about the branch, never a verdict. */
  onlyReference: string[]
  onlyCurrent: string[]
  reference: { cases: { name: string; p50Ms: number }[]; controlSpread: number }
  current: { controlSpread: number }
}

/**
 * How far a case may move before it counts as a regression.
 *
 * Provisional, and flat across cases on purpose: IIC-2050 replaces it with a limit derived from the
 * run's own null distribution — the control, and every case the branch did not touch, whose true
 * answer is known to be 1. Until then the figure comes from measurement rather than taste: three null
 * runs, where both bundles were byte-identical so every case should have read exactly 1.000, put the
 * worst method error at 10.3%. 25% leaves roughly a factor of two over the worst thing observed on
 * code that had not changed.
 */
export const REGRESSION_THRESHOLD = 0.25

/**
 * Below this median latency a case is not measured, it is timed against the clock's own cost.
 *
 * `performance.now()` costs tens of nanoseconds to call and tinybench times every iteration
 * individually, so at a few microseconds an iteration the timer is a visible share of the number.
 * Read from the reference side, which is the side that did not change.
 */
export const MIN_GATED_MS = 0.05

/**
 * The run must pair both builds at least this many times.
 *
 * Not a round number picked for comfort: against byte-identical bundles the median paired ratio was
 * still 42.8% away from 1.000 at five rounds and within 5.5% at eight. Five is what the old
 * single-sided run used, and it is not enough here.
 */
export const MIN_ROUNDS = 8

/**
 * A case must have been paired in at least this share of the rounds. A case that only produced a
 * measurement half the time is telling you something, and it is not how fast it is.
 */
export const MIN_PAIRED_FRACTION = 0.75

/**
 * Above this the whole run is refused rather than believed. A gate that cannot tell a regression from
 * noise has to say so, not guess.
 */
export const MAX_USABLE_SPREAD = 0.35

export type TVerdict = {
  name: string
  /** Median of the paired ratios: the current build's cost as a multiple of the reference's. */
  ratio: number
  /** `ratio - 1`. Positive is slower. */
  drift: number
  /** How many rounds actually paired for this case. */
  rounds: number
  threshold: number
  /** False when the measurement makes a verdict meaningless; it is reported, not gated. */
  gated: boolean
  ungatedReason?: "timer-floor" | "too-few-rounds"
  regressed: boolean
  improved: boolean
}

export type TRefusal = {
  kind: "too-few-rounds" | "control-too-noisy"
  message: string
}

export type TGateResult = {
  /** Set when no verdict can honestly be given. Verdicts are empty in that case. */
  refusal?: TRefusal
  verdicts: TVerdict[]
  /** Cases one build has and the other does not. Reported, never gated. */
  onlyReference: string[]
  onlyCurrent: string[]
  regressions: TVerdict[]
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function refuse(kind: TRefusal["kind"], message: string): TGateResult {
  return { refusal: { kind, message }, verdicts: [], onlyReference: [], onlyCurrent: [], regressions: [] }
}

/** A baseline that predates per-case milliseconds has no opinion on measurability. Absent means no opinion. */
function belowTimerFloor(report: TPairedGateReport, name: string): boolean {
  const p50Ms = report.reference.cases.find((c) => c.name === name)?.p50Ms
  return p50Ms !== undefined && p50Ms < MIN_GATED_MS
}

function verdictFor(report: TPairedGateReport, name: string, ratio: number): TVerdict {
  const rounds = report.samples[name]?.length ?? 0
  // The floor is checked first: a case timed against the clock cannot be rescued by pairing it more
  // often, and calling it under-sampled would send someone off to add rounds that cannot help.
  const ungatedReason = belowTimerFloor(report, name)
    ? ("timer-floor" as const)
    : rounds < report.rounds * MIN_PAIRED_FRACTION
      ? ("too-few-rounds" as const)
      : undefined
  const gated = ungatedReason === undefined
  const drift = ratio - 1
  return {
    name,
    ratio,
    drift,
    rounds,
    threshold: REGRESSION_THRESHOLD,
    gated,
    ...(ungatedReason ? { ungatedReason } : {}),
    regressed: gated && drift > REGRESSION_THRESHOLD,
    improved: gated && drift < -REGRESSION_THRESHOLD,
  }
}

export function evaluate(report: TPairedGateReport): TGateResult {
  if (report.rounds < MIN_ROUNDS) {
    return refuse(
      "too-few-rounds",
      `the run paired the two builds ${report.rounds} time(s); the gate needs at least ${MIN_ROUNDS}. ` +
        "Against byte-identical builds the median paired ratio was still 42.8% out at five rounds and " +
        "within 5.5% at eight. Not reporting a verdict."
    )
  }

  const spread = Math.max(report.reference.controlSpread, report.current.controlSpread)
  if (spread > MAX_USABLE_SPREAD) {
    return refuse(
      "control-too-noisy",
      `control spread is ${pct(spread)}, above the ${pct(MAX_USABLE_SPREAD)} ceiling. The machine is ` +
        "too noisy for this run to mean anything — rerun, or raise the round count. Not reporting a verdict."
    )
  }

  const verdicts = Object.entries(report.paired)
    .map(([name, ratio]) => verdictFor(report, name, ratio))
    .sort((a, b) => b.drift - a.drift)

  return {
    verdicts,
    onlyReference: [...report.onlyReference],
    onlyCurrent: [...report.onlyCurrent],
    regressions: verdicts.filter((v) => v.regressed),
  }
}
