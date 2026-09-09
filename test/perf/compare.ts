import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  MIN_GATED_MS,
  MIN_ROUNDS,
  REGRESSION_THRESHOLD,
  evaluate,
  type TPairedGateReport,
  type TVerdict,
} from "./lib/gate.ts"

/**
 * The regression gate. It compares two builds measured in the same job, minutes apart, and never a
 * build against a record made elsewhere.
 *
 * The decision itself lives in `lib/gate.ts` and is unit-tested. This file reads the report, prints
 * the table, and sets the exit code — nothing that needs a judgement call.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

/**
 * The two reasons a case is not gated need different work from whoever reads this: a case under the
 * floor needs more work per iteration before it measures anything, a case that rarely paired needs
 * finding out why one build failed to produce it.
 */
function markFor(v: TVerdict): string {
  if (v.regressed) return "REGRESSED"
  if (!v.gated) return v.ungatedReason === "timer-floor" ? "too small" : "unpaired "
  return v.improved ? "improved " : "         "
}

function noteFor(v: TVerdict, rounds: number): string {
  if (v.gated) return `limit ${(REGRESSION_THRESHOLD * 100).toFixed(0)}%`
  if (v.ungatedReason === "timer-floor") return `not gated, under the ${MIN_GATED_MS} ms floor`
  return `not gated, paired in only ${v.rounds} of ${rounds} rounds`
}

const file = arg("--paired", ".local/bench/paired.json")
const report = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")) as TPairedGateReport & {
  generatedAt?: string
  agent?: string
  referenceLib?: string
  referenceSha?: string
  currentLib?: string
}

const result = evaluate(report)

console.log(`\n${report.rounds} paired rounds${report.agent ? ` on ${report.agent}` : ""}`)
console.log(
  `reference: ${report.referenceLib ?? "?"}${report.referenceSha ? ` (${report.referenceSha.slice(0, 9)})` : ""}`
)
console.log(`current:   ${report.currentLib ?? "?"}`)

if (result.refusal) {
  console.error(`\n${result.refusal.message}`)
  process.exit(2)
}

console.log(
  `\nx1.00 means the two builds cost the same. Anything past ${(REGRESSION_THRESHOLD * 100).toFixed(0)}% is a regression.\n`
)

const width = Math.max(...result.verdicts.map((v) => v.name.length))
for (const v of result.verdicts) {
  const sign = v.drift >= 0 ? "+" : ""
  console.log(
    `${markFor(v)} ${v.name.padEnd(width)}  x${v.ratio.toFixed(3)}  ${sign}${(v.drift * 100).toFixed(1)}%  (${noteFor(v, report.rounds)})`
  )
}

for (const name of result.onlyCurrent) {
  console.log(`\nadded by this branch, nothing to compare it against: ${name}`)
}
for (const name of result.onlyReference) {
  console.log(`\ngone from this branch, no longer measured: ${name}`)
}

if (result.regressions.length > 0) {
  console.error(`\n${result.regressions.length} case(s) regressed past ${(REGRESSION_THRESHOLD * 100).toFixed(0)}%.`)
  process.exit(1)
}
console.log(`\nno case moved past ${(REGRESSION_THRESHOLD * 100).toFixed(0)}% over ${MIN_ROUNDS}+ paired rounds.`)
