import { describe, test, expect, beforeEach } from "@jest/globals"
import { EdgeUtil } from "../../../../src/symbol-utils/edge/EdgeUtil"
import { EdgeKind } from "../../../../src/symbol/edge/Edge-enum"
import { SymbolType } from "../../../../src/symbol/Symbol"
import { buildIILine } from "../../helpers"
import type { TEdge } from "../../../../src/iink"

describe("EdgeUtil", () =>
{
  let util: EdgeUtil

  beforeEach(() =>
  {
    util = new EdgeUtil()
  })

  test("should have type edge", () =>
  {
    expect(util.type).toBe(SymbolType.Edge)
  })

  describe("create", () =>
  {
    test("should create a line when kind is Line", () =>
    {
      const edge = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 10, y: 10 } })
      expect(edge.type).toBe(SymbolType.Edge)
      expect(edge.kind).toBe(EdgeKind.Line)
    })

    test("should create an arc when kind is Arc", () =>
    {
      const edge = util.create({
        kind: EdgeKind.Arc,
        center: { x: 0, y: 0 },
        startAngle: 0,
        sweepAngle: Math.PI,
        radiusX: 5,
        radiusY: 5,
      })
      expect(edge.kind).toBe(EdgeKind.Arc)
    })

    test("should create a polyline when kind is PolyEdge", () =>
    {
      const points = [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }]
      const edge = util.create({ kind: EdgeKind.PolyEdge, points })
      expect(edge.kind).toBe(EdgeKind.PolyEdge)
    })

    test("should throw when kind is unknown", () =>
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => util.create({ kind: "unknown" } as any)).toThrow()
    })

    test("should generate unique ids for each creation", () =>
    {
      const e1 = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      const e2 = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      expect(e1.id).not.toBe(e2.id)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should not throw for a line", () =>
    {
      const line = buildIILine()
      expect(() => util.updateDerivedFields(line)).not.toThrow()
    })

    test("should not throw for an arc", () =>
    {
      const arc = util.create({
        kind: EdgeKind.Arc,
        center: { x: 0, y: 0 },
        startAngle: 0,
        sweepAngle: Math.PI,
        radiusX: 5,
        radiusY: 5,
      })
      expect(() => util.updateDerivedFields(arc)).not.toThrow()
    })

    test("should not throw for a polyline", () =>
    {
      const poly = util.create({ kind: EdgeKind.PolyEdge, points: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 0 }] })
      expect(() => util.updateDerivedFields(poly)).not.toThrow()
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when box fully contains line bounds (totally wraps)", () =>
    {
      // Use a large box that fully contains the line bounds (including SELECTION_MARGIN expansion)
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      expect(util.overlaps(line, { x: -10, y: -10, width: 30, height: 30 })).toBe(true)
    })

    test("should return true when line segment crosses box border", () =>
    {
      // A vertical line crossing the border of the box
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 0, y: 25 } })
      expect(util.overlaps(line, { x: -5, y: -5, width: 10, height: 10 })).toBe(true)
    })

    test("should return false when line is outside box", () =>
    {
      const line = buildIILine({ start: { x: 100, y: 100 }, end: { x: 110, y: 110 } })
      expect(util.overlaps(line, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })

    test("should return false for unknown edge kind (default branch)", () =>
    {
      const line = buildIILine()
      // Force unknown kind to exercise the default branch in the switch
      const unknownEdge = { ...line, kind: "unknown" } as unknown as TEdge
      expect(util.overlaps(unknownEdge, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })

  describe("getSnapPoints", () =>
  {
    test("should return the edge snapPoints reference", () =>
    {
      const line = buildIILine()
      util.updateDerivedFields(line)
      const result = util.getSnapPoints(line)
      expect(result).toBe(line.snapPoints)
    })
  })

  describe("capability flags (defaults)", () =>
  {
    test("canSelect should return true", () =>
    {
      expect(util.canSelect(buildIILine())).toBe(true)
    })

    test("canTransform should return true", () =>
    {
      expect(util.canTransform(buildIILine())).toBe(true)
    })

    test("canResize should return true", () =>
    {
      expect(util.canResize(buildIILine())).toBe(true)
    })

    test("canRotate should return true", () =>
    {
      expect(util.canRotate(buildIILine())).toBe(true)
    })
  })
})
