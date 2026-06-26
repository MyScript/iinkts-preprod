import { TMathElement, TPoint, TBox } from "../../../../src/iink"
import { BoxHelper } from "../../../../src/symbol/helpers/BoxHelper"
import { IIMathHelper } from "../../../../src/symbol/helpers/IIMathHelper"

const elements: TMathElement[] = [
  {
    id: "e-1",
    label: "x",
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: { x: 0, y: 0, width: 10, height: 16 }
  },
  {
    id: "e-2",
    label: "+",
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: { x: 15, y: 0, width: 8, height: 16 }
  }
]
const point: TPoint = { x: 0, y: 16 }
const bounds: TBox = BoxHelper.createFromBoxes(elements.map(e => e.bounds))

describe("IIMathHelper", () =>
{
  describe("create", () =>
  {
    test("should return a plain object with correct type", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.type).toBe("math")
      expect(typeof math).toBe("object")
      expect(math.elements).toBe(elements)
      expect(math.point).toBe(point)
      expect(math.bounds).toBe(bounds)
    })

    test("should initialize with empty decorators", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.decorators).toEqual([])
    })

    test("should initialize derived fields (vertices, snapPoints, edges)", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.vertices).toHaveLength(4)
      expect(math.snapPoints).toHaveLength(5)
      expect(math.edges).toHaveLength(4)
    })

    test("should set isClosed to true", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.isClosed).toBe(true)
    })

    test("should set selected and deleting to false", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.selected).toBe(false)
      expect(math.deleting).toBe(false)
    })

    test("should have no rotation by default", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(math.rotation).toBeUndefined()
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const math = IIMathHelper.createFromPartial({ elements, point, bounds })
      expect(math.elements).toHaveLength(2)
      expect(math.point).toEqual(point)
    })

    test("should throw when elements is empty", () =>
    {
      expect(() => IIMathHelper.createFromPartial({ elements: [], point, bounds })).toThrow()
    })

    test("should throw when point is missing", () =>
    {
      expect(() => IIMathHelper.createFromPartial({ elements })).toThrow()
    })

    test("should throw when bounds is missing", () =>
    {
      expect(() => IIMathHelper.createFromPartial({ elements, point })).toThrow()
    })

    test("should set custom id from partial", () =>
    {
      const math = IIMathHelper.createFromPartial({ id: "my-math", elements, point, bounds })
      expect(math.id).toBe("my-math")
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should compute vertices from corners when no rotation", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      IIMathHelper.updateDerivedFields(math)
      expect(math.vertices).toEqual(BoxHelper.getCorners(bounds))
    })

    test("should compute rotated vertices when rotation is set", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      math.rotation = { degree: 90, center: { x: 0, y: 0 } }
      IIMathHelper.updateDerivedFields(math)
      expect(math.vertices).not.toEqual(BoxHelper.getCorners(bounds))
      expect(math.vertices).toHaveLength(4)
    })

    test("should recompute edges when bounds change", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const newBounds: TBox = { x: 100, y: 100, width: 50, height: 30 }
      math.bounds = newBounds
      IIMathHelper.updateDerivedFields(math)
      expect(math.vertices).toEqual(BoxHelper.getCorners(newBounds))
    })
  })

  describe("overlaps", () =>
  {
    test("should return true when box contains a vertex", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const box: TBox = { x: -1, y: -1, width: 5, height: 5 }
      expect(IIMathHelper.overlaps(math, box)).toBe(true)
    })

    test("should return false when box is completely outside", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const box: TBox = { x: 1000, y: 1000, width: 5, height: 5 }
      expect(IIMathHelper.overlaps(math, box)).toBe(false)
    })

    test("should return true when large box wraps symbol", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const box: TBox = { x: -50, y: -50, width: 500, height: 500 }
      expect(IIMathHelper.overlaps(math, box)).toBe(true)
    })
  })

  describe("getChildrenOverlaps", () =>
  {
    test("should return elements that overlap with given points", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      // Point inside first element bounds (x: 0-10, y: 0-16)
      const result = IIMathHelper.getChildrenOverlaps(math, [{ x: 5, y: 8 }])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("e-1")
    })

    test("should return empty array when no points overlap", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const result = IIMathHelper.getChildrenOverlaps(math, [{ x: 1000, y: 1000 }])
      expect(result).toEqual([])
    })

    test("should return all elements when all overlap", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const result = IIMathHelper.getChildrenOverlaps(math, [
        { x: 5, y: 8 },
        { x: 18, y: 8 }
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe("updateChildrenStyle", () =>
  {
    test("should propagate color to all elements", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, bounds)
      math.style.color = "#FF0000"
      IIMathHelper.updateChildrenStyle(math)
      math.elements.forEach(e => expect(e.color).toBe("#FF0000"))
    })

    test("should update modificationDate", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      const before = math.modificationDate
      math.style.color = "#ABC"
      IIMathHelper.updateChildrenStyle(math)
      expect(math.modificationDate).toBeGreaterThanOrEqual(before)
    })
  })

  describe("updateChildrenFont", () =>
  {
    test("should propagate fontSize to all elements", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, bounds)
      IIMathHelper.updateChildrenFont(math, { fontSize: 24 })
      math.elements.forEach(e => expect(e.fontSize).toBe(24))
    })

    test("should propagate fontWeight to all elements", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, bounds)
      IIMathHelper.updateChildrenFont(math, { fontWeight: "bold" })
      math.elements.forEach(e => expect(e.fontWeight).toBe("bold"))
    })

    test("should propagate fontFamily to all elements", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, bounds)
      IIMathHelper.updateChildrenFont(math, { fontFamily: "Times" })
      math.elements.forEach(e => expect(e.fontFamily).toBe("Times"))
    })

    test("should not change fontWeight when not provided", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, bounds)
      IIMathHelper.updateChildrenFont(math, { fontSize: 20 })
      math.elements.forEach(e => expect(e.fontWeight).toBe("normal"))
    })
  })

  describe("getLabel", () =>
  {
    test("should concatenate all element labels", () =>
    {
      const math = IIMathHelper.create(elements, point, bounds)
      expect(IIMathHelper.getLabel(math)).toBe("x+")
    })

    test("should return empty string for empty elements", () =>
    {
      const math = IIMathHelper.create([], point, bounds)
      expect(IIMathHelper.getLabel(math)).toBe("")
    })
  })
})
