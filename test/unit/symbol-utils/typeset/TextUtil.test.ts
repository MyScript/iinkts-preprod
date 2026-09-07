import { describe, test, expect, beforeEach } from "@jest/globals"
import { buildIIText } from "../../helpers"
import { TextUtil, SymbolType, OBBOps, MatrixTransform, type TSymbolChar, type TBox } from "@/iink"

const makeChar = (label: string, bounds: TBox): TSymbolChar => ({
  id: `char-${label}`,
  label,
  color: "#000000",
  bounds,
  fontSize: 12,
  fontWeight: "normal",
})

describe("TextUtil", () => {
  let util: TextUtil

  beforeEach(() => {
    util = new TextUtil()
  })

  test("should have type text", () => {
    expect(util.type).toBe(SymbolType.Text)
  })

  describe("create", () => {
    test("should create a text from partial with required fields", () => {
      const point = { x: 10, y: 20 }
      const boundsBox = { x: 10, y: 20, width: 100, height: 30 }
      const chars = [makeChar("A", boundsBox)]
      const text = util.create({ chars, point, bounds: OBBOps.fromBox(boundsBox) })
      expect(text.type).toBe(SymbolType.Text)
      expect(text.point).toEqual(point)
      expect(text.bounds).toEqual(OBBOps.fromBox(boundsBox))
    })

    test("should throw when bounds are missing", () => {
      const bounds = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", bounds)]
      expect(() => util.create({ chars, point: { x: 0, y: 0 } })).toThrow()
    })

    test("should throw when chars are empty", () => {
      expect(() =>
        util.create({ chars: [], point: { x: 0, y: 0 }, bounds: OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }) })
      ).toThrow()
    })

    test("should generate a unique id each call", () => {
      const boundsBox2 = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", boundsBox2)]
      const t1 = util.create({ chars, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      const t2 = util.create({ chars, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      expect(t1.id).not.toBe(t2.id)
    })
  })

  describe("updateDerivedFields", () => {
    test("should not throw on valid text", () => {
      const text = buildIIText()
      expect(() => util.updateDerivedFields(text)).not.toThrow()
    })

    test("should update snapPoints after call", () => {
      const text = buildIIText({ boundingBox: { x: 0, y: 10, width: 20, height: 30 } })
      util.updateDerivedFields(text)
      expect(Array.isArray(text.snapPoints)).toBe(true)
    })
  })

  describe("computeGeometry", () => {
    test("matches the legacy TextOps geometry already computed by create, not merely itself", () => {
      // `buildIIText` builds through `TextOps.create`, which computes vertices/snapPoints/edges
      // inline via the same (untouched) `computeTypesetVertices`/`computeTypesetSnapPoints`/
      // `computeClosedEdges` — an independent oracle `computeGeometry` never touches. Calling
      // `util.updateDerivedFields` here first would make the comparison circular: it IS
      // `Object.assign(s, computeGeometry(s))`.
      const text = buildIIText({ boundingBox: { x: 0, y: 10, width: 20, height: 30 } })

      const geometry = util.computeGeometry(text)

      expect(geometry.bounds).toEqual(text.bounds)
      expect(geometry.vertices).toEqual(text.vertices)
      expect(geometry.snapPoints).toEqual(text.snapPoints)
      expect(geometry.edges).toEqual(text.edges)
      expect(geometry.length).toBe(0)
    })

    test("updateDerivedFields should not write an undeclared length onto the text", () => {
      const text = buildIIText()
      util.updateDerivedFields(text)
      expect(text).not.toHaveProperty("length")
    })
  })

  describe("overlaps", () => {
    test("should return true when text overlaps given box", () => {
      const text = buildIIText({ boundingBox: { x: 5, y: 5, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when text is outside given box", () => {
      const text = buildIIText({ boundingBox: { x: 100, y: 100, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSVGElement", () => {
    test("emits no transform attribute for a symbol that was never moved", () => {
      const text = buildIIText()
      expect(util.getSVGElement(text).getAttribute("transform")).toBeNull()
    })

    test("emits the symbol's matrix as the element transform once moved", () => {
      const text = buildIIText()
      text.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(text).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })

    test("emits the legacy rotate attribute alone while the matrix stays identity", () => {
      // Task 11 removes `.rotation`; until then a rotated text symbol still turns through it, not
      // the matrix, so getSVGElement must keep emitting exactly this — the pre-task-9 attribute.
      const text = buildIIText()
      text.rotation = { degree: 45, center: { x: 1, y: 2 } }
      expect(util.getSVGElement(text).getAttribute("transform")).toBe("rotate(45, 1, 2)")
    })

    test("composes the matrix before the legacy rotate when both apply", () => {
      // Order matters: an SVG transform list applies right-to-left, so the matrix must be the
      // leftmost (outer) term and `rotate` the rightmost (inner) one — `rotate` turns the raw
      // glyphs about `rotation.center` first, then the matrix moves the whole (already-rotated)
      // result. Reversing the order would rotate about a point the matrix had already displaced.
      const text = buildIIText()
      text.rotation = { degree: 45, center: { x: 1, y: 2 } }
      text.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(text).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4) rotate(45, 1, 2)")
    })
  })

  describe("getSnapPoints", () => {
    test("should return the text snapPoints reference", () => {
      const text = buildIIText()
      util.updateDerivedFields(text)
      const result = util.getSnapPoints(text)
      expect(result).toStrictEqual(text.snapPoints)
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIIText())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIIText())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIIText())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIIText())).toBe(true)
    })
  })
})
