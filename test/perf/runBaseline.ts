import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { printAggregate, runAcrossProcesses } from "./lib/multiProcess.ts"

/**
 * Records the committed baseline: the reference ratios, both dispersions, and the raw per-process
 * ratios behind them.
 *
 * The baseline is paid once and reviewed in a diff, so it buys more processes than a CI run can. Seven
 * is enough for the median to settle; the tail it reports is what every later threshold is derived
 * from, so under-sampling here makes every gate afterwards too tight.
 */
const RUNS = Number(process.env.BENCH_BASELINE_RUNS ?? 7)
const OUT = resolve(process.cwd(), "test/perf/baseline.json")

const baseline = runAcrossProcesses(RUNS)

writeFileSync(OUT, `${JSON.stringify(baseline, null, 2)}\n`)

printAggregate(baseline, `${RUNS} independent processes`)
console.log(`\nbaseline written to ${OUT}`)
