import type { TPartialDeep, TShape } from "@/iink"
import { ShapeKind, ShapeUtil, SymbolType } from "@/iink"

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
  })

  describe("an unknown kind", () => {
    test("should name the kind it could not resolve", () => {
      expect(() => util.create(asPartial({ type: SymbolType.Shape, kind: "sticky-note" }))).toThrow(
        'Unable to create shape, kind: "sticky-note" is unknown'
      )
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
