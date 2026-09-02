import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { test } from "@playwright/test"

import { generateDocument } from "../perf/lib/generateDocument.ts"
// The shared e2e helpers are plain JavaScript; `allowJs` lets them resolve, `checkJs` keeps them out
// of this project's type checking.
import { passModalKey } from "../examples/helper.js"
import { installProbe, measure, type TScenarioMeasurement } from "./lib/instrument.ts"

/**
 * The four perf targets of the v5 roadmap (decision D-6), measured in a real browser rather than in
 * jsdom. Reported, never gated: browser numbers are too noisy to fail a pull request on. They exist
 * to confirm that a micro-bench win is felt where the user is.
 */
const PAGE = "/examples/interactive-canvas/interactive_canvas_get_started.html"

/** Document loaded before the interaction scenarios. Small on purpose — see the report notes. */
const DOCUMENT_SIZE = Number(process.env.PERF_E2E_DOCUMENT ?? 150)

/** Fixed seed, shared with the node micro-benches, so both measure the same geometry. */
const SEED = 20260827

const REPORT = resolve(process.cwd(), ".local/bench/perf-e2e.json")

const results: Record<string, TScenarioMeasurement> = {}

type TCanvasWindow = {
  rootEl: {
    iink: {
      importPointEvents(strokes: unknown[]): Promise<unknown>
      pan(dx: number, dy: number): void
      zoom(z: number): void
      selectAll(): void
      unselectAll(): void
      tool: string
      model: { symbols: { id: string }[]; symbolsSelected: { id: string }[] }
    }
  }
}

/** The generated document in the shape `importPointEvents` accepts. */
function documentStrokes(count: number): unknown[] {
  return generateDocument(count, SEED).map((s) => ({ pointerType: s.pointerType, pointers: s.pointers }))
}

test.describe("browser perf scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await installProbe(page)
    await page.goto(PAGE)
    await passModalKey(page)
  })

  test.afterAll(() => {
    mkdirSync(dirname(REPORT), { recursive: true })
    writeFileSync(
      REPORT,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), documentSize: DOCUMENT_SIZE, results }, null, 2)}\n`
    )
    const width = Math.max(...Object.keys(results).map((k) => k.length))
    console.log(`\nbrowser perf, document of ${DOCUMENT_SIZE} strokes — reported, not gated\n`)
    for (const [name, m] of Object.entries(results)) {
      console.log(
        `${name.padEnd(width)}  wall ${String(m.wallMs).padStart(6)} ms  blocking ${String(m.blockingMs).padStart(5)} ms ` +
          `(${m.longTaskCount} tasks, longest ${m.longestTaskMs} ms)  frames p50 ${m.frameP50Ms} / p95 ${m.frameP95Ms} / max ${m.frameMaxMs} ms  dropped ${m.droppedFrames}`
      )
    }
    console.log(`\nreport written to ${REPORT}`)
  })

  test("import a document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    results[`import ${DOCUMENT_SIZE} strokes`] = await measure(page, async () => {
      await page.evaluate(
        async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
        strokes
      )
    })
  })

  test("write a stroke on a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )

    // A real pointer stroke, not an API call: this is the write-latency path the user feels.
    const editor = page.locator("#rootEl")
    const box = await editor.boundingBox()
    if (!box) throw new Error("the canvas has no bounding box")

    results["write one stroke"] = await measure(page, async () => {
      await page.mouse.move(box.x + 60, box.y + box.height - 80)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(box.x + 60 + i * 4, box.y + box.height - 80 + Math.sin(i / 4) * 12)
      }
      await page.mouse.up()
    })
  })

  test("pan and zoom across a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )

    results["pan 90 frames"] = await measure(page, async () => {
      // Driven one step per animation frame, so the measured frame intervals are the library's
      // response to a viewport change rather than Playwright's command round trip.
      await page.evaluate(async () => {
        const canvas = (window as unknown as TCanvasWindow).rootEl.iink
        for (let i = 0; i < 90; i++) {
          await new Promise((r) => requestAnimationFrame(() => r(undefined)))
          canvas.pan(i % 2 === 0 ? -6 : 6, i % 3 === 0 ? -4 : 2)
        }
      })
    })

    results["zoom 30 steps"] = await measure(page, async () => {
      await page.evaluate(async () => {
        const canvas = (window as unknown as TCanvasWindow).rootEl.iink
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => requestAnimationFrame(() => r(undefined)))
          canvas.zoom(i % 2 === 0 ? 1.05 : 0.95)
        }
      })
    })
  })

  test("drag a full selection", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )
    await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.selectAll())

    const editor = page.locator("#rootEl")
    const box = await editor.boundingBox()
    if (!box) throw new Error("the canvas has no bounding box")

    results[`drag ${DOCUMENT_SIZE} selected symbols`] = await measure(page, async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      for (let i = 1; i <= 30; i++) {
        await page.mouse.move(box.x + box.width / 2 + i * 3, box.y + box.height / 2 + i * 2)
      }
      await page.mouse.up()
    })
  })
  test("erase across a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )
    const before = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "erase"))

    const editor = page.locator("#rootEl")
    const box = await editor.boundingBox()
    if (!box) throw new Error("the canvas has no bounding box")

    // Along the first baselines, where generateDocument lays its words out. An erase drag through
    // empty space would report a clean zero while measuring nothing, so the assertion below is part
    // of the scenario rather than a nicety.
    results[`erase across ${DOCUMENT_SIZE} strokes`] = await measure(page, async () => {
      await page.mouse.move(box.x + 40, box.y + 70)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(box.x + 40 + i * 14, box.y + 70 + (i % 6) * 12)
      }
      await page.mouse.up()
    })

    const after = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    if (after >= before) {
      throw new Error(`the erase drag removed nothing (${before} -> ${after}): the path missed the ink`)
    }
  })

  test("lasso-select across a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )
    await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "select"))

    const editor = page.locator("#rootEl")
    const box = await editor.boundingBox()
    if (!box) throw new Error("the canvas has no bounding box")

    // Growing the selection rectangle is what costs: the manager re-evaluates which symbols the box
    // covers on every pointermove. This is the path `drag a full selection` never touches, because
    // that one starts from selectAll().
    results[`lasso over ${DOCUMENT_SIZE} strokes`] = await measure(page, async () => {
      // Starts below the menu bar and left of LEFT_MARGIN, on empty canvas: a pointerdown on ink
      // would begin a symbol drag instead of a selection rectangle, and one on the menu would not
      // reach the canvas at all.
      await page.mouse.move(box.x + 12, box.y + 48)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(box.x + 12 + i * 18, box.y + 48 + i * 9)
      }
      await page.mouse.up()
    })

    const selected = await page.evaluate(
      () => (window as unknown as TCanvasWindow).rootEl.iink.model.symbolsSelected.length
    )
    if (selected === 0) {
      throw new Error("the lasso selected nothing: the rectangle missed the ink")
    }
  })
})
