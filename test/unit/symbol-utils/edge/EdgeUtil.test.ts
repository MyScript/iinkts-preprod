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
  })
})
