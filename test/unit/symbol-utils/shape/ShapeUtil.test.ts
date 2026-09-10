import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIICircle } from "../../helpers"

import type { TOBB, TPartialDeep, TShape } from "@/iink"
import { MatrixTransform, OBBOps, ShapeKind, ShapeUtil, SymbolType, TPoint, TSegment, ShapeCircleOps, ShapeEllipseOps, ShapePolygonOps, TShapePolygon, TShapeCircle, TShapeEllipse } from "@/iink"

/**
 * `ShapeUtil` used to resolve a kind with a `switch` in each of four methods, which meant a kind
 * could be added to `create` and forgotten in `overlaps`. IIC-2002 replaced them with one table.
 *
 * These tests assert the property that made the table worth it: a kind is either wired everywhere
 * or nowhere. A partially handled kind fails here even though it would have typechecked before.
 */
/**
 * Each kind's own edge computation, the oracle now that the stored `edges` field is gone. A
 * dispatch oracle like {@link SHAPE_BOUNDS_ORACLE}: it reaches the same `*Ops` calls `computeGeometry`
 * makes, so it pins the routing, not the arithmetic.
 */
const EDGES_ORACLE: Record<string, (shape: TShape, vertices: TPoint[]) => TSegment[]> = {
  [ShapeKind.Circle]: (_shape, vertices) => ShapeCircleOps.computeEdges(vertices),
  [ShapeKind.Ellipse]: (_shape, vertices) => ShapeEllipseOps.computeEdges(vertices),
  [ShapeKind.Polygon]: (shape) => ShapePolygonOps.computeEdges((shape as TShapePolygon).points),
}

/**
 * Each kind's own bounds computation. This is a *dispatch* oracle: it proves `ShapeUtil` routes an
 * ellipse to `ShapeEllipseOps` and not to `ShapePolygonOps`, and nothing more — it cannot fail if a
 * kind's own `computeBounds` is wrong, because it is that same call. The value coverage lives in
 * each kind's own test file, against hand-written boxes.
 */
const SHAPE_BOUNDS_ORACLE: Record<string, (shape: TShape) => TOBB> = {
  [ShapeKind.Circle]: (shape) => ShapeCircleOps.computeBounds(shape as TShapeCircle),
  [ShapeKind.Ellipse]: (shape) =>
    ShapeEllipseOps.computeBounds(ShapeEllipseOps.computeVertices(shape as TShapeEllipse)),
  [ShapeKind.Polygon]: (shape) => ShapePolygonOps.computeBounds((shape as TShapePolygon).points),
}

/** Each kind's own vertex computation, the oracle now that the stored `vertices` field is gone. */
const SHAPE_VERTICES_ORACLE: Record<string, (shape: TShape) => TPoint[]> = {
  [ShapeKind.Circle]: (shape) => ShapeCircleOps.computeVertices(shape as TShapeCircle),
  [ShapeKind.Ellipse]: (shape) => ShapeEllipseOps.computeVertices(shape as TShapeEllipse),
  [ShapeKind.Polygon]: (shape) => ShapePolygonOps.computeVertices(shape as TShapePolygon),
}

const PARTIALS: Record<string, TPartialDeep<TShape>> = {
  [ShapeKind.Circle]: { type: SymbolType.Shape, kind: ShapeKind.Circle, center: { x: 50, y: 50 }, radius: 25 },
  [ShapeKind.Ellipse]: {
    type: SymbolType.Shape,
    kind: ShapeKind.Ellipse,
    center: { x: 50, y: 50 },
    radiusX: 30,
    radiusY: 20,
    orientation: Math.PI / 4,
  },
  [ShapeKind.Polygon]: {
    type: SymbolType.Shape,
    kind: ShapeKind.Polygon,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
  },
}

/**
 * `TPartialDeep<TShape>` narrows `kind` per union member, so a kind the union has no member for
 * cannot be written directly — the compiler already refuses it. The runtime guard being tested here
 * exists for the other door: kinds arriving as data, from an import or the recognition service.
 */
