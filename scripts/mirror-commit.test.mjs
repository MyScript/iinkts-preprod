import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "child_process"
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import process from "process"
import { fileURLToPath } from "url"

const scripts = dirname(fileURLToPath(import.meta.url))
const MIRROR = join(scripts, "mirror-commit.sh")
const PUSH = join(scripts, "push-mirror.sh")

function createRepo(prefix, ...initArgs) {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf-8", stdio: "pipe" }).trim()
  git("init", "-q", ...initArgs)
  git("config", "user.email", "dev@example.com")
  git("config", "user.name", "Dev")
  git("config", "commit.gpgsign", "false")
  git("config", "tag.gpgsign", "false")
  // A machine-wide hooks path may reject the author above
  git("config", "core.hooksPath", "/dev/null")
  return { dir, git }
}

function write(dir, path, content) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), content)
}

function commitAll({ dir, git }, files, message, date) {
  Object.entries(files).forEach(([path, content]) => write(dir, path, content))
  git("add", "-A")
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }
  execFileSync("git", ["commit", "-q", "-m", message], { cwd: dir, env, stdio: "pipe" })
  return git("rev-parse", "HEAD")
}

const run = (dir, script, ...args) =>
  execFileSync("sh", [script, ...args], { cwd: dir, encoding: "utf-8", stdio: "pipe" }).trim()

const fails = (dir, script, ...args) => {
  try {
    run(dir, script, ...args)
    return false
  } catch {
    return true
  }
}

const HIDDEN = ["docker/Dockerfile", "Jenkinsfile", "Jenkinsfile-release", "examples/server-configuration.json"]

// master: init → feature merged with --no-ff → fix
function createHistory() {
  const repo = createRepo("mirror-source-", "-b", "master")
  commitAll(
    repo,
    {
      "README.md": "iink\n",
      "src/a.ts": "a\n",
      "examples/index.html": "<html></html>\n",
      "examples/server-configuration.json": '{ "hmacKey": "secret" }\n',
      "docker/Dockerfile": "FROM node\n",
      Jenkinsfile: "pipeline {}\n",
      "Jenkinsfile-release": "pipeline {}\n",
    },
    "chore: init",
    "1700000000 +0100"
  )
  repo.git("checkout", "-q", "-b", "feature")
  commitAll(repo, { "src/b.ts": "b\n", Jenkinsfile: "pipeline { b }\n" }, "feat: b\n\nIIC-1 body", "1700000100 +0100")
  repo.git("checkout", "-q", "master")
  commitAll(repo, { "src/c.ts": "c\n" }, "fix: c", "1700000200 +0100")
  execFileSync("git", ["merge", "-q", "--no-ff", "-m", "Pull request #1: b", "feature"], {
    cwd: repo.dir,
    env: { ...process.env, GIT_AUTHOR_DATE: "1700000300 +0100", GIT_COMMITTER_DATE: "1700000300 +0100" },
    stdio: "pipe",
  })
  return repo
}

const metadata = (git, rev) => git("log", "--format=%an|%ae|%ad|%cn|%ce|%cd|%B", "--date=raw", rev)

describe("mirror-commit.sh", () => {
  test("rewrites every commit without docker/, Jenkins* and examples/server-configuration.json", () => {
    const repo = createHistory()
    const mirror = run(repo.dir, MIRROR, "HEAD")
    const commits = repo.git("rev-list", mirror).split("\n")
    assert.equal(commits.length, 4)
    commits.forEach((commit) => {
      const files = repo.git("ls-tree", "-r", "--name-only", commit).split("\n")
      HIDDEN.forEach((hidden) => assert.ok(!files.includes(hidden), `${hidden} in ${commit}`))
      assert.ok(files.includes("README.md"))
      assert.ok(files.includes("examples/index.html"))
    })
    rmSync(repo.dir, { recursive: true, force: true })
  })

  test("keeps authors, committers, dates, messages and merges", () => {
    const repo = createHistory()
    const mirror = run(repo.dir, MIRROR, "HEAD")
    assert.equal(metadata(repo.git, mirror), metadata(repo.git, "HEAD"))
    assert.equal(repo.git("rev-list", "--merges", "--count", mirror), "1")
    // Only the internal files differ
    assert.deepEqual(repo.git("diff", "HEAD", mirror, "--name-only").split("\n"), [...HIDDEN].sort())
    rmSync(repo.dir, { recursive: true, force: true })
  })

  test("gives the same commits without its cache", () => {
    const repo = createHistory()
    const mirror = run(repo.dir, MIRROR, "HEAD")
    const gitDir = join(repo.dir, ".git")
    readdirSync(gitDir)
      .filter((name) => name.startsWith("mirror-map"))
      .forEach((name) => rmSync(join(gitDir, name)))
    assert.equal(run(repo.dir, MIRROR, "HEAD"), mirror)
    rmSync(repo.dir, { recursive: true, force: true })
  })

  test("builds a new commit on top of the previous mirror", () => {
    const repo = createHistory()
    const previous = run(repo.dir, MIRROR, "HEAD")
    commitAll(repo, { "src/d.ts": "d\n", "docker/Dockerfile": "FROM node:22\n" }, "fix: d", "1700000400 +0100")
    const next = run(repo.dir, MIRROR, "HEAD")
    assert.equal(repo.git("rev-parse", `${next}^`), previous)
    rmSync(repo.dir, { recursive: true, force: true })
  })

  test("refuses a shallow clone, whose history it would cut", () => {
    const repo = createHistory()
    const target = mkdtempSync(join(tmpdir(), "mirror-shallow-"))
    execFileSync("git", ["clone", "-q", "--depth", "1", `file://${repo.dir}`, target], { stdio: "pipe" })
    assert.ok(fails(target, MIRROR, "HEAD"))
    rmSync(repo.dir, { recursive: true, force: true })
    rmSync(target, { recursive: true, force: true })
  })
})

