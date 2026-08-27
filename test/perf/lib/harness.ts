import { cpus, hostname } from "node:os"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { Bench } from "tinybench"

import { median, relativeMad } from "./stats.ts"

/**
 * One measured case. `p50Ms` is the median latency of the samples tinybench collected; the median is
 * used rather than the mean because a single GC pause in a run would otherwise move the number.
 */
export type TCaseResult = {
  name: string
  p50Ms: number
  samples: number
}

/**
 * A whole run. `ratios` is the number the gate compares — every case divided by the control case
 * measured in the *same* run. Absolute milliseconds are recorded for reading, never for gating: the
 * reference document in `.local/bench-history/` showed a machine getting 2x slower mid-epic, which
 * moved every absolute figure and no ratio.
 */
export type TRunReport = {
  generatedAt: string
  /** Human-readable description of the generated document, for the record. */
  dataset?: string
  /** Wall time spent seeding the resident document through the public API, for the record. */
  seedMs?: number
  host: string
  cpu: string
  nodeVersion: string
  agent: string
  repeats: number
  controlCase: string
  cases: TCaseResult[]
  ratios: Record<string, number>
  /**
   * Per-case dispersion of the ratio across the repeats. This, not `controlSpread`, is what the gate
   * derives its threshold from: the control is stable *within* a suite but shifts *between* suites,
   * so a case whose cost does not scale with the control inherits that shift as noise. Measuring it
   * per case is the only way to know which cases can be gated tightly and which cannot.
   */
  ratioSpread: Record<string, number>
  /**
   * Largest relative distance from the median any process showed. This, not `ratioSpread`, is what
   * the gate's threshold comes from: a threshold is a bound on the worst thing that happens on
   * unchanged code, and the MAD is blind to exactly that by construction. Absent on a single-process
   * run, where there is no between-process tail to measure.
   */
  ratioMaxDeviation?: Record<string, number>
  /**
   * The raw per-process ratios behind the aggregates. Kept so the choice of statistic can be revisited
   * and audited from a committed baseline instead of being taken on faith.
   */
  ratioSamples?: Record<string, number[]>
  /**
   * How many independent processes contributed. 1 for a plain `runSuite`. The gate refuses to judge a
   * run whose median comes from a single process — see `gate.ts`.
   */
  processes?: number
  controlSpread: number
}

export type TBenchCase = {
  name: string
  fn: () => void
  /** Reset state between iterations when the case mutates the document it measures. */
  beforeEach?: () => void
}

/** The case every other case is divided by. It must contain no library code at all. */
export const CONTROL_CASE = "control: float arithmetic"

/**
 * Iteration budget. tinybench's defaults (10 warmup + 10 measured iterations minimum) are wrong for
 * this suite: on master a single `import` iteration costs ~0.6 s, because insertion deep-clones the
 * document, so the defaults would spend minutes on one case. The budget is therefore explicit and
 * low, and the median across `repeats` whole suites is what recovers the stability that a long
 * single run would have given.
 */
const MIN_ITERATIONS = 5
const WARMUP_ITERATIONS = 1

async function runOnce(cases: TBenchCase[], timeMs: number): Promise<TCaseResult[]> {
  const bench = new Bench({
    time: timeMs,
    iterations: MIN_ITERATIONS,
    warmup: true,
    warmupIterations: WARMUP_ITERATIONS,
    warmupTime: 0,
    throws: true,
  })
  for (const c of cases) {
    bench.add(c.name, c.fn, c.beforeEach ? { beforeEach: c.beforeEach } : undefined)
  }
  await bench.run()
  return bench.tasks.map((task) => {
    // tinybench's result is a union discriminated by `state`; only the completed shapes carry
    // statistics. Narrow on the property rather than on the state string, so a new completed-ish
    // state added upstream keeps working.
    const result = task.result
    if (result === undefined || !("latency" in result)) {
      return { name: task.name, p50Ms: Number.NaN, samples: 0 }
    }
    return {
      name: task.name,
      p50Ms: result.latency.p50,
      samples: result.latency.samples?.length ?? 0,
    }
  })
}

/**
 * Runs the suite `repeats` times and keeps the median of each case across the repeats. Repeating the
 * whole suite rather than lengthening a single run is what makes the control spread meaningful: it
 * measures how much the machine moves between suites, which is the noise the gate has to tolerate.
 */
export async function runSuite(
  cases: TBenchCase[],
  options: { repeats?: number; timeMs?: number } = {}
): Promise<TRunReport> {
  const repeats = options.repeats ?? 3
  const timeMs = options.timeMs ?? 150

  const perRepeat: TCaseResult[][] = []
  for (let i = 0; i < repeats; i++) {
    perRepeat.push(await runOnce(cases, timeMs))
  }

  const cases_: TCaseResult[] = cases.map((c) => {
    const runs = perRepeat.map((r) => r.find((x) => x.name === c.name)).filter((x) => x !== undefined)
    return {
      name: c.name,
      p50Ms: median(runs.map((r) => r.p50Ms)),
      samples: runs.reduce((total, r) => total + r.samples, 0),
    }
  })

  const control = cases_.find((c) => c.name === CONTROL_CASE)
  if (!control || !Number.isFinite(control.p50Ms) || control.p50Ms <= 0) {
    throw new Error(`the control case "${CONTROL_CASE}" did not produce a usable measurement`)
  }

  const controlRuns = perRepeat
    .map((r) => r.find((x) => x.name === CONTROL_CASE)?.p50Ms)
    .filter((v): v is number => v !== undefined && Number.isFinite(v))
  const controlSpread = relativeMad(controlRuns)

  const ratios: Record<string, number> = {}
  const ratioSpread: Record<string, number> = {}
  for (const c of cases_) {
    ratios[c.name] = c.p50Ms / control.p50Ms
    const perRepeatRatios = perRepeat
      .map((run) => {
        const caseRun = run.find((x) => x.name === c.name)?.p50Ms
        const controlRun = run.find((x) => x.name === CONTROL_CASE)?.p50Ms
        return caseRun !== undefined && controlRun !== undefined && controlRun > 0 ? caseRun / controlRun : undefined
      })
      .filter((v): v is number => v !== undefined && Number.isFinite(v))
    ratioSpread[c.name] = relativeMad(perRepeatRatios)
  }

  return {
    generatedAt: new Date().toISOString(),
    host: hostname(),
    cpu: cpus()[0]?.model ?? "unknown",
    nodeVersion: process.version,
    agent: process.env.BENCH_AGENT ?? "local",
    repeats,
    controlCase: CONTROL_CASE,
    // One process. `ratioSpread` here is therefore the dispersion *within* a process, which is not the
    // quantity the gate needs — `runAcrossProcesses` produces the between-process one.
    processes: 1,
    cases: cases_,
    ratios,
    ratioSpread,
    controlSpread,
  }
}

export function writeReport(report: TRunReport, file: string): void {
  const path = resolve(process.cwd(), file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
}

export function printReport(report: TRunReport): void {
  const width = Math.max(...report.cases.map((c) => c.name.length))
  console.log(`\nagent: ${report.agent} | cpu: ${report.cpu} | node: ${report.nodeVersion}`)
  console.log(`repeats: ${report.repeats} | control spread: ${(report.controlSpread * 100).toFixed(1)}%\n`)
  for (const c of report.cases) {
    const ratio = report.ratios[c.name]
    const spread = report.ratioSpread[c.name] ?? 0
    console.log(
      `${c.name.padEnd(width)}  ${c.p50Ms.toFixed(4)} ms  x${ratio.toFixed(2)} of control  +/-${(spread * 100).toFixed(1)}%`
    )
  }
}
