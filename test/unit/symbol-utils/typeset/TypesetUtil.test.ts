import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIIMath, buildIIText } from "../../helpers"

import type { TMath, TRotateContext, TText } from "@/iink"
import { BoxOps, MathUtil, MatrixTransform, OBBOps, TextUtil, TypesetUtil } from "@/iink"

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

    /**
     * This used to assert the opposite — that text re-measured after a turn and math did not — on
     * the reading that the asymmetry inherited from `IIRotationManager` was deliberate. It was not.
     * The text call set `bounds.angle` and nothing else, since the measurement cannot depend on the
     * angle, and math was left never updating its derived fields at all. Both now do the same work,
     * and neither re-measures.
     */
    test.each([
      ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
      ["math", () => buildIIMath()],
    ])("%s should record the angle on its bounds and re-derive, without re-measuring", (name, build) => {
      const symbol = build()
      const before = { width: symbol.bounds.width, height: symbol.bounds.height }
      const util = name === "text" ? text : math

      util.rotate(symbol as never, context(quarterTurn()))

      expect(symbol.bounds.angle).toBeCloseTo(90, 10)
      // The glyph box itself is untouched — turning a symbol does not change what it is made of.
      expect(symbol.bounds.width).toBe(before.width)
      expect(symbol.bounds.height).toBe(before.height)
    })

    test.each([
      ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
      ["math", () => buildIIMath()],
    ])("%s should place its vertices where the renderer draws them", (name, build) => {
      // The bug this ticket fixes, at the level a caller sees it: `overlaps` reads `vertices`, so a
      // quad that disagrees with the rendered transform is a symbol that cannot be surrounded.
      const symbol = build()
      const util = name === "text" ? text : math
      util.rotate(symbol as never, context(quarterTurn()))

      const box = OBBOps.toUnrotatedBox(symbol.bounds)
      const rad = Math.PI / 2
      const expected = BoxOps.getCorners(box).map((corner) => ({
        x: Math.cos(rad) * corner.x - Math.sin(rad) * corner.y,
        y: Math.sin(rad) * corner.x + Math.cos(rad) * corner.y,
      }))
      symbol.vertices.forEach((vertex, i) => {
        expect(vertex.x).toBeCloseTo(expected[i].x, 2)
        expect(vertex.y).toBeCloseTo(expected[i].y, 2)
      })
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
