import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIILine } from "../../helpers"

import type { TEdge, TPartialDeep } from "@/iink"
import { EdgeDecoration, EdgeKind, EdgeUtil, SymbolType } from "@/iink"

/**
 * `EdgeUtil` resolved a kind with a `switch` in each of four methods until IIC-2002 replaced them
 * with one table. These tests assert what the table buys: a kind is wired everywhere or nowhere,
 * and every member of `EdgeKind` is wired at all.
 */
const PARTIALS: Record<string, TPartialDeep<TEdge>> = {
  [EdgeKind.Line]: {
    type: SymbolType.Edge,
    kind: EdgeKind.Line,
    start: { x: 0, y: 0 },
    end: { x: 10, y: 10 },
  },
  [EdgeKind.PolyEdge]: {
    type: SymbolType.Edge,
    kind: EdgeKind.PolyEdge,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ],
  },
  [EdgeKind.Arc]: {
    type: SymbolType.Edge,
    kind: EdgeKind.Arc,
    center: { x: 50, y: 50 },
    radiusX: 30,
    radiusY: 20,
    startAngle: 0,
    sweepAngle: Math.PI,
    phi: 0,
  },
}

/**
 * `TPartialDeep<TEdge>` narrows `kind` per union member, so an unhandled kind cannot be written
 * directly — the compiler refuses it. The runtime guard tested below is for kinds arriving as data.
 */
function asPartial(partial: { type: SymbolType; kind: string }): TPartialDeep<TEdge> {
  return partial as unknown as TPartialDeep<TEdge>
}

describe("EdgeUtil", () => {
  const util = new EdgeUtil()

  test("should have the table cover every kind the enum declares", () => {
    // Unlike ShapeKind, every EdgeKind is implemented — so a new member with no table entry is a
    // bug, and this is what says so.
    expect(Object.keys(PARTIALS).sort()).toEqual([...Object.values(EdgeKind)].sort())
  })

  describe.each(Object.values(EdgeKind))("%s", (kind) => {
    const edge = () => util.create(PARTIALS[kind])

    test("should create through the table", () => {
      expect(edge().kind).toBe(kind)
      expect(edge().type).toBe(SymbolType.Edge)
    })

    test("should update derived fields without dispatching elsewhere", () => {
      const created = edge()
      expect(() => util.updateDerivedFields(created)).not.toThrow()
      expect(created.bounds).toBeDefined()
    })

    test("computeGeometry should match the legacy *Ops writer already run by create, not merely itself", () => {
      // `edge()` already ran the legacy per-kind `updateDerivedFields` as part of construction
      // (`EdgeArcOps`/`EdgeLineOps`/`EdgePolyLineOps.create` all call it before returning) — an
      // independent oracle `computeGeometry` never touches. Calling `util.updateDerivedFields` here
      // first would make the comparison circular: it IS `Object.assign(s, computeGeometry(s))`.
      const created = edge()

      const geometry = util.computeGeometry(created)

      expect(geometry.bounds).toEqual(created.bounds)
      expect(geometry.vertices).toEqual(created.vertices)
      expect(geometry.snapPoints).toEqual(created.snapPoints)
      expect(geometry.edges).toEqual(created.edges)
      expect(geometry.length).toBe(0)
    })

    test("updateDerivedFields should not write an undeclared length onto the edge", () => {
      const created = edge()
      util.updateDerivedFields(created)
      expect(created).not.toHaveProperty("length")
    })

    test("should answer overlaps", () => {
      expect(typeof util.overlaps(edge(), { x: 0, y: 0, width: 200, height: 200 })).toBe("boolean")
    })

    test("should produce an svg path", () => {
      expect(EdgeUtil.getSVGPath(edge())).toBeTruthy()
    })

    test("should produce an svg element carrying that path", () => {
      const element = util.getSVGElement(edge())
      const path = element.querySelector("path")
      expect(element.getAttribute("kind")).toBe(kind)
      expect(path?.getAttribute("d")).toBe(EdgeUtil.getSVGPath(edge()))
    })

    test("should carry arrow decorations, which belong to every kind rather than to the table", () => {
      // These two `if`s sit outside the table on purpose: any kind of edge can be decorated, so
      // they are not kind dispatch and must keep working for all of them.
      const decorated = util.create({
        ...PARTIALS[kind],
        startDecoration: EdgeDecoration.Arrow,
        endDecoration: EdgeDecoration.Arrow,
      } as TPartialDeep<TEdge>)
      const path = util.getSVGElement(decorated).querySelector("path")
      expect(path?.getAttribute("marker-start")).toContain("url(#")
      expect(path?.getAttribute("marker-end")).toContain("url(#")
    })

    test("should leave an undecorated edge without markers", () => {
      const path = util.getSVGElement(edge()).querySelector("path")
      expect(path?.getAttribute("marker-start")).toBeNull()
      expect(path?.getAttribute("marker-end")).toBeNull()
    })
  })

  describe("a kind arriving as data that the table does not own", () => {
    test.each([
      ["create", () => util.create(asPartial({ type: SymbolType.Edge, kind: "spline" }))],
      ["getSVGPath", () => EdgeUtil.getSVGPath({ kind: "spline" } as unknown as TEdge)],
      ["getSVGElement", () => util.getSVGElement({ kind: "spline" } as unknown as TEdge)],
    ])("should refuse %s, naming the kind", (_name, call) => {
      expect(call).toThrow('edge, kind: "spline" is unknown')
    })

    test("should stay tolerant where it always was", () => {
      // Both run over whole models and never threw on an unknown kind; they still must not.
      const unknown = { kind: "spline" } as unknown as TEdge
      expect(() => util.updateDerivedFields(unknown)).not.toThrow()
      expect(util.overlaps(unknown, { x: 0, y: 0, width: 1, height: 1 })).toBe(false)
    })

    test("computeGeometry should stay tolerant too, leaving the edge's own fields as its answer", () => {
      const unknown = {
        kind: "spline",
        bounds: "bounds",
        vertices: "vertices",
        snapPoints: "snapPoints",
        edges: "edges",
      } as unknown as TEdge
      expect(util.computeGeometry(unknown)).toEqual({
        bounds: unknown.bounds,
        vertices: unknown.vertices,
        snapPoints: unknown.snapPoints,
        edges: unknown.edges,
        length: 0,
      })
    })

    test("updateDerivedFields should perform no write at all for a kind the table does not own, even on a frozen edge", () => {
      // `Object.assign` throws on a frozen object even when writing back the identical value —
      // exactly the state a `SymbolStore`-committed symbol is in. The dispatch this replaced
      // (`EDGE_KINDS[edge.kind]?.updateDerivedFields(edge)`) never wrote for an unowned kind, so this
      // must not either.
      const frozen = Object.freeze({
        kind: "spline",
        bounds: "bounds",
        vertices: "vertices",
        snapPoints: "snapPoints",
        edges: "edges",
      }) as unknown as TEdge
      expect(() => util.updateDerivedFields(frozen)).not.toThrow()
    })
  })
})

