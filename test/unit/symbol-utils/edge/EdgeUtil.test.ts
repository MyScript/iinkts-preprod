import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIILine } from "../../helpers"

import type { TEdge, TOBB, TPartialDeep } from "@/iink"
import { EdgeArcOps, EdgeDecoration, EdgeKind, EdgeUtil, MatrixTransform, OBBOps, SymbolType, TPoint, TSegment, EdgeLineOps, TEdgeLine, EdgePolyLineOps, TEdgePolyLine, TEdgeArc } from "@/iink"

/**
 * `EdgeUtil` resolved a kind with a `switch` in each of four methods until IIC-2002 replaced them
 * with one table. These tests assert what the table buys: a kind is wired everywhere or nowhere,
 * and every member of `EdgeKind` is wired at all.
 */
/**
 * Each kind's own edge computation, the oracle now that the stored `edges` field is gone. A
 * dispatch oracle like {@link EDGE_BOUNDS_ORACLE}: it reaches the same `*Ops` calls `computeGeometry`
 * makes, so it pins the routing, not the arithmetic.
 */
const EDGES_ORACLE: Record<string, (edge: TEdge, vertices: TPoint[]) => TSegment[]> = {
  [EdgeKind.Line]: (edge) => EdgeLineOps.computeEdges(edge as TEdgeLine),
  [EdgeKind.PolyEdge]: (edge) => EdgePolyLineOps.computeEdges((edge as TEdgePolyLine).points),
  [EdgeKind.Arc]: (_edge, vertices) => EdgeArcOps.computeEdges(vertices),
}

/**
 * Each kind's own bounds computation. This is a *dispatch* oracle: it proves `EdgeUtil` routes an
 * arc to `EdgeArcOps` and not to `EdgeLineOps`, and nothing more — it cannot fail if a kind's own
 * `computeBounds` is wrong, because it is that same call. The value coverage lives in each kind's
 * own test file, against hand-written boxes.
 */
const EDGE_BOUNDS_ORACLE: Record<string, (edge: TEdge) => TOBB> = {
  [EdgeKind.Line]: (edge) =>
    EdgeLineOps.computeBounds(edge as TEdgeLine, EdgeLineOps.computeVertices(edge as TEdgeLine)),
  [EdgeKind.PolyEdge]: (edge) => EdgePolyLineOps.computeBounds(edge as TEdgePolyLine),
  [EdgeKind.Arc]: (edge) =>
    EdgeArcOps.computeBounds(edge as TEdgeArc, EdgeArcOps.computeVertices(edge as TEdgeArc)),
}

/** Each kind's own vertex computation, the oracle now that the stored `vertices` field is gone. */
const EDGE_VERTICES_ORACLE: Record<string, (edge: TEdge) => TPoint[]> = {
  [EdgeKind.Line]: (edge) => EdgeLineOps.computeVertices(edge as TEdgeLine),
  [EdgeKind.PolyEdge]: (edge) => EdgePolyLineOps.computeVertices(edge as TEdgePolyLine),
  [EdgeKind.Arc]: (edge) => EdgeArcOps.computeVertices(edge as TEdgeArc),
}

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

    test("computeGeometry should dispatch each kind to that kind's own computation", () => {
      const created = edge()

      const geometry = util.computeGeometry(created)

      expect(geometry.bounds).toEqual(EDGE_BOUNDS_ORACLE[kind](created))
      // Oracle is the kind's own vertex computation, not the stored field it replaced.
      expect(geometry.vertices).toEqual(EDGE_VERTICES_ORACLE[kind](created))
      // Per kind, because the three do not agree: a line and a polyline snap by every vertex, an arc
      // only by its two endpoints. Asserting `geometry.vertices` for all three passed for the first
      // two and quietly accepted a 28-point answer for the arc.
      expect(geometry.snapPoints).toEqual(
        kind === EdgeKind.Arc ? EdgeArcOps.computeSnapPoints(geometry.vertices) : geometry.vertices
      )
      // Oracle is the kind's own `computeEdges`, not the stored field it replaced.
      expect(geometry.edges).toEqual(EDGES_ORACLE[kind](created, geometry.vertices))
      expect(geometry.length).toBe(0)
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

    test("should emit no transform attribute for an edge that was never moved", () => {
      expect(util.getSVGElement(edge()).getAttribute("transform")).toBeNull()
    })

    test("should emit the edge's matrix as the element transform once moved", () => {
      const moved = edge()
      moved.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(moved).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
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
        // Not the object's own `bounds` any more: no edge type declares one, so a stray property
        // arriving as data is not something the fallback can read or echo back.
        bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
        vertices: [],
        // An unregistered kind has no snap points to offer, so the fallback returns none.
        snapPoints: [],
        edges: [],
        length: 0,
      })
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

    /**
     * The regression this closes: surround-selecting a rotated edge missed it entirely, because
     * `overlaps` tested the query against the raw (pre-rotate) segment.
     */
    test("a rotated line is crossed by a query over its new position, not its raw one", () => {
      // Raw line lies along y=0 from x=0 to x=10. rotate(90°) about the origin sends (x, y) to
      // (-y, x), so the rotated line now lies along x=0 from y=0 to y=10.
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } })
      line.transform = MatrixTransform.identity().rotate(Math.PI / 2)

      expect(util.overlaps(line, { x: -1, y: 5, width: 2, height: 2 })).toBe(true)
      // Where the line used to lie — a query still drawn along y=0 must miss it now.
      expect(util.overlaps(line, { x: 5, y: -1, width: 2, height: 2 })).toBe(false)
    })

    /**
     * Regression found in review: a rotated line's two raw endpoints are also two of its own raw
     * *bounding-box* corners — but the box has two more corners, never on the line itself. Testing
     * containment against the box's corners (as the first version of this fix did) rather than the
     * line's own two endpoints made a query that truly surrounds the (rotated) line miss it, because
     * the box's other two corners reach further out than the line does everywhere but its endpoints.
     *
     * Hand-derived with a clean (no trig rounding) rotation matrix — cos=0.6, sin=0.8, the 3-4-5
     * triangle. Raw endpoints (0,0),(20,5) map forward to world (0,0),(8,19); the world-space query
     * {x:-1,y:-1,width:10,height:21} maps back, through the exact-transpose inverse, to a raw-frame
     * quad that contains both raw endpoints (verified by the same cross-product sign test
     * `pointInConvexPolygon` uses) but excludes both of the raw bounding box's other corners,
     * (20,0) and (0,5).
     */
    test("hand-computed: a rotated line is contained where its bounding box's other two corners are not", () => {
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 20, y: 5 } })
      line.transform = { xx: 0.6, yx: 0.8, xy: -0.8, yy: 0.6, tx: 0, ty: 0 }

      expect(util.overlaps(line, { x: -1, y: -1, width: 10, height: 21 })).toBe(true)
    })
  })

  describe("getSnapPoints", () => {
    test("should return the edge's snap points, which for a line are its vertices", () => {
      const line = buildIILine()
      const result = util.getSnapPoints(line)
      expect(result).toStrictEqual(util.computeGeometry(line).vertices)
    })

    test("a rotated line's snap points land on the rotated geometry, not the raw one", () => {
      const line = buildIILine({ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } })
      line.transform = MatrixTransform.identity().rotate(Math.PI / 2)

      // Hand-computed: rotate(90°) about the origin sends (x, y) to (-y, x), so raw endpoints
      // (0,0),(10,0) - the line's own snap points - become (0,0),(0,10).
      expect(util.getSnapPoints(line)).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
      ])
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
