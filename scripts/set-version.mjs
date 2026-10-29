#!/usr/bin/env node
/**
 * Writes the version given as argument into `package.json#version`, and nothing else.
 * CI calls it twice: with the computed version before the bump commit, then with the preprod
 * suffix (`-beta.<build>`, `-alpha.<target>.<build>`) before building, uncommitted.
 */
import { readFileSync, writeFileSync } from "fs"
import process from "process"
import { URL } from "url"

const VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/

const [version] = process.argv.slice(2)
if (!VERSION.test(version ?? "")) {
  process.stderr.write(`Not a version: "${version}"\n`)
  process.exit(1)
}
const path = new URL("../package.json", import.meta.url)
const pkg = JSON.parse(readFileSync(path, "utf-8"))
pkg.version = version
writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
