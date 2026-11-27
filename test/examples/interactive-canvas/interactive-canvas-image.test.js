import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, writePointers, waitForSynchronizedEvent, getCanvasSymbols, callCanvasExport } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

const PAGE = `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`
const JIIX = "application/vnd.myscript.jiix"
const WIDTH = 400
const HEIGHT = 200

/** A plain PNG drawn by the browser itself, so the test needs no fixture file */
const createPng = async (page) => {
  const dataUrl = await page.evaluate(
    ([width, height]) => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      context.fillStyle = "#c8e6c9"
      context.fillRect(0, 0, width, height)
      return canvas.toDataURL("image/png")
    },
    [WIDTH, HEIGHT]
  )
  return Buffer.from(dataUrl.split(",")[1], "base64")
}

const symbolTypes = async (page) => (await getCanvasSymbols(page)).map((s) => s.type)
const getImage = async (page) => (await getCanvasSymbols(page)).find((s) => s.type === "image")

/** Offsets that put the dataset strokes in the middle of the image */
const offsetsIntoImage = (image, strokes) => {
  const xs = strokes.flatMap((s) => s.pointers.map((p) => p.x))
  const ys = strokes.flatMap((s) => s.pointers.map((p) => p.y))
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2
  return {
    top: image.point.y + image.height / 2 - centerY,
    left: image.point.x + image.width / 2 - centerX,
  }
}

test.describe("Interactive ink canvas image", { tag: "@touch" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE)
    await passModalKey(page)
  })

  test("imports a picture from the menu, under the ink written over it, and the eraser spares it", async ({ page }) => {
    await test.step("import the picture from Import", async () => {
      await page.locator("#ms-menu-action").dispatchEvent("pointerdown")
      await page.locator("#ms-menu-action-import-trigger").dispatchEvent("pointerdown")
      await expect(page.locator("#ms-menu-action-import-file")).toContainText("Symbols (JSON) or image (PNG, JPEG)")
      await page
        .locator("#ms-menu-action-import-file-input")
        .setInputFiles({ name: "board.png", mimeType: "image/png", buffer: await createPng(page) })
      await page.locator("#ms-menu-action-import-file button").dispatchEvent("pointerup")

      await expect.poll(() => symbolTypes(page)).toEqual(["image"])
      const image = await getImage(page)
      expect([image.width, image.height]).toEqual([WIDTH, HEIGHT])
      await expect(page.locator(`#${image.id} image`)).toBeAttached()
      // Close the action menu so the strokes reach the canvas
      await page.locator("#ms-menu-action").dispatchEvent("pointerdown")
    })

    await test.step("write over the picture: the ink is recognized, the picture stays under it", async () => {
      const image = await getImage(page)
      const { top, left } = offsetsIntoImage(image, helloOneStroke.strokes)
      await Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, helloOneStroke.strokes, top, left)])

      expect(await symbolTypes(page)).toEqual(["image", "stroke"])
      const jiix = await callCanvasExport(page, JIIX)
      expect(jiix.elements.map((e) => e.label)).toEqual([helloOneStroke.exports[JIIX].label])
    })

    await test.step("erase across the ink and the picture's border: only the ink goes", async () => {
      const image = await getImage(page)
      await page.locator("#ms-menu-tool-erase").click()
      const y = image.point.y + image.height / 2
      const pointers = Array.from({ length: 30 }, (_, i) => ({ x: image.point.x - 20 + (i * (image.width + 40)) / 29, y }))
      await writePointers(page, pointers)

      await expect.poll(() => symbolTypes(page)).toEqual(["image"])
    })
  })

  test("imports a picture dropped on the canvas, centred where it was dropped", async ({ page }) => {
    const png = await createPng(page)
    const rootBox = await page.locator("#rootEl").boundingBox()
    const dataTransfer = await page.evaluateHandle((bytes) => {
      const transfer = new DataTransfer()
      transfer.items.add(new File([new Uint8Array(bytes)], "board.png", { type: "image/png" }))
      return transfer
    }, Array.from(png))

    await page.locator("#rootEl").dispatchEvent("drop", {
      dataTransfer,
      clientX: rootBox.x + 300,
      clientY: rootBox.y + 250,
    })

    await expect.poll(() => symbolTypes(page)).toEqual(["image"])
    const image = await getImage(page)
    expect(image.point.x + image.width / 2).toBeCloseTo(300, 0)
    expect(image.point.y + image.height / 2).toBeCloseTo(250, 0)
  })

  test("Ctrl+C then Ctrl+V still pastes the copied symbols", async ({ page }) => {
    await Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, helloOneStroke.strokes)])
    await page.evaluate(() => rootEl.iink.selectAll())

    await page.keyboard.press("ControlOrMeta+c")
    await page.keyboard.press("ControlOrMeta+v")

    await expect.poll(() => symbolTypes(page)).toEqual(["stroke", "stroke"])
  })
})
