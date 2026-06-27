import { TSymbolChar, TPoint, TBox } from "../../../../src/iink"
import { BoxHelper } from "../../../../src/symbol/primitives/Box"
import { TextHelper } from "../../../../src/symbol/text/Text"

const chars: TSymbolChar[] = [
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-1",
    label: "H",
    bounds: { x: 0, y: 0, width: 10, height: 20 }
  },
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-2",
    label: "i",
    bounds: { x: 10, y: 0, width: 6, height: 20 }
  }
]
const point: TPoint = { x: 0, y: 20 }
const bounds: TBox = BoxHelper.createFromBoxes(chars.map(c => c.bounds))

describe("TextHelper", () =>
{
  describe("create", () =>
  {
    test("should return a plain object with correct type", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.type).toBe("text")
      expect(typeof text).toBe("object")
      expect(text.chars).toBe(chars)
      expect(text.point).toBe(point)
      expect(text.bounds).toBe(bounds)
    })

    test("should initialize with empty decorators", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.decorators).toEqual([])
    })

    test("should initialize derived fields (vertices, snapPoints, edges)", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.vertices).toHaveLength(4)
      expect(text.snapPoints).toHaveLength(5)
      expect(text.edges).toHaveLength(4)
    })

    test("should set isClosed to true", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.isClosed).toBe(true)
    })

    test("should set selected and deleting to false", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.selected).toBe(false)
      expect(text.deleting).toBe(false)
    })

    test("should have no rotation by default", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(text.rotation).toBeUndefined()
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const text = TextHelper.createFromPartial({ chars, point, bounds })
      expect(text.chars).toEqual(chars)
      expect(text.point).toEqual(point)
    })

    test("should throw when chars is empty", () =>
    {
      expect(() => TextHelper.createFromPartial({ chars: [], point, bounds })).toThrow()
    })

    test("should throw when point is missing", () =>
    {
      expect(() => TextHelper.createFromPartial({ chars })).toThrow()
    })

    test("should throw when bounds is missing", () =>
    {
      expect(() => TextHelper.createFromPartial({ chars, point })).toThrow()
    })

    test("should set custom id from partial", () =>
    {
      const text = TextHelper.createFromPartial({ id: "my-id", chars, point, bounds })
      expect(text.id).toBe("my-id")
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should compute vertices from corners when no rotation", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      TextHelper.updateDerivedFields(text)
      expect(text.vertices).toEqual(BoxHelper.getCorners(bounds))
    })

    test("should compute rotated vertices when rotation is set", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      text.rotation = { degree: 90, center: { x: 0, y: 0 } }
      TextHelper.updateDerivedFields(text)
      // After rotation the vertices should differ from corners
      expect(text.vertices).not.toEqual(BoxHelper.getCorners(bounds))
      expect(text.vertices).toHaveLength(4)
    })

    test("should recompute edges when bounds change", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const newBounds: TBox = { x: 100, y: 100, width: 50, height: 30 }
      text.bounds = newBounds
      TextHelper.updateDerivedFields(text)
      expect(text.vertices).toEqual(BoxHelper.getCorners(newBounds))
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when box contains a vertex", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const box: TBox = { x: -1, y: -1, width: 5, height: 5 }
      expect(TextHelper.overlaps(text, box)).toBe(true)
    })

    test("should return false when box is completely outside", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const box: TBox = { x: 1000, y: 1000, width: 5, height: 5 }
      expect(TextHelper.overlaps(text, box)).toBe(false)
    })

    test("should return true when box is large and wraps symbol", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const box: TBox = { x: -50, y: -50, width: 500, height: 500 }
      expect(TextHelper.overlaps(text, box)).toBe(true)
    })
  })

  describe("getChildrenOverlaps", () =>
  {
    test("should return chars that overlap with given points", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      // Point inside the first char bounds (x: 0-10, y: 0-20)
      const result = TextHelper.getChildrenOverlaps(text, [{ x: 5, y: 10 }])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("id-1")
    })

    test("should return empty array when no points overlap", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const result = TextHelper.getChildrenOverlaps(text, [{ x: 1000, y: 1000 }])
      expect(result).toEqual([])
    })

    test("should return all chars when all overlap", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      // Points inside both chars
      const result = TextHelper.getChildrenOverlaps(text, [
        { x: 5, y: 10 },
        { x: 13, y: 10 }
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe("updateChildrenStyle", () =>
  {
    test("should propagate color to all chars", () =>
    {
      const text = TextHelper.create(structuredClone(chars), point, bounds)
      text.style.color = "#FF0000"
      TextHelper.updateChildrenStyle(text)
      text.chars.forEach(c => expect(c.color).toBe("#FF0000"))
    })

    test("should update modificationDate", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      const before = text.modificationDate
      text.style.color = "#ABC"
      TextHelper.updateChildrenStyle(text)
      expect(text.modificationDate).toBeGreaterThanOrEqual(before)
    })
  })

  describe("updateChildrenFont", () =>
  {
    test("should propagate fontSize to all chars", () =>
    {
      const text = TextHelper.create(structuredClone(chars), point, bounds)
      TextHelper.updateChildrenFont(text, { fontSize: 24 })
      text.chars.forEach(c => expect(c.fontSize).toBe(24))
    })

    test("should propagate fontWeight to all chars", () =>
    {
      const text = TextHelper.create(structuredClone(chars), point, bounds)
      TextHelper.updateChildrenFont(text, { fontWeight: "bold" })
      text.chars.forEach(c => expect(c.fontWeight).toBe("bold"))
    })

    test("should not change fontWeight when not provided", () =>
    {
      const text = TextHelper.create(structuredClone(chars), point, bounds)
      TextHelper.updateChildrenFont(text, { fontSize: 20 })
      text.chars.forEach(c => expect(c.fontWeight).toBe("normal"))
    })
  })

  describe("getLabel", () =>
  {
    test("should concatenate all char labels", () =>
    {
      const text = TextHelper.create(chars, point, bounds)
      expect(TextHelper.getLabel(text)).toBe("Hi")
    })

    test("should return empty string for empty chars", () =>
    {
      const text = TextHelper.create([], point, bounds)
      expect(TextHelper.getLabel(text)).toBe("")
    })
  })
})
