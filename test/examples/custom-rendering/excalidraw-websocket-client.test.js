import { test, expect } from "@playwright/test"
import { writeStrokes } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import helloOneStrokeSurrounded from "../__dataset__/helloOneStrokeSurrounded"
import helloStrike from "../__dataset__/helloStrike"
import threeScratchOut from "../__dataset__/threeScratchOut"
import rectangleShape from "../__dataset__/rectangleShape"

// Keeps the strokes clear of the toolbar on top and of the pen properties panel on the left
const OFFSET = { x: 250, y: 150 }

const shift = (strokes) => strokes.map(s => ({
  ...s,
  pointers: s.pointers.map(p => ({ ...p, x: p.x + OFFSET.x, y: p.y + OFFSET.y }))
}))

// No dataset holds an underline: a straight stroke just below "hello"
const underline = {
  pointers: Array.from({ length: 20 }, (_, i) => ({ x: 250 + i * 5, y: 268, t: i * 20, p: 0.5 }))
}

// Excalidraw draws on a canvas: the scene is read through the API the example exposes
const readScene = (page) => page.evaluate(() => ({
  elements: window.excalidrawAPI.getSceneElements().map(e => ({ id: e.id, type: e.type, text: e.text, strokeWidth: e.strokeWidth })),
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
  await writeStrokes(page, shift(content))
  await expect.poll(() => countOf(page, "freedraw")).toBe(content.length)
  await expect.poll(() => contentChangedCounts.get(page) - before, { timeout: 15_000 }).toBeGreaterThanOrEqual(content.length)
  await writeStrokes(page, shift(strokes.slice(-1)))
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

  test("should convert handwriting into a text element", async ({ page }) => {
    await writeStrokes(page, shift(helloOneStroke.strokes))
    await expect.poll(() => countOf(page, "freedraw")).toBe(1)

    await page.getByTestId("convert-button").click()

    await expect.poll(async () => (await readScene(page)).elements).toEqual([
      expect.objectContaining({ type: "text", text: "hello" })
    ])
  })

  test("should convert a drawn rectangle into a rectangle element", async ({ page }) => {
    await writeStrokes(page, shift(rectangleShape.strokes))
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
    await writeStrokes(page, shift(helloOneStroke.strokes))
    await expect.poll(() => countOf(page, "freedraw")).toBe(1)
    const [hello] = (await readScene(page)).elements

    await writeStrokes(page, shift([underline]))

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
