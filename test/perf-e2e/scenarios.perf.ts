import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { test, type Page } from "@playwright/test"

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

/**
 * There is no size ceiling on the pointer-driven scenarios, and the reason is worth keeping.
 *
 * They used to skip above 1000 strokes: importing more ended with a "connection to the recognition
 * server" error whose modal backdrop swallowed every subsequent gesture, so a drag reported a clean
 * measurement of nothing. That was never a defect of its own — it was a symptom of the quadratic
 * import this branch removes. While a 3000-stroke import blocked the main thread for ~133 s, the
 * WebSocket keepalive starved and the session dropped. Re-measured after the fix: 1000, 2000, 3000
 * and 4419 all import cleanly and every scenario asserts a real effect, so the ceiling now only
 * hides the sizes worth measuring.
 *
 * What guards these scenarios is the effect assertion at the end of each one, not a stroke count. If
 * a modal ever swallows a gesture again it fails loudly and `describePoint` names what was hit.
 */

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

/**
 * What the browser thinks is under a viewport point, and how the canvas is laid out there. Used only
 * to explain a scenario that touched nothing: a gesture can land on an overlay, or on a detached
 * region, and the failure message has to say which.
 */
async function describePoint(page: Page, x: number, y: number): Promise<string> {
  return await page.evaluate(
    ({ px, py }) => {
      const el = document.elementFromPoint(px, py)
      const describe = (n: Element | null) =>
        n
          ? `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}${n.classList.length ? "." + [...n.classList].join(".") : ""}`
          : "none"
      const modal = document.querySelector(".ms-modal")
      const rendering = document.querySelector(".ms-rendering") ?? document.querySelector("svg")
      const r = rendering?.getBoundingClientRect()
      return [
        modal ? `MODAL OPEN: ${(modal.textContent ?? "").trim().slice(0, 160)}` : "no modal",
        `point (${Math.round(px)},${Math.round(py)}) -> ${describe(el)}`,
        `parent ${describe(el?.parentElement ?? null)}`,
        `rendering rect ${r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` : "none"}`,
        `viewport ${window.innerWidth}x${window.innerHeight}`,
      ].join(" | ")
    },
    { px: x, py: y }
  )
}

/**
 * Viewport rect of the first rendered symbol that is actually on screen. Derived by measurement
 * rather than from `generateDocument`'s page layout: at 3000 strokes the content is ~6360px tall, the
 * canvas element outgrows the viewport, and offsets computed from the element's box stop landing on
 * ink. The SVG renderer also virtualizes, so an off-screen symbol has no element at all.
 */
async function firstVisibleSymbolRect(page: Page): Promise<{ id: string; x: number; y: number; w: number; h: number }> {
  const rect = await page.evaluate(() => {
    const canvas = (window as unknown as TCanvasWindow).rootEl.iink
    for (const symbol of canvas.model.symbols) {
      const el = document.getElementById(symbol.id)
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (r.width > 2 && r.height > 2 && r.top > 0 && r.bottom < window.innerHeight) {
        return { id: symbol.id, x: r.x, y: r.y, w: r.width, h: r.height }
      }
    }
    return null
  })
  if (!rect) throw new Error("no rendered symbol is visible in the viewport")
  return rect
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
    await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "write"))

    // A real pointer stroke, not an API call: this is the write-latency path the user feels. The
    // start point is anchored on ink that is provably on screen, because an offset taken from the
    // canvas element's own box lands past the viewport as soon as the document outgrows it, and a
    // stroke drawn off screen reports a clean measurement of nothing.
    const before = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    const ink = await firstVisibleSymbolRect(page)
    const startX = Math.max(1, ink.x)
    const startY = Math.max(20, ink.y - 14)

    results["write one stroke"] = await measure(page, async () => {
      await page.mouse.move(startX, startY)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(startX + i * 4, startY + Math.sin(i / 4) * 12)
      }
      await page.mouse.up()
    })

    const after = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    if (after <= before) {
      const where = await describePoint(page, startX, startY)
      throw new Error(
        `the pointer stroke created no symbol (${before} -> ${after}). ` +
          `start ${Math.round(startX)},${Math.round(startY)} | ${where}`
      )
    }
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

    // Grabbed on ink that is provably on screen: the centre of the canvas element is past the
    // viewport once the document outgrows it, and a pointerdown there drags nothing while still
    // reporting a plausible number.
    const ink = await firstVisibleSymbolRect(page)
    const grabX = ink.x + ink.w / 2
    const grabY = ink.y + ink.h / 2

    results[`drag ${DOCUMENT_SIZE} selected symbols`] = await measure(page, async () => {
      await page.mouse.move(grabX, grabY)
      await page.mouse.down()
      for (let i = 1; i <= 30; i++) {
        await page.mouse.move(grabX + i * 3, grabY + i * 2)
      }
      await page.mouse.up()
    })

    const moved = await page.evaluate((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y }
    }, ink.id)
    if (!moved || (Math.abs(moved.x - ink.x) < 2 && Math.abs(moved.y - ink.y) < 2)) {
      const where = await describePoint(page, grabX, grabY)
      throw new Error(
        `the drag moved nothing: symbol ${ink.id} stayed at ` +
          `${moved ? `${Math.round(moved.x)},${Math.round(moved.y)}` : "no element"} ` +
          `(was ${Math.round(ink.x)},${Math.round(ink.y)}) | ${where}`
      )
    }
  })
  test("erase across a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )
    const before = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "erase"))

    // An erase drag through empty space would report a clean zero while measuring nothing, so the
    // path is anchored on a symbol that is provably on screen and the assertion below is part of the
    // scenario rather than a nicety.
    const ink = await firstVisibleSymbolRect(page)

    results[`erase across ${DOCUMENT_SIZE} strokes`] = await measure(page, async () => {
      await page.mouse.move(ink.x, ink.y + ink.h / 2)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(ink.x + i * 14, ink.y + ink.h / 2 + (i % 6) * 8)
      }
      await page.mouse.up()
    })

    const after = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
    if (after >= before) {
      const where = await describePoint(page, ink.x, ink.y + ink.h / 2)
      throw new Error(
        `the erase drag removed nothing (${before} -> ${after}). ` +
          `ink rect ${Math.round(ink.x)},${Math.round(ink.y)} ${Math.round(ink.w)}x${Math.round(ink.h)} | ${where}`
      )
    }
  })

  test("lasso-select across a loaded document", async ({ page }) => {
    const strokes = documentStrokes(DOCUMENT_SIZE)
    await page.evaluate(
      async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
      strokes
    )
    await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "select"))

    // Growing the selection rectangle is what costs: the manager re-evaluates which symbols the box
    // covers on every pointermove. This is the path `drag a full selection` never touches, because
    // that one starts from selectAll().
    const ink = await firstVisibleSymbolRect(page)

    results[`lasso over ${DOCUMENT_SIZE} strokes`] = await measure(page, async () => {
      // Starts just above and left of the ink, on empty canvas: generateDocument leaves the space
      // between baselines sparse. A pointerdown on ink would begin a symbol drag instead of a
      // selection rectangle.
      const startX = Math.max(1, ink.x - 12)
      const startY = Math.max(1, ink.y - 12)
      await page.mouse.move(startX, startY)
      await page.mouse.down()
      for (let i = 1; i <= 40; i++) {
        await page.mouse.move(startX + i * 18, startY + i * 9)
      }
      await page.mouse.up()
    })

    const selected = await page.evaluate(
      () => (window as unknown as TCanvasWindow).rootEl.iink.model.symbolsSelected.length
    )
    if (selected === 0) {
      const where = await describePoint(page, Math.max(1, ink.x - 12), Math.max(1, ink.y - 12))
      throw new Error(
        `the lasso selected nothing. ` +
          `ink rect ${Math.round(ink.x)},${Math.round(ink.y)} ${Math.round(ink.w)}x${Math.round(ink.h)} | ${where}`
      )
    }
  })
})
