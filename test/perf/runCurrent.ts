import { resolve } from "node:path"

import { writeReport } from "./lib/harness.ts"
import { printAggregate, runAcrossProcesses } from "./lib/multiProcess.ts"

/**
 * Produces the run the gate judges, aggregated across independent processes so that its median is the
 * same kind of number as the baseline's.
 *
 * This exists because `yarn bench` — one process, three repeats — is not gateable. Its median carries
 * the whole between-process variance as a bias, which on 2026-08-27 showed as a +13.9% drift against a
 * 15% limit on code that had not been touched. `yarn bench` stays as the fast local read; this is what
 * CI runs.
 *
 * Five rather than the baseline's seven: this is paid on every build, and the median of five is enough
 * to remove the single-process bias. The gate compares medians, not sample counts, so the asymmetry
 * costs nothing but the slightly wider spread of the current side — which the threshold does not read.
 */
const RUNS = Number(process.env.BENCH_RUNS ?? 5)
const OUT = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : ".local/bench/current.json"

const report = runAcrossProcesses(RUNS)

printAggregate(report, `${RUNS} independent processes`)
writeReport(report, OUT)
console.log(`\nreport written to ${resolve(process.cwd(), OUT)}`)
