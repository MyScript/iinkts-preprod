import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { TRunReport } from "./harness.ts"
import { maxRelativeDeviation, median, relativeMad } from "./stats.ts"

/**
 * Runs the bench in several **independent processes** and aggregates them.
 *
 * Why processes and not repeats: repeats inside one process share JIT state, heap layout and GC
 * history, so their dispersion is correlated and far narrower than the real run-to-run variance —
 * measured on 2026-08-27, where the import case drifted 15.5% between two unchanged runs while its
 * in-process spread claimed 2.5%.
 *
 * Both the baseline and the run the gate judges go through here, with the same statistic, so the two
 * sides of a comparison are the same kind of number. They differ only in how many processes they can
 * afford: the baseline is recorded once and deliberately, a CI run is paid on every build.
 */
export function runAcrossProcesses(runs: number): TRunReport {
  const dir = mkdtempSync(join(tmpdir(), "iink-bench-"))
  const reports: TRunReport[] = []

  try {
    for (let i = 0; i < runs; i++) {
      const file = join(dir, `run-${i}.json`)
      process.stdout.write(`bench process ${i + 1}/${runs}\n`)
      execFileSync(process.execPath, ["test/perf/bench.ts", "--out", file, "--repeats", "1"], {
        stdio: ["ignore", "ignore", "inherit"],
      })
      reports.push(JSON.parse(readFileSync(file, "utf8")) as TRunReport)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }

  return aggregate(reports)
}

/**
 * Keeps the median ratio per case, and both dispersions: the MAD to print, the tail to gate on. The
 * raw per-process ratios are kept too — without them the choice of statistic could never be revisited
 * or audited from a committed baseline, which is how the first threshold rule went unchallenged.
 */
export function aggregate(reports: TRunReport[]): TRunReport {
  const last = reports[reports.length - 1]
  const names = last.cases.map((c) => c.name)

  const ratios: Record<string, number> = {}
  const ratioSpread: Record<string, number> = {}
  const ratioMaxDeviation: Record<string, number> = {}
  const ratioSamples: Record<string, number[]> = {}

  const cases = names.map((name) => {
    const perRun = reports
      .map((r) => ({ ratio: r.ratios[name], ms: r.cases.find((c) => c.name === name)?.p50Ms }))
      .filter((v): v is { ratio: number; ms: number } => v.ratio !== undefined && v.ms !== undefined)
    const sampled = perRun.map((v) => v.ratio)
    ratios[name] = median(sampled)
    ratioSpread[name] = relativeMad(sampled)
    ratioMaxDeviation[name] = maxRelativeDeviation(sampled)
    ratioSamples[name] = sampled.map((v) => Number(v.toFixed(4)))
    return { name, p50Ms: median(perRun.map((v) => v.ms)), samples: perRun.length }
  })

  return {
    ...last,
    generatedAt: new Date().toISOString(),
    processes: reports.length,
    repeats: reports.length,
    cases,
    ratios,
    ratioSpread,
    ratioMaxDeviation,
    ratioSamples,
    controlSpread: relativeMad(reports.map((r) => r.cases.find((c) => c.name === r.controlCase)?.p50Ms ?? 0)),
  }
}

export function printAggregate(report: TRunReport, label: string): void {
  const names = report.cases.map((c) => c.name)
  const width = Math.max(...names.map((n) => n.length))
  console.log(`\n${label} | agent: ${report.agent} | cpu: ${report.cpu}\n`)
  for (const name of names) {
    const mad = report.ratioSpread[name] ?? 0
    const tail = report.ratioMaxDeviation?.[name] ?? 0
    console.log(
      `${name.padEnd(width)}  x${report.ratios[name].toFixed(2)} of control  MAD +/-${(mad * 100).toFixed(1)}%  tail +/-${(tail * 100).toFixed(1)}%`
    )
  }
}
