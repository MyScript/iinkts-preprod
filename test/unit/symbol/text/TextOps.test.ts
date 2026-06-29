import { TSymbolChar, TPoint, TBox, BoxOps, OBBOps, TextOps } from "@/iink"

const chars: TSymbolChar[] = [
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-1",
    label: "H",
    bounds: { x: 0, y: 0, width: 10, height: 20 },
  },
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-2",
    label: "i",
    bounds: { x: 10, y: 0, width: 6, height: 20 },
  },
]
const point: TPoint = { x: 0, y: 20 }
const bounds: TBox = BoxOps.createFromBoxes(chars.map((c) => c.bounds))

describe("TextOps", () => {
  describe("create", () => {
    test("should return a plain object with correct type", () => {
      const text = TextOps.create(chars, point, bounds)
      expect(text.type).toBe("text")
      expect(typeof text).toBe("object")
      expect(text.chars).toBe(chars)
      expect(text.point).toBe(point)
      expect(text.bounds).toEqual(OBBOps.fromBox(bounds))
    })

    test("should initialize with empty decorators", () => {
      const text = TextOps.create(chars, point, bounds)
      expect(text.decorators).toEqual([])
    })

    test("should initialize derived fields (vertices, snapPoints, edges)", () => {
      const text = TextOps.create(chars, point, bounds)
      expect(text.vertices).toHaveLength(4)
      expect(text.snapPoints).toHaveLength(5)
      expect(text.edges).toHaveLength(4)
    })

    test("should have no rotation by default", () => {
      const text = TextOps.create(chars, point, bounds)
      expect(text.rotation).toBeUndefined()
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const text = TextOps.createFromPartial({ chars, point, bounds })
      expect(text.chars).toEqual(chars)
      expect(text.point).toEqual(point)
    })

    test("should throw when chars is empty", () => {
      expect(() => TextOps.createFromPartial({ chars: [], point, bounds })).toThrow()
    })

    test("should throw when point is missing", () => {
      expect(() => TextOps.createFromPartial({ chars })).toThrow()
    })

    test("should throw when bounds is missing", () => {
      expect(() => TextOps.createFromPartial({ chars, point })).toThrow()
    })

    test("should set custom id from partial", () => {
      const text = TextOps.createFromPartial({ id: "my-id", chars, point, bounds })
      expect(text.id).toBe("my-id")
    })
  })

  describe("updateDerivedFields", () => {
    test("should compute vertices from corners when no rotation", () => {
      const text = TextOps.create(chars, point, bounds)
      TextOps.updateDerivedFields(text)
      expect(text.vertices).toEqual(BoxOps.getCorners(bounds))
    })

    test("should compute rotated vertices when rotation is set", () => {
      const text = TextOps.create(chars, point, bounds)
      text.rotation = { degree: 90, center: { x: 0, y: 0 } }
      TextOps.updateDerivedFields(text)
      // After rotation the vertices should differ from corners
      expect(text.vertices).not.toEqual(BoxOps.getCorners(bounds))
      expect(text.vertices).toHaveLength(4)
    })

    test("should recompute edges when bounds change", () => {
      const text = TextOps.create(chars, point, bounds)
      const newBounds: TBox = { x: 100, y: 100, width: 50, height: 30 }
      text.bounds = OBBOps.fromBox(newBounds)
      TextOps.updateDerivedFields(text)
      expect(text.vertices).toEqual(BoxOps.getCorners(newBounds))
    })
  })

  describe("overlaps", () => {
    test("should return true when box contains a vertex", () => {
      const text = TextOps.create(chars, point, bounds)
      const box: TBox = { x: -1, y: -1, width: 5, height: 5 }
      expect(TextOps.overlaps(text, box)).toBe(true)
    })

    test("should return false when box is completely outside", () => {
      const text = TextOps.create(chars, point, bounds)
      const box: TBox = { x: 1000, y: 1000, width: 5, height: 5 }
      expect(TextOps.overlaps(text, box)).toBe(false)
    })

    test("should return true when box is large and wraps symbol", () => {
      const text = TextOps.create(chars, point, bounds)
      const box: TBox = { x: -50, y: -50, width: 500, height: 500 }
      expect(TextOps.overlaps(text, box)).toBe(true)
    })
  })

  describe("getChildrenOverlaps", () => {
    test("should return chars that overlap with given points", () => {
      const text = TextOps.create(chars, point, bounds)
      // Point inside the first char bounds (x: 0-10, y: 0-20)
      const result = TextOps.getChildrenOverlaps(text, [{ x: 5, y: 10 }])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("id-1")
    })

    test("should return empty array when no points overlap", () => {
      const text = TextOps.create(chars, point, bounds)
      const result = TextOps.getChildrenOverlaps(text, [{ x: 1000, y: 1000 }])
      expect(result).toEqual([])
    })

    test("should return all chars when all overlap", () => {
      const text = TextOps.create(chars, point, bounds)
      // Points inside both chars
      const result = TextOps.getChildrenOverlaps(text, [
        { x: 5, y: 10 },
        { x: 13, y: 10 },
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe("updateChildrenStyle", () => {
    test("should propagate color to all chars", () => {
      const text = TextOps.create(structuredClone(chars), point, bounds)
      text.style.color = "#FF0000"
      TextOps.updateChildrenStyle(text)
      text.chars.forEach((c) => expect(c.color).toBe("#FF0000"))
    })

    test("should update modificationDate", () => {
      const text = TextOps.create(chars, point, bounds)
      const before = text.modificationDate
      text.style.color = "#ABC"
      TextOps.updateChildrenStyle(text)
      expect(text.modificationDate).toBeGreaterThanOrEqual(before)
    })
  })

  describe("updateChildrenFont", () => {
    test("should propagate fontSize to all chars", () => {
      const text = TextOps.create(structuredClone(chars), point, bounds)
      TextOps.updateChildrenFont(text, { fontSize: 24 })
      text.chars.forEach((c) => expect(c.fontSize).toBe(24))
    })

    test("should propagate fontWeight to all chars", () => {
      const text = TextOps.create(structuredClone(chars), point, bounds)
      TextOps.updateChildrenFont(text, { fontWeight: "bold" })
      text.chars.forEach((c) => expect(c.fontWeight).toBe("bold"))
    })

    test("should not change fontWeight when not provided", () => {
      const text = TextOps.create(structuredClone(chars), point, bounds)
      TextOps.updateChildrenFont(text, { fontSize: 20 })
      text.chars.forEach((c) => expect(c.fontWeight).toBe("normal"))
    })
  })

  describe("getLabel", () => {
    test("should concatenate all char labels", () => {
      const text = TextOps.create(chars, point, bounds)
      expect(TextOps.getLabel(text)).toBe("Hi")
    })

    test("should return empty string for empty chars", () => {
      const text = TextOps.create([], point, bounds)
      expect(TextOps.getLabel(text)).toBe("")
    })
  })
})
