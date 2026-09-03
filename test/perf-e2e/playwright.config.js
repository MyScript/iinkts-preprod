import process from "node:process"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"

/**
 * Browser-side performance scenarios. Separate from `test/examples` on purpose: those assert
 * behaviour and must stay fast and parallel; these measure timing and must run alone, on one
 * browser, with retries off — a retried perf run would silently report the luckier number.
 *
 * Reported, never gated. Browser numbers are too noisy to fail a pull request on; they exist to
 * confirm that a micro-bench win is felt where the user is.
 */
export default defineConfig({
  globalSetup: "../examples/global-setup.js",
  testDir: ".",
  testMatch: "**/*.perf.ts",
  outputDir: "test-results",
  retries: 0,
  workers: 1,
  timeout: 5 * 60 * 1000,
  reporter: "list",
  use: {
    headless: process.env.HEADLESS === "false" ? false : true,
    baseURL: process.env.BASE_URL || "http://localhost:8000",
    trace: "off",
    video: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node test/perf-e2e/staticServer.mjs",
    // Pinned to the repository root: `cwd` otherwise defaults to this config's directory, which
    // both doubles the command path and makes the server serve the wrong root — it serves
    // `process.cwd()`, and the scenarios ask for `/examples` and `/dist`.
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    url: "http://localhost:8000/examples/index.html",
    reuseExistingServer: true,
    timeout: 30 * 1000,
  },
})
