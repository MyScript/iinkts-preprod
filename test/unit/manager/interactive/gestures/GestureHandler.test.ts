import type { TGestureType, TSymbol } from "@/iink"
import { DecoratorKind, DecoratorUtil, GestureHandler, GestureHelpers } from "@/iink"

import { asCanvas, createCanvasMock } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"

class TestGestureHandler extends GestureHandler {
  readonly gestureType: TGestureType = "JOIN"
  async apply(): Promise<void> {
    return undefined
  }

  testIsSymbolAbove(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolAbove(source, target)
  }
  testIsSymbolInRow(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolInRow(source, target)
  }
  testIsSymbolBelow(source: TSymbol, target: TSymbol): boolean {
    return this.isSymbolBelow(source, target)
  }
  testGetFirstSymbol(symbols: TSymbol[]): TSymbol | undefined {
    return this.getFirstSymbol(symbols)
  }
  testGetLastSymbol(symbols: TSymbol[]): TSymbol | undefined {
    return this.getLastSymbol(symbols)
  }
}

describe("GestureHandler.ts", () => {
  const rowHeight = 10

  function setup() {
    const canvas = createCanvasMock()
    canvas.configuration.rendering.guides.gap = rowHeight
    const helpers = new GestureHelpers(asCanvas(canvas))
    const handler = new TestGestureHandler(asCanvas(canvas), helpers)
    return { canvas, handler }
  }

  describe("isSymbol", () => {
    const { handler } = setup()
    const s11 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight } })
    const s12 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 50, y: rowHeight } })
    const s21 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight } })
    const s22 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight } })

    const strokes = { s11, s12, s21, s22 }
    type TPair = [keyof typeof strokes, keyof typeof strokes, boolean]

    test.each<TPair>([
      ["s11", "s12", false],
      ["s11", "s21", false],
      ["s12", "s21", false],
      ["s21", "s12", true],
      ["s21", "s22", false],
    ])("%s above %s should return %s", (a, b, expected) => {
      expect(handler.testIsSymbolAbove(strokes[a], strokes[b])).toEqual(expected)
    })
    test.each<TPair>([
      ["s11", "s12", true],
      ["s11", "s21", false],
      ["s12", "s21", false],
      ["s21", "s12", false],
      ["s21", "s22", true],
    ])("%s in row %s should return %s", (a, b, expected) => {
      expect(handler.testIsSymbolInRow(strokes[a], strokes[b])).toEqual(expected)
    })
    test.each<TPair>([
      ["s11", "s12", false],
      ["s11", "s21", true],
      ["s12", "s21", true],
      ["s21", "s12", false],
      ["s21", "s22", false],
    ])("%s below %s should return %s", (a, b, expected) => {
      expect(handler.testIsSymbolBelow(strokes[a], strokes[b])).toEqual(expected)
    })
  })

  describe("get first/last symbol", () => {
    const { handler } = setup()
    const s11 = buildIIStroke({ box: { height: rowHeight / 2, width: 5, x: 5, y: rowHeight } })
    const s21 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 5, y: rowHeight } })
    const s22 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 50, y: rowHeight } })
    const s23 = buildIIStroke({ box: { height: rowHeight * 2, width: 5, x: 150, y: rowHeight } })
    const s31 = buildIIStroke({ box: { height: rowHeight * 3, width: 5, x: 5, y: rowHeight } })

    test("should return first symbol when different rows", () => {
      expect(handler.testGetFirstSymbol([s11, s21, s31])).toEqual(s11)
    })
    test("should return first symbol when in same row", () => {
      expect(handler.testGetFirstSymbol([s21, s22, s23])).toEqual(s21)
    })
    test("should return first symbol when only 1 symbol", () => {
      expect(handler.testGetFirstSymbol([s21])).toEqual(s21)
    })
    test("should return last symbol when different rows", () => {
      expect(handler.testGetLastSymbol([s11, s21, s31])).toEqual(s31)
    })
    test("should return last symbol when in same row", () => {
      expect(handler.testGetLastSymbol([s21, s22, s23])).toEqual(s23)
    })
    test("should return last symbol when only 1 symbol", () => {
      expect(handler.testGetLastSymbol([s21])).toEqual(s21)
    })
  })

  describe("row index via JIIX line center", () => {
    test("uses the JIIX line center instead of geometric bounds for a recognized stroke", () => {
      const { canvas, handler } = setup()
      // Geometrically this stroke sits in row 1, but JIIX says its word's line center is row 10
      const s1 = buildIIStroke({ box: { height: 5, width: 5, x: 5, y: 10 } })
      // Purely geometric stroke, no JIIX data, sits in row 10
      const s2 = buildIIStroke({ box: { height: 10, width: 5, x: 50, y: 95 } })
      ;(canvas.jiix as unknown as Record<string, unknown>).getLineCenterYForStroke = jest.fn((id: string) =>
        id === s1.id ? 96 : null
      )

      expect(handler.testIsSymbolInRow(s1, s2)).toBe(true)
    })

    test("falls back to geometric bounds when JIIX has no line for the stroke", () => {
      const { canvas, handler } = setup()
      const s1 = buildIIStroke({ box: { height: 5, width: 5, x: 5, y: 10 } })
      const s2 = buildIIStroke({ box: { height: 10, width: 5, x: 50, y: 95 } })
      ;(canvas.jiix as unknown as Record<string, unknown>).getLineCenterYForStroke = jest.fn().mockReturnValue(null)

      expect(handler.testIsSymbolInRow(s1, s2)).toBe(false)
    })

    test("resolves a decorator's row via its first target stroke's JIIX line center", () => {
      const { canvas, handler } = setup()
      const s1 = buildIIStroke({ box: { height: 5, width: 5, x: 5, y: 10 } })
      const s2 = buildIIStroke({ box: { height: 10, width: 5, x: 50, y: 95 } })
      const decorator = DecoratorUtil.createDecorator(DecoratorKind.Underline, {}, [s1.id])
      ;(canvas.jiix as unknown as Record<string, unknown>).getLineCenterYForStroke = jest.fn((id: string) =>
        id === s1.id ? 96 : null
      )

      expect(handler.testIsSymbolInRow(decorator, s2)).toBe(true)
    })
  })
})
