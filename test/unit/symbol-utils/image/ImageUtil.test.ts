import { beforeAll, describe, expect, test } from "@jest/globals"

import {
  createSymbolFromPartial,
  ImageUtil,
  MatrixTransform,
  OBBOps,
  registerBuiltinSymbolUtils,
  SymbolGeometry,
  symbolRegistry,
  SymbolType,
  type TImage,
} from "@/iink"

import { buildIIImage, PNG_1PX_DATA_URL } from "../../helpers"

const imageUtil = () => symbolRegistry.getUtil<TImage>(SymbolType.Image)!

describe("ImageUtil.ts", () => {
  beforeAll(() => registerBuiltinSymbolUtils())

  describe("createImage", () => {
    test("places the image on the box it is given", () => {
      const image = ImageUtil.createImage(PNG_1PX_DATA_URL, { x: 10, y: 20, width: 100, height: 50 })
      expect(image.type).toBe(SymbolType.Image)
      expect(image.id).toMatch(/^image-/)
      expect(image.src).toBe(PNG_1PX_DATA_URL)
      expect(image.point).toEqual({ x: 10, y: 20 })
      expect(image.width).toBe(100)
      expect(image.height).toBe(50)
      expect(image.transform).toEqual(MatrixTransform.identity())
    })

    test("refuses a format other than PNG or JPEG", () => {
      expect(() => ImageUtil.createImage("data:image/gif;base64,R0lGOD", { x: 0, y: 0, width: 1, height: 1 })).toThrow(
        "image/gif"
      )
    })

    test("refuses a source that is not a data URL", () => {
      expect(() => ImageUtil.createImage("https://example.com/a.png", { x: 0, y: 0, width: 1, height: 1 })).toThrow()
    })
  })

  describe("createFromPartial", () => {
    test("keeps the id and the transform of a saved image", () => {
      const saved = buildIIImage()
      saved.transform = MatrixTransform.identity().translate(5, 5)
      const image = createSymbolFromPartial({ ...saved })
      expect(image).toEqual(saved)
    })

    test("throws without a size", () => {
      expect(() => ImageUtil.createFromPartial({ src: PNG_1PX_DATA_URL, point: { x: 0, y: 0 } })).toThrow("size")
    })

    test("throws without a source", () => {
      expect(() => ImageUtil.createFromPartial({ point: { x: 0, y: 0 }, width: 1, height: 1 })).toThrow("src")
    })
  })

  describe("geometry", () => {
    test("is the box of the image, inside included", () => {
      const image = buildIIImage({ box: { x: 10, y: 20, width: 100, height: 50 } })
      expect(OBBOps.toBox(SymbolGeometry.boundsOf(image))).toEqual({ x: 10, y: 20, width: 100, height: 50 })
      expect(imageUtil().overlaps(image, { x: 50, y: 40, width: 2, height: 2 })).toBe(true)
      expect(imageUtil().overlaps(image, { x: 200, y: 200, width: 2, height: 2 })).toBe(false)
    })

    test("snaps on its box", () => {
      const image = buildIIImage({ box: { x: 0, y: 0, width: 10, height: 10 } })
      expect(imageUtil().getSnapPoints(image)).toContainEqual({ x: 0, y: 0 })
    })

    test("keeps its aspect ratio on resize", () => {
      expect(imageUtil().keepsAspectRatio(buildIIImage())).toBe(true)
    })
  })

  describe("getSVGElement", () => {
    test("draws an <image> over the box, inside the symbol group", () => {
      const image = buildIIImage({ box: { x: 10, y: 20, width: 100, height: 50 } })
      const group = imageUtil().getSVGElement(image)!
      expect(group.getAttribute("id")).toBe(image.id)
      expect(group.getAttribute("type")).toBe("image")
      const el = group.querySelector("image")!
      expect(el.getAttribute("href")).toBe(PNG_1PX_DATA_URL)
      expect(el.getAttribute("x")).toBe("10")
      expect(el.getAttribute("y")).toBe("20")
      expect(el.getAttribute("width")).toBe("100")
      expect(el.getAttribute("height")).toBe("50")
      expect(el.getAttribute("preserveAspectRatio")).toBe("none")
    })
  })

  describe("fitBox", () => {
    const view = { x: 0, y: 0, width: 1000, height: 500 }

    test("keeps a small picture at its natural size, centred in the view", () => {
      expect(ImageUtil.fitBox({ width: 100, height: 50 }, view)).toEqual({ x: 450, y: 225, width: 100, height: 50 })
    })

    test("shrinks a big picture to 80% of the view, ratio kept", () => {
      expect(ImageUtil.fitBox({ width: 2000, height: 2000 }, view)).toEqual({ x: 300, y: 50, width: 400, height: 400 })
    })

    test("centres the picture on the point it is given", () => {
      expect(ImageUtil.fitBox({ width: 100, height: 50 }, view, { center: { x: 50, y: 50 } })).toEqual({
        x: 0,
        y: 25,
        width: 100,
        height: 50,
      })
    })

    test("uses the width it is given, ratio kept", () => {
      expect(ImageUtil.fitBox({ width: 100, height: 50 }, view, { width: 300 })).toEqual({
        x: 350,
        y: 175,
        width: 300,
        height: 150,
      })
    })
  })

  describe("bytes", () => {
    test("getMimeType reads the format from the source", () => {
      expect(ImageUtil.getMimeType(buildIIImage())).toBe("image/png")
    })

    test("toBlob gives back the bytes, for a future image recognition", async () => {
      const blob = ImageUtil.toBlob(buildIIImage())
      expect(blob.type).toBe("image/png")
      // jsdom's Blob has no arrayBuffer()
      const buffer = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.readAsArrayBuffer(blob)
      })
      const bytes = new Uint8Array(buffer)
      // PNG signature
      expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47])
    })
  })
})