/**
 * Moved here from `test/unit/symbol/edge/` by IIC-2013, which is where the source has lived since
 * `symbol-utils` was split out. Both files described `EdgeUtil`, so this half was being maintained
 * separately from the kind-table half above without either mentioning the other.
 */
describe("EdgeUtil, the contract members", () => {
  let util: EdgeUtil

  beforeEach(() => {
    util = new EdgeUtil()
  })

  test("should have type edge", () => {
    expect(util.type).toBe(SymbolType.Edge)
  })

  describe("create", () => {
    test("should create a line when kind is Line", () => {
      const edge = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 10, y: 10 } })
      expect(edge.type).toBe(SymbolType.Edge)
      expect(edge.kind).toBe(EdgeKind.Line)
    })

    test("should create an arc when kind is Arc", () => {
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

    test("should create a polyline when kind is PolyEdge", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 0 },
      ]
      const edge = util.create({ kind: EdgeKind.PolyEdge, points })
      expect(edge.kind).toBe(EdgeKind.PolyEdge)
    })

    test("should throw when kind is unknown", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => util.create({ kind: "unknown" } as any)).toThrow()
    })

    test("should generate unique ids for each creation", () => {
      const e1 = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      const e2 = util.create({ kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      expect(e1.id).not.toBe(e2.id)
    })
  })

  describe("updateDerivedFields", () => {
    test("should not throw for a line", () => {
      const line = buildIILine()
      expect(() => util.updateDerivedFields(line)).not.toThrow()
    })

    test("should not throw for an arc", () => {
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

    test("should not throw for a polyline", () => {
      const poly = util.create({
        kind: EdgeKind.PolyEdge,
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 0 },
        ],
      })
      expect(() => util.updateDerivedFields(poly)).not.toThrow()
    })
  })

  describe("overlaps", () => {
    test("should return true when box fully contains line bounds (totally wraps)", () => {
      // Use a large box that fully contains the line bounds (including SELECTION_MARGIN expansion)
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 5, y: 5 } })
      expect(util.overlaps(line, { x: -10, y: -10, width: 30, height: 30 })).toBe(true)
    })

    test("should return true when line segment crosses box border", () => {
      // A vertical line crossing the border of the box
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 0, y: 25 } })
      expect(util.overlaps(line, { x: -5, y: -5, width: 10, height: 10 })).toBe(true)
    })

    test("should return false when line is outside box", () => {
      const line = buildIILine({ start: { x: 100, y: 100 }, end: { x: 110, y: 110 } })
      expect(util.overlaps(line, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })

    test("should return false for unknown edge kind (default branch)", () => {
      const line = buildIILine()
      // Force unknown kind to exercise the default branch in the switch
      const unknownEdge = { ...line, kind: "unknown" } as unknown as TEdge
      expect(util.overlaps(unknownEdge, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })

  describe("getSnapPoints", () => {
    test("should return the edge snapPoints reference", () => {
      const line = buildIILine()
      util.updateDerivedFields(line)
      const result = util.getSnapPoints(line)
      expect(result).toStrictEqual(line.snapPoints)
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIILine())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIILine())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIILine())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIILine())).toBe(true)
    })
  })
})