describe("push-mirror.sh", () => {
  function setup() {
    const repo = createHistory()
    const remote = createRepo("mirror-remote-", "--bare")
    repo.git("remote", "add", "public", remote.dir)
    const cleanup = () => [repo.dir, remote.dir].forEach((dir) => rmSync(dir, { recursive: true, force: true }))
    return { repo, remote, cleanup }
  }

  // A commit as the snapshot deployment made them, on top of whatever
  function snapshot(repo, parent) {
    const env = {
      ...process.env,
      GIT_AUTHOR_NAME: "iink-ts-builder",
      GIT_AUTHOR_EMAIL: "iink-ts-builder@myscript.com",
      GIT_COMMITTER_NAME: "iink-ts-builder",
      GIT_COMMITTER_EMAIL: "iink-ts-builder@myscript.com",
    }
    const args = ["commit-tree", "HEAD^{tree}", "-m", "iink-ts 5.1.0-beta.724 from 7af63ca"]
    if (parent) args.push("-p", parent)
    return execFileSync("git", args, { cwd: repo.dir, env, encoding: "utf-8" }).trim()
  }

  test("creates the branch and the tag", () => {
    const { repo, remote, cleanup } = setup()
    const mirror = run(repo.dir, MIRROR, "HEAD")
    run(repo.dir, PUSH, "public", mirror, "master", "5.1.0")
    assert.equal(remote.git("rev-parse", "master"), mirror)
    assert.equal(remote.git("rev-parse", "5.1.0^{commit}"), mirror)
    cleanup()
  })

  test("fast-forwards the branch", () => {
    const { repo, remote, cleanup } = setup()
    run(repo.dir, PUSH, "public", run(repo.dir, MIRROR, "HEAD~1"), "master")
    const mirror = run(repo.dir, MIRROR, "HEAD")
    run(repo.dir, PUSH, "public", mirror, "master")
    assert.equal(remote.git("rev-parse", "master"), mirror)
    cleanup()
  })

  test("replaces a snapshot tip once, the switch from snapshots to the mirror", () => {
    const { repo, remote, cleanup } = setup()
    const legacy = snapshot(repo, snapshot(repo))
    repo.git("push", "-q", "public", `${legacy}:refs/heads/master`)
    const mirror = run(repo.dir, MIRROR, "HEAD")
    run(repo.dir, PUSH, "public", mirror, "master")
    assert.equal(remote.git("rev-parse", "master"), mirror)
    cleanup()
  })

  test("refuses to rewrite a public history that is not a snapshot", () => {
    const { repo, remote, cleanup } = setup()
    const tip = run(repo.dir, MIRROR, "HEAD")
    run(repo.dir, PUSH, "public", tip, "master")
    const other = run(repo.dir, MIRROR, "HEAD^2")
    assert.ok(fails(repo.dir, PUSH, "public", other, "master", "5.1.0"))
    assert.equal(remote.git("rev-parse", "master"), tip)
    assert.equal(remote.git("tag", "-l", "5.1.0"), "")
    cleanup()
  })

  test("-f rewrites any branch", () => {
    const { repo, remote, cleanup } = setup()
    run(repo.dir, PUSH, "public", run(repo.dir, MIRROR, "HEAD"), "feat")
    const other = run(repo.dir, MIRROR, "HEAD^2")
    run(repo.dir, PUSH, "-f", "public", other, "feat")
    assert.equal(remote.git("rev-parse", "feat"), other)
    cleanup()
  })
})