function asPartial(partial: { type: SymbolType; kind: string }): TPartialDeep<TShape> {
  return partial as unknown as TPartialDeep<TShape>
}

/** Declared in `ShapeKind` with nothing behind it. Kept in the enum by product decision. */
const UNIMPLEMENTED = [ShapeKind.Table]
const IMPLEMENTED = Object.values(ShapeKind).filter((kind) => !UNIMPLEMENTED.includes(kind))

describe("ShapeUtil", () => {
  const util = new ShapeUtil()

  test("should cover every implemented kind, so the fixtures below are not a subset of the enum", () => {
    // Guards the guard: a new ShapeKind with no fixture would otherwise skip every test here.
    expect(Object.keys(PARTIALS).sort()).toEqual([...IMPLEMENTED].sort())
  })

  describe.each(IMPLEMENTED)("%s", (kind) => {
    const shape = () => util.create(PARTIALS[kind])

    test("should create through the table", () => {
      expect(shape().kind).toBe(kind)
      expect(shape().type).toBe(SymbolType.Shape)
    })

    test("computeGeometry should dispatch each kind to that kind's own computation", () => {
      const created = shape()

      const geometry = util.computeGeometry(created)

      expect(geometry.bounds).toEqual(SHAPE_BOUNDS_ORACLE[kind](created))
      // Oracle is the kind's own vertex computation, not the stored field it replaced.
      expect(geometry.vertices).toEqual(SHAPE_VERTICES_ORACLE[kind](created))
      // Oracle is `OBBOps` directly, not the stored field it replaced: a circle's snap points are
      // the eight points of its bounding box, and that is what the field held a copy of.
      expect(geometry.snapPoints).toEqual(OBBOps.getSnapPoints(geometry.bounds))
      // Oracle is the kind's own `computeEdges`, not the stored field it replaced.
      expect(geometry.edges).toEqual(EDGES_ORACLE[kind](created, geometry.vertices))
      expect(geometry.length).toBe(0)
    })

    test("should answer overlaps", () => {
      expect(typeof util.overlaps(shape(), { x: 0, y: 0, width: 200, height: 200 })).toBe("boolean")
    })

    test("should produce an svg path", () => {
      expect(ShapeUtil.getSVGPath(shape())).toBeTruthy()
    })

    test("should produce an svg element carrying that path", () => {
      const element = util.getSVGElement(shape())
      const path = element.querySelector("path")
      expect(element.getAttribute("kind")).toBe(kind)
      expect(path?.getAttribute("d")).toBe(ShapeUtil.getSVGPath(shape()))
    })

    test("should emit no transform attribute for a shape that was never moved", () => {
      expect(util.getSVGElement(shape()).getAttribute("transform")).toBeNull()
    })

    test("should emit the shape's matrix as the element transform once moved", () => {
      const moved = shape()
      moved.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(moved).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })
  })

  describe.each(UNIMPLEMENTED)("%s, a kind the enum declares and the table does not", (kind) => {
    // The point is consistency: before the table, nothing stopped `create` from handling a kind
    // that `getSVGPath` then threw on, which surfaces as a broken symbol rather than a clear error.
    test.each([
      ["create", () => util.create(asPartial({ type: SymbolType.Shape, kind }))],
      ["getSVGPath", () => ShapeUtil.getSVGPath({ kind } as TShape)],
      ["getSVGElement", () => util.getSVGElement({ kind } as TShape)],
    ])("should refuse %s", (_name, call) => {
      expect(call).toThrow(`shape, kind: "${kind}" is unknown`)
    })

    test("should stay tolerant where it always was", () => {
      // These two never threw on an unknown kind and still must not: they run over whole models.
      expect(util.overlaps({ kind } as TShape, { x: 0, y: 0, width: 1, height: 1 })).toBe(false)
    })

    test("computeGeometry should stay tolerant too, leaving the shape's own fields as its answer", () => {
      const shape = { kind, bounds: "bounds", vertices: "vertices", snapPoints: "snapPoints", edges: "edges" } as unknown as TShape
      expect(util.computeGeometry(shape)).toEqual({
        // Not the object's own `bounds` any more: no shape type declares one, so a stray property
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

  describe("an unknown kind", () => {
    test("should name the kind it could not resolve", () => {
      expect(() => util.create(asPartial({ type: SymbolType.Shape, kind: "sticky-note" }))).toThrow(
        'Unable to create shape, kind: "sticky-note" is unknown'
      )
    })
  })

  describe("aspect ratio", () => {
    /**
     * `IIResizeManager` decided this from outside the symbol, with
     * `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`. IIC-2015 moved it onto the
     * contract, and for shapes it is a flag on the kind table.
     */
    test("should lock only the circle, which has one radius to describe two axes", () => {
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Circle]))).toBe(true)
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Ellipse]))).toBe(false)
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Polygon]))).toBe(false)
    })
  })

  describe("path attributes", () => {
    test("should orient the ellipse, the one kind that needs it", () => {
      const path = util.getSVGElement(util.create(PARTIALS[ShapeKind.Ellipse])).querySelector("path")
      expect(path?.getAttribute("transform")).toContain("rotate(45")
    })

    test("should leave the other kinds untransformed", () => {
      // Before IIC-2002 this lived as an `if (shape.kind === ShapeKind.Ellipse)` in the shared
      // method; the table must not have leaked it onto every kind.
      IMPLEMENTED.filter((kind) => kind !== ShapeKind.Ellipse).forEach((kind) => {
        const path = util.getSVGElement(util.create(PARTIALS[kind])).querySelector("path")
        expect(path?.getAttribute("transform")).toBeNull()
      })
    })

    test("should keep opacity alongside the extra attributes", () => {
      const shape = util.create({ ...PARTIALS[ShapeKind.Ellipse], style: { opacity: 0.5 } } as TPartialDeep<TShape>)
      const path = util.getSVGElement(shape).querySelector("path")
      expect(path?.getAttribute("opacity")).toBe("0.5")
      expect(path?.getAttribute("transform")).toBeTruthy()
    })
  })
})

