import type { TInteractiveInkCanvasOptions } from "@/iink"
import { DefaultInteractiveInkCanvasConfiguration, InteractiveInkCanvas, isImage } from "@/iink"

import { buildIIStroke } from "../../helpers"

describe("InteractiveInkCanvas importImage", () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ result: {} }) })) as jest.Mock
  const options: TInteractiveInkCanvasOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
  }
  const png = () => new Blob(["x"], { type: "image/png" })

  // jsdom never decodes a picture: its load and natural size are simulated on the element
  let imageSpy: jest.SpyInstance
  beforeEach(() => {
    imageSpy = jest.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(function (
      this: HTMLImageElement
    ) {
      Object.defineProperty(this, "naturalWidth", { value: 200 })
      Object.defineProperty(this, "naturalHeight", { value: 100 })
      setTimeout(() => this.dispatchEvent(new Event("load")))
    })
  })
  afterEach(() => imageSpy.mockRestore())

  const buildCanvas = async (): Promise<InteractiveInkCanvas> => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), options)
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve())
    canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())
    await canvas.initialize()
    canvas.renderer.getViewBox = jest.fn(() => ({ x: 0, y: 0, width: 1000, height: 500 }))
    return canvas
  }

  test("adds the picture at its natural size, in the middle of the view", async () => {
    const canvas = await buildCanvas()

    const image = await canvas.importImage(png())

    expect(isImage(image)).toBe(true)
    expect(image.src).toBe("data:image/png;base64,eA==")
    expect({ ...image.point, width: image.width, height: image.height }).toEqual({
      x: 400,
      y: 200,
      width: 200,
      height: 100,
    })
    expect(canvas.model.getSymbol(image.id)).toBeDefined()
  })

  test("puts the picture under the ink already written", async () => {
    const canvas = await buildCanvas()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)

    const image = await canvas.importImage(png())

    expect(canvas.model.symbols.map((s) => s.id)).toEqual([image.id, stroke.id])
  })

  test("never sends the picture to the recognizer", async () => {
    const canvas = await buildCanvas()

    await canvas.importImage(png())

    expect(canvas.client.addStrokes).toHaveBeenCalledWith([], false)
  })

  test("is one undo step, and redo puts it back under the ink", async () => {
    const canvas = await buildCanvas()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    const image = await canvas.importImage(png())

    await canvas.undo()
    expect(canvas.model.getSymbol(image.id)).toBeUndefined()

    await canvas.redo()
    expect(canvas.model.symbols.map((s) => s.id)).toEqual([image.id, stroke.id])
  })

  test("refuses a format other than PNG or JPEG", async () => {
    const canvas = await buildCanvas()

    await expect(canvas.importImage(new Blob(["x"], { type: "image/gif" }))).rejects.toThrow("image/gif")
    expect(canvas.model.symbols).toHaveLength(0)
  })

  describe("drop", () => {
    // jsdom has no DragEvent: a plain event carries the dropped files
    const dropEvent = (type: "dragover" | "drop", files: File[]) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, "dataTransfer", { value: { files, types: ["Files"] } })
      Object.defineProperty(event, "clientX", { value: 110 })
      Object.defineProperty(event, "clientY", { value: 120 })
      return event
    }
    const dropOn = async (canvas: InteractiveInkCanvas, files: File[]) => {
      // The layer maps the page onto the document: here, a plain shift of (10, 20)
      canvas.renderer.layer.getScreenCTM = jest.fn(
        () => ({ inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: -10, f: -20 }) }) as DOMMatrix
      )
      canvas.importImage = jest.fn(canvas.importImage.bind(canvas))
      const event = dropEvent("drop", files)
      canvas.layers.root.dispatchEvent(event)
      await new Promise((resolve) => setTimeout(resolve, 10))
      return event
    }

    test("lets a dragged file be dropped on the canvas", async () => {
      const canvas = await buildCanvas()
      const event = dropEvent("dragover", [])
      canvas.layers.root.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })

    test("imports a dropped picture centred where it was dropped", async () => {
      const canvas = await buildCanvas()
      const file = new File(["x"], "board.png", { type: "image/png" })

      const event = await dropOn(canvas, [file])

      expect(event.defaultPrevented).toBe(true)
      expect(canvas.importImage).toHaveBeenCalledWith(file, { center: { x: 100, y: 100 } })
    })

    test("ignores a dropped file that is not a picture", async () => {
      const canvas = await buildCanvas()

      await dropOn(canvas, [new File(["{}"], "doc.json", { type: "application/json" })])

      expect(canvas.importImage).not.toHaveBeenCalled()
    })
  })
})
