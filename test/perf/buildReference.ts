import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

/**
 * Builds the bundle the current branch is measured against, from the commit the branch left the base
 * at.
 *
 * The point is to stop comparing across machines. A committed baseline is a recording of another
 * computer on another day; a reference bundle built here, now, is measured by the same suite on the
 * same agent minutes apart, so whatever the machine is doing lands on both sides.
 *
 * The reference is built in a detached worktree rather than by moving the checkout, so an interrupted
 * run cannot leave the branch somewhere else.
 */

const WORKTREE = resolve(process.cwd(), ".local/bench-ref-worktree")
const OUT = resolve(process.cwd(), "dist-ref/iink.esm.js")
const STAMP = resolve(process.cwd(), "dist-ref/.reference-sha")

function git(args: string[], cwd = process.cwd()): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim()
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : process.argv[i + 1]
}

/**
 * Where this branch left the base. On the base branch itself the merge-base is HEAD, which would
 * compare a build to itself: the previous commit is used instead, so a build of master measures what
 * its own last commit changed.
 */
function referenceSha(base: string): string {
  const head = git(["rev-parse", "HEAD"])
  const mergeBase = git(["merge-base", base, "HEAD"])
  return mergeBase === head ? git(["rev-parse", "HEAD~1"]) : mergeBase
}

/**
 * The reference build needs dependencies. When the lockfile has not moved since the reference commit
 * the ones already installed are by definition the right ones, and hard-linking them costs a fraction
 * of a second against a minute of install. When it has moved, they are not the right ones — a
 * dependency bump is a performance change like any other — so the worktree installs its own.
 */
function prepareDependencies(sha: string): string {
  const lockUnchanged = git(["show", `${sha}:yarn.lock`]) === readFileSync("yarn.lock", "utf8").trim()
  if (lockUnchanged) {
    try {
      execFileSync("cp", ["-al", resolve(process.cwd(), "node_modules"), resolve(WORKTREE, "node_modules")])
      return "hard-linked from the current install"
    } catch {
      // Hard links need one filesystem and a cp that supports them. Falling back is cheaper to write
      // than to detect.
    }
  }
  execFileSync("yarn", ["install", "--immutable"], { cwd: WORKTREE, stdio: "inherit" })
  return lockUnchanged ? "installed (hard links unavailable)" : "installed (the lockfile moved)"
}

const base = arg("--base", process.env.BENCH_REF_BASE ?? "origin/master")
const sha = arg("--sha", process.env.BENCH_REF_SHA ?? referenceSha(base))

if (existsSync(OUT) && existsSync(STAMP) && readFileSync(STAMP, "utf8").trim() === sha) {
  console.log(`reference bundle for ${sha.slice(0, 9)} is already built at ${OUT}`)
  process.exit(0)
}

rmSync(WORKTREE, { recursive: true, force: true })
execFileSync("git", ["worktree", "prune"], { stdio: "ignore" })
console.log(`building the reference bundle from ${sha.slice(0, 9)} (base ${base})`)

try {
  execFileSync("git", ["worktree", "add", "--detach", WORKTREE, sha], { stdio: "inherit" })
  console.log(`dependencies: ${prepareDependencies(sha)}`)
  execFileSync("yarn", ["build:lib"], { cwd: WORKTREE, stdio: "inherit" })

  mkdirSync(dirname(OUT), { recursive: true })
  cpSync(resolve(WORKTREE, "dist/iink.esm.js"), OUT)
  writeFileSync(STAMP, `${sha}\n`)
  console.log(`\nreference bundle written to ${OUT}`)
} finally {
  rmSync(WORKTREE, { recursive: true, force: true })
  execFileSync("git", ["worktree", "prune"], { stdio: "ignore" })
}