/**
 * Moved here from `test/unit/symbol/shape/` by IIC-2013, mirroring where the source lives. Both
 * files described the same subject, so each half was being maintained without reference to the
 * other.
 */
describe("ShapeUtil, the contract members", () => {
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

    /**
     * Regression found in review: the containment early-out tested the circle's raw *bounding box*
     * corners (at distance radius·√2 from center) rather than the circle's own vertices (at distance
     * radius) — so once the query was rotated relative to the raw frame, a query that trivially
     * surrounds the actual circle (half-size just over the radius) could still miss the (larger,
     * fictional) box-corner distance, for every half-size up to radius·√2.
     *
     * A circle centered at the origin is unmoved by a rotation about that same origin — only the
     * matrix (and so the query's own inverse mapping) changes, not where the circle actually sits —
     * so a query box centered at the origin is exactly "does this query surround the circle" for
     * every half-size, with no world-space translation to additionally account for.
     */
    test.each([5.1, 7.0])(
      "a rotated circle (radius 5) is selected by a surrounding query of half-size %s",
      (halfSize) => {
        const circle = buildIICircle({ center: { x: 0, y: 0 }, radius: 5 })
        circle.transform = MatrixTransform.identity().rotate(Math.PI / 4)

        expect(
          util.overlaps(circle, { x: -halfSize, y: -halfSize, width: 2 * halfSize, height: 2 * halfSize })
        ).toBe(true)
      }
    )
  })

  describe("getSnapPoints", () => {
    test("should return the shape's snap points, computed from its bounds", () => {
      const circle = buildIICircle()
      const result = util.getSnapPoints(circle)
      expect(result).toStrictEqual(OBBOps.getSnapPoints(util.computeGeometry(circle).bounds))
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
