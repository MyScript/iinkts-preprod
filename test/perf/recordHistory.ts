import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { pruneRecords, recordFileName, toRecord, type THistoryRecord, type THistorySource } from "./lib/history.ts"

/**
 * Appends the run just measured to the perf history, one record per commit.
 *
 * It is deliberately separate from the gate and runs whether the gate passed, failed or refused to
 * judge: a run the gate could not read is exactly the kind a trend needs, and a history with holes
 * where the machine was noisy would be a history that flatters itself.
 *
 * The destination is a plain directory. Which store that directory belongs to — a branch, a bucket,
 * a build artifact — is the caller's business, so this file can be exercised locally without any
 * credentials at all.
 */

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

/**
 * Jenkins knows the commit it checked out; a local run has to ask git. The environment is preferred
 * because a CI checkout can be a detached head whose branch name git alone cannot recover.
 */
function gitInfo(): { commit: string; branch: string } {
  const read = (args: string[]): string => execFileSync("git", args, { encoding: "utf8" }).trim()
  const commit = process.env.GIT_COMMIT_HASH ?? process.env.GIT_COMMIT ?? read(["rev-parse", "HEAD"])
  const branch = process.env.BRANCH_NAME ?? read(["rev-parse", "--abbrev-ref", "HEAD"])
  return { commit, branch }
}

const source = JSON.parse(
  readFileSync(resolve(process.cwd(), arg("--current", ".local/bench/current.json")), "utf8")
) as THistorySource
const record = toRecord(source, gitInfo())

const dir = resolve(process.cwd(), arg("--dir", ".local/bench-history"))
const file = resolve(dir, recordFileName(record))
mkdirSync(dirname(file), { recursive: true })
writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`)

console.log(`recorded ${record.commit.slice(0, 9)} on ${record.branch} (${record.processes} processes) to ${file}`)

/**
 * The history is carried forward from build to build, so it is capped here rather than by whoever
 * stores it. Reading every record back to prune is affordable because a record is a few kilobytes and
 * the cap is in the hundreds.
 */
const keep = Number(arg("--keep", "500"))
const existing: { record: THistoryRecord; file: string }[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ record: JSON.parse(readFileSync(resolve(dir, f), "utf8")) as THistoryRecord, file: resolve(dir, f) }))

const { dropped } = pruneRecords(
  existing.map((e) => e.record),
  keep
)
for (const stale of dropped) {
  const match = existing.find((e) => e.record.commit === stale.commit)
  if (match) rmSync(match.file, { force: true })
}
if (dropped.length > 0) {
  console.log(`pruned ${dropped.length} record(s) beyond the most recent ${keep}`)
}
