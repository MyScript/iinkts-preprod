import { describe, test, expect, beforeEach } from "@jest/globals"
import { buildIICircle } from "../../helpers"
import { ShapeUtil, ShapeKind, SymbolType, OBBOps, type TShape } from "@/iink"

describe("ShapeUtil", () => {
  let util: ShapeUtil

  beforeEach(() => {
    util = new ShapeUtil()
  })

  test("should have type shape", () => {
    expect(util.type).toBe(SymbolType.Shape)
  })

  describe("create", () => {
    test("should create a circle when kind is Circle", () => {
      const shape = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      expect(shape.type).toBe(SymbolType.Shape)
      expect(shape.kind).toBe(ShapeKind.Circle)
    })

    test("should create an ellipse when kind is Ellipse", () => {
      const shape = util.create({ kind: ShapeKind.Ellipse, center: { x: 0, y: 0 }, radiusX: 10, radiusY: 5 })
      expect(shape.kind).toBe(ShapeKind.Ellipse)
    })

    test("should create a polygon when kind is Polygon", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ]
      const shape = util.create({ kind: ShapeKind.Polygon, points })
      expect(shape.kind).toBe(ShapeKind.Polygon)
    })

    test("should throw when kind is unknown", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => util.create({ kind: "unknown" } as any)).toThrow()
    })

    test("should generate unique ids for each creation", () => {
      const s1 = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      const s2 = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      expect(s1.id).not.toBe(s2.id)
    })
  })

  describe("updateDerivedFields", () => {
    test("should update circle bounds", () => {
      const circle = buildIICircle({ center: { x: 10, y: 10 }, radius: 5 })
      util.updateDerivedFields(circle)
      expect(OBBOps.toBox(circle.bounds)).toMatchObject({ x: 5, y: 5, width: 10, height: 10 })
    })

    test("should not throw for ellipse", () => {
      const shape = util.create({ kind: ShapeKind.Ellipse, center: { x: 0, y: 0 }, radiusX: 10, radiusY: 5 })
      expect(() => util.updateDerivedFields(shape)).not.toThrow()
    })

    test("should not throw for polygon", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ]
      const shape = util.create({ kind: ShapeKind.Polygon, points })
      expect(() => util.updateDerivedFields(shape)).not.toThrow()
    })
  })

  describe("overlaps", () => {
    test("should return true when circle overlaps box", () => {
      const circle = buildIICircle({ center: { x: 5, y: 5 }, radius: 3 })
      expect(util.overlaps(circle, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when circle is outside box", () => {
      const circle = buildIICircle({ center: { x: 100, y: 100 }, radius: 3 })
      expect(util.overlaps(circle, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })

    test("should return false for unknown shape kind (default branch)", () => {
      const circle = buildIICircle()
      // Force unknown kind to exercise the default branch in the switch
      const unknownShape = { ...circle, kind: "unknown" } as unknown as TShape
      expect(util.overlaps(unknownShape, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })

  describe("getSnapPoints", () => {
    test("should return the shape snapPoints reference", () => {
      const circle = buildIICircle()
      util.updateDerivedFields(circle)
      const result = util.getSnapPoints(circle)
      expect(result).toBe(circle.snapPoints)
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIICircle())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIICircle())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIICircle())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIICircle())).toBe(true)
    })
  })
})
