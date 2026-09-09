import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { DEVIATION_FACTOR, MIN_GATED_MS, MIN_THRESHOLD, evaluate, type TVerdict } from "./lib/gate.ts"
import type { TRunReport } from "./lib/harness.ts"

/**
 * The regression gate. It compares **ratios**, never milliseconds: a ratio is a case divided by the
 * control case measured in the same run, so a slower agent moves both and cancels out.
 *
 * The decision itself lives in `lib/gate.ts` and is unit-tested. This file reads the two reports,
 * prints the table, and sets the exit code — nothing that needs a judgement call.
 */

function read(file: string): TRunReport {
  return JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")) as TRunReport
}

function readOptional(file: string): TRunReport | undefined {
  try {
    return read(file)
  } catch {
    return undefined
  }
}

/**
 * The two reasons a case is not gated need different work from whoever reads this, so they are not
 * printed as one word: a noisy case needs its measurement stabilised, a case under the floor needs
 * more work per iteration before it measures anything at all.
 */
function markFor(v: TVerdict): string {
  if (v.regressed) return "REGRESSED"
  if (!v.gated) return v.ungatedReason === "timer-floor" ? "too small" : "too noisy"
  return v.improved ? "improved " : "         "
}

function limitFor(v: TVerdict): string {
  if (v.gated) return `limit ${(v.threshold * 100).toFixed(0)}%`
  if (v.ungatedReason === "timer-floor") return `not gated, under the ${MIN_GATED_MS} ms floor`
  return "not gated, too noisy"
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

const baselineFile = arg("--baseline", "test/perf/baseline.json")
const baseline = readOptional(baselineFile)
const current = read(arg("--current", ".local/bench/current.json"))

if (!baseline) {
  // No baseline yet is a normal state on a branch that adds a case, not a build failure. Recording
  // one is a deliberate act: `yarn bench:baseline`.
  console.log(`no baseline at ${baselineFile} — nothing to compare against. Run yarn bench:baseline to record one.`)
  process.exit(0)
}

const result = evaluate(baseline, current)

console.log(`\nbaseline: ${baseline.generatedAt} on ${baseline.agent} (${baseline.processes ?? 1} processes)`)
console.log(`current:  ${current.generatedAt} on ${current.agent} (${current.processes ?? 1} processes)`)

if (result.refusal) {
  console.error(`\n${result.refusal.message}`)
  process.exit(2)
}

console.log(
  `per-case threshold: max(${(MIN_THRESHOLD * 100).toFixed(0)}%, ${DEVIATION_FACTOR}x the widest deviation the baseline observed)\n`
)

for (const name of result.missing) {
  console.warn(`case missing from the current run, skipped: ${name}`)
}

const width = Math.max(...result.verdicts.map((v) => v.name.length))
for (const v of result.verdicts) {
  const sign = v.drift >= 0 ? "+" : ""
  console.log(
    `${markFor(v)} ${v.name.padEnd(width)}  x${v.baselineRatio.toFixed(2)} -> x${v.currentRatio.toFixed(2)}  ${sign}${(v.drift * 100).toFixed(1)}%  (${limitFor(v)})`
  )
}

if (result.added.length > 0) {
  console.log(`\nnew cases, not gated until the baseline is updated: ${result.added.join(", ")}`)
}

if (result.regressions.length > 0) {
  console.error(`\n${result.regressions.length} case(s) regressed past their threshold.`)
  process.exit(1)
}
console.log("\nno regression past the per-case threshold.")
