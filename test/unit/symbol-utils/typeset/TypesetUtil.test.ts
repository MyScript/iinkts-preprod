import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIIMath, buildIIText } from "../../helpers"

import type { TMath, TRotateContext, TText } from "@/iink"
import { MathUtil, MatrixTransform, TextUtil, TypesetUtil } from "@/iink"

/**
 * `TText` and `TMath` are the same shape but for the list they hold — `chars` against `elements` —
 * so before IIC-2013 their utils were the same code twice, and the resize path was one method on
 * `IIResizeManager` that branched on `isText(symbol)` twice to reach the right list and the right
 * derive.
 *
 * These tests hold what the shared base buys: `rotate` and `resize` behave identically for both
 * types because there is only one of each, and the one place they legitimately differ is an
 * override rather than an omission.
 */
describe("TypesetUtil", () => {
  let text: TextUtil
  let math: MathUtil

  beforeEach(() => {
    text = new TextUtil()
    math = new MathUtil()
  })

  const quarterTurn = () => MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })
  const context = (matrix: MatrixTransform): TRotateContext => ({
    matrix,
    center: { x: 0, y: 0 },
    typeset: { setBounds: () => {} },
  })

  test("both built-in typeset utils should share the base", () => {
    // Guards the guard: every assertion below is about inherited behaviour, and would pass
    // vacuously over two independent implementations.
    expect(text).toBeInstanceOf(TypesetUtil)
    expect(math).toBeInstanceOf(TypesetUtil)
  })

  describe("rotate, written once", () => {
    test("text should record the angle rather than move its point", () => {
      const symbol = buildIIText({ point: { x: 3, y: 4 } })
      text.rotate(symbol, context(quarterTurn()))
      expect(symbol.rotation?.degree).toBeCloseTo(90, 10)
      // Untouched: a typeset symbol is turned by the renderer, not by moving its glyphs.
      expect(symbol.point).toEqual({ x: 3, y: 4 })
    })

    test("math should do the same, from the same implementation", () => {
      const symbol = buildIIMath("y=3x+2", { point: { x: 3, y: 4 } })
      math.rotate(symbol, context(quarterTurn()))
      expect(symbol.rotation?.degree).toBeCloseTo(90, 10)
      expect(symbol.point).toEqual({ x: 3, y: 4 })
    })

    test("the recorded angle should accumulate across turns", () => {
      const symbol = buildIIText({ point: { x: 0, y: 0 } })
      text.rotate(symbol, context(quarterTurn()))
      text.rotate(symbol, context(quarterTurn()))
      expect(symbol.rotation?.degree).toBeCloseTo(180, 10)
    })

    test("text should re-measure afterwards and math should not", () => {
      // The one place the two differ, and it is an override calling `super` rather than a call math
      // happens to lack. Inherited from IIRotationManager and preserved deliberately.
      const measured: string[] = []
      const typeset = {
        setBounds: (symbol: TText | TMath) => {
          measured.push(symbol.type)
        },
      }
      text.rotate(buildIIText({ point: { x: 0, y: 0 } }), { ...context(quarterTurn()), typeset })
      math.rotate(buildIIMath(), { ...context(quarterTurn()), typeset })
      expect(measured).toEqual(["text"])
    })
  })

  describe("resize, written once", () => {
    const scale = () => MatrixTransform.identity().scale(2, 4, { x: 0, y: 0 })

    test("text should scale its characters", () => {
      const symbol = buildIIText({ chars: [{ id: "c", label: "a", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 0, y: 0, width: 1, height: 1 } }] })
      text.resize(symbol, { matrix: scale(), origin: { x: 0, y: 0 } })
      // The mean of the two axes: (2 + 4) / 2.
      expect(symbol.chars[0].fontSize).toBe(30)
    })

    test("math should scale its elements, by the same rule", () => {
      const symbol = buildIIMath()
      const before = symbol.elements[0].fontSize
      math.resize(symbol, { matrix: scale(), origin: { x: 0, y: 0 } })
      expect(symbol.elements[0].fontSize).toBe(+(before * 3).toFixed(3))
    })

    /** Why `resize` takes no typeset port where `translate` and `rotate` do. */
    const expectBoundsRebuilt = (symbol: TText | TMath, resized: () => void) => {
      const { width, height } = symbol.bounds
      resized()
      expect(symbol.bounds.width).toBe(+(width * 2).toFixed(3))
      expect(symbol.bounds.height).toBe(+(height * 4).toFixed(3))
      expect(symbol.bounds.angle).toBe(0)
    }

    test("text should rebuild its bounds from the scale factors rather than re-measure", () => {
      const symbol = buildIIText({ point: { x: 1, y: 1 } })
      expectBoundsRebuilt(symbol, () => text.resize(symbol, { matrix: scale(), origin: { x: 0, y: 0 } }))
    })

    test("math should rebuild its bounds the same way", () => {
      const symbol = buildIIMath("y=3x+2", { point: { x: 1, y: 1 } })
      expectBoundsRebuilt(symbol, () => math.resize(symbol, { matrix: scale(), origin: { x: 0, y: 0 } }))
    })
  })

  describe("aspect ratio", () => {
    test.each([["text"], ["math"]])("%s should always lock it", (name) => {
      // A typeset symbol is drawn from glyphs at a font size, and a font size is one number:
      // scaling the axes unequally would ask for glyphs that do not exist.
      const util = name === "text" ? text : math
      const symbol = name === "text" ? buildIIText() : buildIIMath()
      expect(util.keepsAspectRatio(symbol as never)).toBe(true)
    })
  })
})
