import { describe, test, expect, beforeEach } from "@jest/globals"
import { MathUtil } from "../../../../src/symbol-utils/math/MathUtil"
import { SymbolType } from "../../../../src/symbol/Symbol"
import { OBBOps } from "../../../../src/symbol/primitives/OBB"
import { buildIIMath } from "../../helpers"
import type { TMathElement } from "../../../../src/iink"

const makeMathElement = (label: string, bounds = { x: 0, y: 0, width: 50, height: 30 }): TMathElement => ({
  id: "e1",
  label,
  fontSize: 14,
  fontWeight: "normal",
  fontFamily: "Arial",
  color: "#000000",
  bounds,
})

describe("MathUtil", () =>
{
  let util: MathUtil

  beforeEach(() =>
  {
    util = new MathUtil()
  })

  test("should have type math", () =>
  {
    expect(util.type).toBe(SymbolType.Math)
  })

  describe("create", () =>
  {
    test("should create a math from partial", () =>
    {
      const point = { x: 5, y: 10 }
      const boundsBox = { x: 5, y: 10, width: 80, height: 40 }
      const elements = [makeMathElement("x=1", boundsBox)]
      const math = util.create({ elements, point, bounds: OBBOps.fromBox(boundsBox) })
      expect(math.type).toBe(SymbolType.Math)
      expect(math.point).toEqual(point)
    })

    test("should generate a unique id each call", () =>
    {
      const boundsBox2 = { x: 0, y: 0, width: 50, height: 30 }
      const elements = [makeMathElement("x=1", boundsBox2)]
      const m1 = util.create({ elements, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      const m2 = util.create({ elements, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      expect(m1.id).not.toBe(m2.id)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should not throw on valid math", () =>
    {
      const math = buildIIMath()
      expect(() => util.updateDerivedFields(math)).not.toThrow()
    })

    test("should update snapPoints after call", () =>
    {
      const math = buildIIMath()
      util.updateDerivedFields(math)
      expect(Array.isArray(math.snapPoints)).toBe(true)
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when math overlaps given box", () =>
    {
      const math = buildIIMath("y=x", { boundingBox: { x: 5, y: 5, width: 20, height: 10 } })
      expect(util.overlaps(math, { x: 0, y: 0, width: 30, height: 30 })).toBe(true)
    })

    test("should return false when math is outside given box", () =>
    {
      const math = buildIIMath("y=x", { boundingBox: { x: 100, y: 100, width: 20, height: 10 } })
      expect(util.overlaps(math, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSnapPoints", () =>
  {
    test("should return the math snapPoints reference", () =>
    {
      const math = buildIIMath()
      util.updateDerivedFields(math)
      const result = util.getSnapPoints(math)
      expect(result).toBe(math.snapPoints)
    })
  })

  describe("capability flags (defaults)", () =>
  {
    test("canSelect should return true", () =>
    {
      expect(util.canSelect(buildIIMath())).toBe(true)
    })

    test("canTransform should return true", () =>
    {
      expect(util.canTransform(buildIIMath())).toBe(true)
    })

    test("canResize should return true", () =>
    {
      expect(util.canResize(buildIIMath())).toBe(true)
    })

    test("canRotate should return true", () =>
    {
      expect(util.canRotate(buildIIMath())).toBe(true)
    })
  })
})
