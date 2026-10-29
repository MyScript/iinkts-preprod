import { test, expect } from "@playwright/test"
import { writeStrokes } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import helloOneStrokeSurrounded from "../__dataset__/helloOneStrokeSurrounded"
import helloStrike from "../__dataset__/helloStrike"
import threeScratchOut from "../__dataset__/threeScratchOut"
import rectangleShape from "../__dataset__/rectangleShape"

// Widest dataset written here (the surround), in canvas pixels once shifted by the offset
const WIDEST_STROKES_RIGHT = 480

// Keeps the strokes clear of the toolbar on top and of the pen properties panel on the left.
// Between the example's side panels the canvas is narrower: Excalidraw then folds that panel away,
// and the strokes are pulled left so the widest dataset still fits
const offsetOf = async (page) => {
  const { width } = await page.locator("#rootEl").boundingBox()
  return { x: Math.min(250, width - WIDEST_STROKES_RIGHT), y: 150 }
}

// Pointers are relative to the canvas: writeStrokes adds the canvas position on the page
const shift = async (page, strokes) => {
  const offset = await offsetOf(page)
  return strokes.map(s => ({
    ...s,
    pointers: s.pointers.map(p => ({ ...p, x: p.x + offset.x, y: p.y + offset.y }))
  }))
}

// No dataset holds an underline: a straight stroke just below "hello"
const underline = {
  pointers: Array.from({ length: 20 }, (_, i) => ({ x: 250 + i * 5, y: 268, t: i * 20, p: 0.5 }))
}

// Excalidraw draws on a canvas: the scene is read through the API the example exposes
const readScene = (page) => page.evaluate(() => ({
  elements: window.excalidrawAPI.getSceneElements().map(e => ({ id: e.id, type: e.type, text: e.text, strokeWidth: e.strokeWidth, strokeColor: e.strokeColor })),
  selectedIds: Object.keys(window.excalidrawAPI.getAppState().selectedElementIds),
}))

const countOf = async (page, type) => (await readScene(page)).elements.filter(e => e.type === type).length

/** How many contentChanged the server sent on the example's socket, one per stroke batch read */
const contentChangedCounts = new WeakMap()
const countContentChanged = (page) => {
  contentChangedCounts.set(page, 0)
  page.on("websocket", (socket) =>
    socket.on("framereceived", (frame) => {
      if (String(frame.payload).includes('"contentChanged"')) {
        contentChangedCounts.set(page, contentChangedCounts.get(page) + 1)
      }
    })
  )
}

// The last stroke of a gesture dataset is the gesture. It is only drawn once the server has read
// the content: sent before that answer, a strike-through over a word it has not recognized yet
// comes back as no gesture at all, and the strokes stay.
const writeContentThenGesture = async (page, strokes) => {
  const content = strokes.slice(0, -1)
  const before = contentChangedCounts.get(page)
  await writeStrokes(page, await shift(page, content))
  await expect.poll(() => countOf(page, "freedraw")).toBe(content.length)
  await expect.poll(() => contentChangedCounts.get(page) - before, { timeout: 15_000 }).toBeGreaterThanOrEqual(content.length)
  await writeStrokes(page, await shift(page, strokes.slice(-1)))
}

test.describe("Excalidraw WebSocket client", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    countContentChanged(page)
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/custom-rendering/excalidraw-websocket-client/dist/index.html`)
    await page.getByLabel("Scheme:").selectOption(process.env.SCHEME)
    await page.getByRole("textbox", { name: "Host:" }).fill(process.env.HOST)
    await page.getByRole("textbox", { name: "Application Key:" }).fill(process.env.APPLICATION_KEY)
    await page.getByRole("textbox", { name: "HMAC Key:" }).fill(process.env.HMAC_KEY)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByTestId("convert-button")).toBeEnabled({ timeout: 10_000 })
  })

  test("should list what the server recognized in the recognition panel", async ({ page }) => {
    // Below 1200px the panel is an overlay, closed until its header button opens it
    const resultsToggle = page.locator('button[aria-controls="results-panel"]')
    if (await resultsToggle.isVisible()) {
      await resultsToggle.click()
    }

    await writeStrokes(page, await shift(page, helloOneStroke.strokes))

    await expect(page.locator("#recognition-elements")).toContainText("hello", { timeout: 15_000 })
    await expect(page.locator("#recognition-jiix")).toContainText('"type": "Raw Content"')
  })

  test("should highlight the strokes of the hovered recognized element", async ({ page }) => {
    const resultsToggle = page.locator('button[aria-controls="results-panel"]')
    if (await resultsToggle.isVisible()) {
      await resultsToggle.click()
    }
    await writeStrokes(page, await shift(page, helloOneStroke.strokes))
    const item = page.locator("#recognition-elements li", { hasText: "hello" })
    await expect(item).toBeVisible({ timeout: 15_000 })
    const [hello] = (await readScene(page)).elements

    await item.hover()
    await expect.poll(async () => (await readScene(page)).elements[0].strokeColor).not.toBe(hello.strokeColor)

    await page.locator("#recognition-jiix").hover()
    await expect.poll(async () => (await readScene(page)).elements[0].strokeColor).toBe(hello.strokeColor)
  })

  test("should convert handwriting into a text element", async ({ page }) => {
    await writeStrokes(page, await shift(page, helloOneStroke.strokes))
    await expect.poll(() => countOf(page, "freedraw")).toBe(1)

    await page.getByTestId("convert-button").click()

    await expect.poll(async () => (await readScene(page)).elements).toEqual([
      expect.objectContaining({ type: "text", text: "hello" })
    ])
  })

  test("should convert a drawn rectangle into a rectangle element", async ({ page }) => {
    await writeStrokes(page, await shift(page, rectangleShape.strokes))
    await expect.poll(() => countOf(page, "freedraw")).toBe(rectangleShape.strokes.length)

    await page.getByTestId("convert-button").click()

    await expect.poll(() => countOf(page, "rectangle")).toBe(1)
  })

  test("should erase the strokes under a scratch-out", async ({ page }) => {
    await writeContentThenGesture(page, threeScratchOut.strokes)

    await expect.poll(() => countOf(page, "freedraw"), { timeout: 5_000 }).toBe(0)
  })

  test("should erase the strokes under a strike-through", async ({ page }) => {
    await writeContentThenGesture(page, helloStrike.strokes)

    await expect.poll(() => countOf(page, "freedraw"), { timeout: 5_000 }).toBe(0)
  })

  test("should thicken the strokes above an underline", async ({ page }) => {
    await writeStrokes(page, await shift(page, helloOneStroke.strokes))
    await expect.poll(() => countOf(page, "freedraw")).toBe(1)
    const [hello] = (await readScene(page)).elements

    await writeStrokes(page, await shift(page, [underline]))

    await expect.poll(async () => (await readScene(page)).elements, { timeout: 5_000 }).toEqual([
      expect.objectContaining({ id: hello.id, strokeWidth: hello.strokeWidth * 2 })
    ])
  })

  test("should select the strokes inside a surround", async ({ page }) => {
    await writeContentThenGesture(page, helloOneStrokeSurrounded.strokes)

    await expect.poll(async () => (await readScene(page)).elements.length, { timeout: 5_000 }).toBe(1)
    const { elements, selectedIds } = await readScene(page)
    expect(selectedIds).toEqual([elements[0].id])
  })
})
