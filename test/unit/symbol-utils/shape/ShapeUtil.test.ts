import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIICircle } from "../../helpers"

import type { TPartialDeep, TShape } from "@/iink"
import { MatrixTransform, OBBOps, ShapeKind, ShapeUtil, SymbolType } from "@/iink"

/**
 * `ShapeUtil` used to resolve a kind with a `switch` in each of four methods, which meant a kind
 * could be added to `create` and forgotten in `overlaps`. IIC-2002 replaced them with one table.
 *
 * These tests assert the property that made the table worth it: a kind is either wired everywhere
 * or nowhere. A partially handled kind fails here even though it would have typechecked before.
 */
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

    test("should update derived fields without dispatching elsewhere", () => {
      const created = shape()
      expect(() => util.updateDerivedFields(created)).not.toThrow()
      expect(created.bounds).toBeDefined()
    })

    test("computeGeometry should match the legacy *Ops writer already run by create, not merely itself", () => {
      // `shape()` already ran the legacy per-kind `updateDerivedFields` as part of construction
      // (`ShapeCircleOps`/`ShapeEllipseOps`/`ShapePolygonOps.create` all call it before returning)
      // — an independent oracle `computeGeometry` never touches. Calling `util.updateDerivedFields`
      // here first would make the comparison circular: it IS `Object.assign(s, computeGeometry(s))`.
      const created = shape()

      const geometry = util.computeGeometry(created)

      expect(geometry.bounds).toEqual(created.bounds)
      expect(geometry.vertices).toEqual(created.vertices)
      expect(geometry.snapPoints).toEqual(created.snapPoints)
      expect(geometry.edges).toEqual(created.edges)
      expect(geometry.length).toBe(0)
    })

    test("updateDerivedFields should not write an undeclared length onto the shape", () => {
      const created = shape()
      util.updateDerivedFields(created)
      expect(created).not.toHaveProperty("length")
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
      expect(() => util.updateDerivedFields({ kind } as TShape)).not.toThrow()
      expect(util.overlaps({ kind } as TShape, { x: 0, y: 0, width: 1, height: 1 })).toBe(false)
    })

    test("computeGeometry should stay tolerant too, leaving the shape's own fields as its answer", () => {
      const shape = { kind, bounds: "bounds", vertices: "vertices", snapPoints: "snapPoints", edges: "edges" } as unknown as TShape
      expect(util.computeGeometry(shape)).toEqual({
        bounds: shape.bounds,
        vertices: shape.vertices,
        snapPoints: shape.snapPoints,
        edges: shape.edges,
        length: 0,
      })
    })

    test("updateDerivedFields should perform no write at all for a kind the table does not own, even on a frozen shape", () => {
      // `Object.assign` throws on a frozen object even when writing back the identical value —
      // exactly the state a `SymbolStore`-committed symbol is in. The dispatch this replaced
      // (`SHAPE_KINDS[shape.kind]?.updateDerivedFields(shape)`) never wrote for an unowned kind, so
      // this must not either.
      const frozen = Object.freeze({ kind, bounds: "bounds", vertices: "vertices", snapPoints: "snapPoints", edges: "edges" }) as unknown as TShape
      expect(() => util.updateDerivedFields(frozen)).not.toThrow()
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
      expect(result).toStrictEqual(circle.snapPoints)
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
