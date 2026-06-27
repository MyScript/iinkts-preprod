import { describe, test, expect, beforeEach } from "@jest/globals"
import { TextUtil } from "../../../../src/symbol-utils/text/TextUtil"
import { SymbolType } from "../../../../src/symbol/Symbol"
import { buildIIText } from "../../helpers"
import type { TSymbolChar, TBox } from "../../../../src/iink"

const makeChar = (label: string, bounds: TBox): TSymbolChar => ({
  id: `char-${ label }`,
  label,
  color: "#000000",
  bounds,
  fontSize: 12,
  fontWeight: "normal",
})

describe("TextUtil", () =>
{
  let util: TextUtil

  beforeEach(() =>
  {
    util = new TextUtil()
  })

  test("should have type text", () =>
  {
    expect(util.type).toBe(SymbolType.Text)
  })

  describe("create", () =>
  {
    test("should create a text from partial with required fields", () =>
    {
      const point = { x: 10, y: 20 }
      const bounds = { x: 10, y: 20, width: 100, height: 30 }
      const chars = [makeChar("A", bounds)]
      const text = util.create({ chars, point, bounds })
      expect(text.type).toBe(SymbolType.Text)
      expect(text.point).toEqual(point)
      expect(text.bounds).toEqual(bounds)
    })

    test("should throw when bounds are missing", () =>
    {
      const bounds = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", bounds)]
      expect(() => util.create({ chars, point: { x: 0, y: 0 } })).toThrow()
    })

    test("should throw when chars are empty", () =>
    {
      expect(() => util.create({ chars: [], point: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 10, height: 10 } })).toThrow()
    })

    test("should generate a unique id each call", () =>
    {
      const bounds = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", bounds)]
      const t1 = util.create({ chars, point: { x: 0, y: 0 }, bounds })
      const t2 = util.create({ chars, point: { x: 0, y: 0 }, bounds })
      expect(t1.id).not.toBe(t2.id)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should not throw on valid text", () =>
    {
      const text = buildIIText()
      expect(() => util.updateDerivedFields(text)).not.toThrow()
    })

    test("should update snapPoints after call", () =>
    {
      const text = buildIIText({ boundingBox: { x: 0, y: 10, width: 20, height: 30 } })
      util.updateDerivedFields(text)
      expect(Array.isArray(text.snapPoints)).toBe(true)
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when text overlaps given box", () =>
    {
      const text = buildIIText({ boundingBox: { x: 5, y: 5, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when text is outside given box", () =>
    {
      const text = buildIIText({ boundingBox: { x: 100, y: 100, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSnapPoints", () =>
  {
    test("should return the text snapPoints reference", () =>
    {
      const text = buildIIText()
      util.updateDerivedFields(text)
      const result = util.getSnapPoints(text)
      expect(result).toBe(text.snapPoints)
    })
  })

  describe("capability flags (defaults)", () =>
  {
    test("canSelect should return true", () =>
    {
      expect(util.canSelect(buildIIText())).toBe(true)
    })

    test("canTransform should return true", () =>
    {
      expect(util.canTransform(buildIIText())).toBe(true)
    })

    test("canResize should return true", () =>
    {
      expect(util.canResize(buildIIText())).toBe(true)
    })

    test("canRotate should return true", () =>
    {
      expect(util.canRotate(buildIIText())).toBe(true)
    })
  })
})
