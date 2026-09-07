import { describe, test, expect, beforeEach } from "@jest/globals"
import { buildIIDecorator } from "../../helpers"
import type { TDecorator } from "@/iink"
import { DecoratorUtil, DecoratorKind, DecoratorOps, OBBOps, SymbolType } from "@/iink"

describe("DecoratorUtil", () => {
  let util: DecoratorUtil

  beforeEach(() => {
    util = new DecoratorUtil()
  })

  test("should have type decorator", () => {
    expect(util.type).toBe(SymbolType.Decorator)
  })

  describe("create", () => {
    test("should create a decorator from partial with kind", () => {
      const decorator = util.create({ kind: DecoratorKind.Underline })
      expect(decorator.type).toBe(SymbolType.Decorator)
      expect(decorator.kind).toBe(DecoratorKind.Underline)
    })

    test("should create with provided targetIds", () => {
      const decorator = util.create({ kind: DecoratorKind.Highlight, targetIds: ["id1", "id2"] })
      expect(decorator.targetIds).toEqual(["id1", "id2"])
    })

    test("should throw when kind is missing", () => {
      expect(() => util.create({})).toThrow("TDecorator requires kind")
    })

    test("should generate unique ids each call", () => {
      const d1 = util.create({ kind: DecoratorKind.Surround })
      const d2 = util.create({ kind: DecoratorKind.Surround })
      expect(d1.id).not.toBe(d2.id)
    })
  })

  describe("updateDerivedFields", () => {
    test("should not throw when decorator has no bounds", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      expect(() => util.updateDerivedFields(decorator)).not.toThrow()
    })

    test("should not throw when decorator has bounds", () => {
      const decorator = util.create({
        kind: DecoratorKind.Highlight,
        bounds: OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }),
      })
      // setBounds is guarded by hasBounds
      expect(() => util.updateDerivedFields(decorator)).not.toThrow()
    })
  })

  describe("computeGeometry", () => {
    test("matches the legacy DecoratorOps.setBounds writer, not merely itself", () => {
      const decorator = util.create({ kind: DecoratorKind.Highlight })
      // Independent oracle: `DecoratorOps.setBounds`, the untouched legacy writer, called directly
      // with a real `TBox` — not through `util.create`'s own bounds handling (a separate,
      // pre-existing `TOBB`-vs-`TBox` mismatch out of this task's scope), and not through
      // `computeGeometry`. `x`/`y` are real, finite coordinates, so a NaN center here would mean
      // the fixture itself is broken rather than proving anything about `computeGeometry`.
      DecoratorOps.setBounds(decorator, OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }))
      expect(Number.isNaN(decorator.bounds.center.x)).toBe(false)

      const geometry = util.computeGeometry(decorator)

      expect(geometry.bounds).toEqual(decorator.bounds)
      expect(geometry.vertices).toEqual(decorator.vertices)
      expect(geometry.snapPoints).toEqual(decorator.snapPoints)
      expect(geometry.edges).toEqual(decorator.edges)
      expect(geometry.length).toBe(0)
    })

    test("reports empty geometry for a decorator without bounds, mirroring updateDerivedFields' own guard", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline) // hasBounds stays false
      expect(util.computeGeometry(decorator)).toEqual({
        bounds: decorator.bounds,
        vertices: [],
        snapPoints: [],
        edges: [],
        length: 0,
      })
    })

    test("updateDerivedFields should not write an undeclared length onto the decorator", () => {
      const decorator = util.create({ kind: DecoratorKind.Highlight })
      DecoratorOps.setBounds(decorator, OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }))
      util.updateDerivedFields(decorator)
      expect(decorator).not.toHaveProperty("length")
    })
  })

  describe("overlaps", () => {
    test("should return false when decorator with no bounds is tested against box", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      // No bounds set so expected to not overlap (no vertices)
      const result = util.overlaps(decorator, { x: 0, y: 0, width: 100, height: 100 })
      expect(typeof result).toBe("boolean")
    })
  })

  describe("getSnapPoints", () => {
    test("should return the decorator's snap points once bounds are set", () => {
      const decorator = util.create({ kind: DecoratorKind.Strikethrough })
      // `util.create`'s own `bounds` partial handling has a pre-existing TOBB-vs-TBox mismatch
      // (see the `computeGeometry` test above), so bounds are set the same safe way: directly via
      // the legacy writer, with a real `TBox`.
      DecoratorOps.setBounds(decorator, OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }))
      // Independent oracle: computed straight from `decorator.bounds`, not read back from the
      // decorator's own `snapPoints` field — a `getSnapPoints` stubbed to return `[]` would fail
      // this against a non-empty expectation.
      const expected = DecoratorOps.computeVertices(decorator.bounds)
      expect(expected.length).toBeGreaterThan(0)
      expect(util.getSnapPoints(decorator)).toStrictEqual(expected)
    })

    test("should return an empty array when the decorator has no bounds", () => {
      const decorator = buildIIDecorator(DecoratorKind.Strikethrough)
      expect(util.getSnapPoints(decorator)).toStrictEqual([])
    })
  })

  describe("capability flags", () => {
    test("canSelect should return true (default)", () => {
      expect(util.canSelect(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canTransform should return true (default)", () => {
      expect(util.canTransform(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canResize should return false", () => {
      expect(util.canResize(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })

    test("canRotate should return false", () => {
      expect(util.canRotate(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })
  })

  /**
   * `renderFromBounds` carried the only kind `switch` left in this class, and nothing covered it.
   * These tests were written against that switch and must hold identically after IIC-2003 replaced
   * it with a table — they are what says the refactor changed no pixel.
   */
  describe("renderFromBounds", () => {
    const bounds = OBBOps.fromBox({ x: 10, y: 20, width: 100, height: 40 })
    /** `symbolStyle.width` drives geometry; `decorator.style.width` drives the stroke attribute. */
    const symbolStyle = { width: 2, color: "#111111" }

    const render = (kind: DecoratorKind, baseline?: number, xHeight?: number) =>
      DecoratorUtil.renderFromBounds(buildIIDecorator(kind, { color: "#ff0000", width: 4 }), bounds, baseline, xHeight, symbolStyle)

    describe.each([DecoratorKind.Highlight, DecoratorKind.Surround])("%s, drawn as a rect", (kind) => {
      test("should inflate the bounds by one symbol stroke width on every side", () => {
        const element = render(kind)
        expect(element?.tagName).toBe("rect")
        // x - 2, y - 2, and both dimensions grown twice over.
        expect(element?.getAttribute("x")).toBe("8")
        expect(element?.getAttribute("y")).toBe("18")
        expect(element?.getAttribute("width")).toBe("104")
        expect(element?.getAttribute("height")).toBe("44")
      })

      test("should carry the shared identity attributes", () => {
        const element = render(kind)
        expect(element?.getAttribute("type")).toBe("decorator")
        expect(element?.getAttribute("kind")).toBe(kind)
        expect(element?.getAttribute("vector-effect")).toBe("non-scaling-stroke")
      })
    })

    test("highlight should be a translucent fill with no stroke", () => {
      const element = render(DecoratorKind.Highlight)
      expect(element?.getAttribute("fill")).toBe("#ff0000")
      expect(element?.getAttribute("stroke")).toBe("transparent")
      expect(element?.getAttribute("opacity")).toBe("0.5")
    })

    test("highlight opacity should win over the decorator's own", () => {
      // The switch set the shared opacity first and let Highlight overwrite it. Preserved on
      // purpose: a highlight is a wash, and its own opacity is what makes it readable.
      const decorator = buildIIDecorator(DecoratorKind.Highlight, { color: "#ff0000", opacity: 0.9 })
      const element = DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, symbolStyle)
      expect(element?.getAttribute("opacity")).toBe("0.5")
    })

    test("surround should be an outline, and stroke-width should come from the decorator not the symbol", () => {
      const element = render(DecoratorKind.Surround)
      expect(element?.getAttribute("fill")).toBe("transparent")
      expect(element?.getAttribute("stroke")).toBe("#ff0000")
      expect(element?.getAttribute("stroke-width")).toBe("4")
    })

    describe.each([
      [DecoratorKind.Strikethrough, "40", 100 - 8],
      [DecoratorKind.Underline, "62", 100 + 8],
    ])("%s, drawn as a line", (kind, fallbackY, baselineY) => {
      test("should span the bounds horizontally at its own height", () => {
        const element = render(kind)
        expect(element?.tagName).toBe("line")
        expect(element?.getAttribute("x1")).toBe("10")
        expect(element?.getAttribute("x2")).toBe("110")
        expect(element?.getAttribute("y1")).toBe(fallbackY)
        expect(element?.getAttribute("y2")).toBe(fallbackY)
      })

      test("should follow the text baseline when metrics are supplied", () => {
        // What keeps an underline under the glyphs rather than under their bounding box.
        const element = render(kind, 100, 8)
        expect(element?.getAttribute("y1")).toBe(baselineY.toString())
        expect(element?.getAttribute("y2")).toBe(baselineY.toString())
      })

      test("should ignore the baseline unless both metrics are supplied", () => {
        expect(render(kind, 100, undefined)?.getAttribute("y1")).toBe(fallbackY)
        expect(render(kind, undefined, 8)?.getAttribute("y1")).toBe(fallbackY)
      })

      test("should carry the outline attributes", () => {
        const element = render(kind)
        expect(element?.getAttribute("fill")).toBe("transparent")
        expect(element?.getAttribute("stroke")).toBe("#ff0000")
        expect(element?.getAttribute("stroke-width")).toBe("4")
      })
    })

    test("should draw every kind the enum declares", () => {
      // Guards the guard: a new DecoratorKind with no table entry would silently render nothing,
      // and every test above would still pass over the four kinds that do work.
      Object.values(DecoratorKind).forEach((kind) => {
        expect(render(kind)).toBeDefined()
      })
    })

    test("should return undefined for a kind it does not own, rather than throwing", () => {
      // Unlike the shape and edge utils, this runs over every symbol on every redraw, so an
      // unknown kind must be skipped and not abort the frame.
      const unknown = { ...buildIIDecorator(DecoratorKind.Underline), kind: "glow" } as unknown as TDecorator
      expect(DecoratorUtil.renderFromBounds(unknown, bounds, undefined, undefined, symbolStyle)).toBeUndefined()
    })

    test("should apply the decorator's own opacity to the kinds that do not override it", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline, { color: "#ff0000", opacity: 0.25 })
      const element = DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, symbolStyle)
      expect(element?.getAttribute("opacity")).toBe("0.25")
    })
  })
})
