import { describe, test, expect, beforeEach } from "@jest/globals"
import { StrokeUtil } from "../../../../src/symbol-utils/stroke/StrokeUtil"
import { StrokeOps } from "../../../../src/iink"
import { OBBOps } from "../../../../src/symbol/primitives/OBB"
import { SymbolType } from "../../../../src/symbol/Symbol"
import { buildIIStroke } from "../../helpers"

describe("StrokeUtil", () =>
{
  let util: StrokeUtil

  beforeEach(() =>
  {
    util = new StrokeUtil()
  })

  test("should have type stroke", () =>
  {
    expect(util.type).toBe(SymbolType.Stroke)
  })

  describe("create", () =>
  {
    test("should create a stroke from partial with pointers and pointerType", () =>
    {
      const partial = {
        pointerType: "touch",
        pointers: [
          { p: 1, t: 0, x: 1, y: 1 },
          { p: 1, t: 1, x: 2, y: 2 },
        ],
      }
      const stroke = util.create(partial)
      expect(stroke.type).toBe(SymbolType.Stroke)
      expect(stroke.pointerType).toBe("touch")
    })

    test("should throw when pointers are empty", () =>
    {
      expect(() => util.create({ pointers: [] })).toThrow()
    })

    test("should generate a unique id each call", () =>
    {
      const pointers = [{ p: 1, t: 0, x: 1, y: 1 }, { p: 1, t: 1, x: 2, y: 2 }]
      const s1 = util.create({ pointers })
      const s2 = util.create({ pointers })
      expect(s1.id).not.toBe(s2.id)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should update bounds from pointers", () =>
    {
      const stroke = buildIIStroke({ box: { x: 10, y: 20, width: 30, height: 40 } })
      util.updateDerivedFields(stroke)
      expect(OBBOps.toBox(stroke.bounds).x).toBeCloseTo(10, 0)
      expect(OBBOps.toBox(stroke.bounds).y).toBeCloseTo(20, 0)
    })

    test("should update snapPoints", () =>
    {
      const stroke = buildIIStroke()
      util.updateDerivedFields(stroke)
      expect(stroke.snapPoints.length).toBeGreaterThan(0)
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when stroke overlaps box", () =>
    {
      const stroke = buildIIStroke({ box: { x: 5, y: 5, width: 10, height: 10 } })
      StrokeOps.updateBounds(stroke)
      expect(util.overlaps(stroke, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when stroke is outside box", () =>
    {
      const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
      StrokeOps.updateBounds(stroke)
      expect(util.overlaps(stroke, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSnapPoints", () =>
  {
    test("should return the stroke snapPoints reference", () =>
    {
      const stroke = buildIIStroke()
      StrokeOps.updateBounds(stroke)
      const result = util.getSnapPoints(stroke)
      expect(result).toBe(stroke.snapPoints)
    })
  })

  describe("capability flags (defaults)", () =>
  {
    test("canSelect should return true", () =>
    {
      const stroke = buildIIStroke()
      expect(util.canSelect(stroke)).toBe(true)
    })

    test("canTransform should return true", () =>
    {
      const stroke = buildIIStroke()
      expect(util.canTransform(stroke)).toBe(true)
    })

    test("canResize should return true", () =>
    {
      const stroke = buildIIStroke()
      expect(util.canResize(stroke)).toBe(true)
    })

    test("canRotate should return true", () =>
    {
      const stroke = buildIIStroke()
      expect(util.canRotate(stroke)).toBe(true)
    })
  })
})
