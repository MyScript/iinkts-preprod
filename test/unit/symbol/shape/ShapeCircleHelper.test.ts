import
{
  ShapeCircleHelper,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox
} from "../../../../src/iink"

describe("ShapeCircleHelper", () =>
{
  describe("create", () =>
  {
    test("should create with center and radius", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const circle = ShapeCircleHelper.create(center, radius)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(DefaultStyle)
      expect(circle.selected).toEqual(false)
      expect(circle.deleting).toEqual(false)
      expect(circle.center).toEqual(center)
      expect(circle.radius).toEqual(radius)
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "blue", width: 20 }
      const circle = ShapeCircleHelper.create({ x: 0, y: 0 }, 10, style)
      expect(circle.style).toEqual(expect.objectContaining(style))
    })
    test("should compute bounds as center±radius", () =>
    {
      const circle = ShapeCircleHelper.create({ x: 5, y: 0 }, 5)
      expect(circle.bounds.x).toEqual(0)
      expect(circle.bounds.y).toEqual(-5)
      expect(circle.bounds.width).toEqual(10)
      expect(circle.bounds.height).toEqual(10)
    })
    test("should compute minimum 8 vertices for small circle", () =>
    {
      const circle = ShapeCircleHelper.create({ x: 0, y: 0 }, 5)
      expect(circle.vertices).toHaveLength(8)
    })
    test("should compute more vertices for large circle", () =>
    {
      const circle = ShapeCircleHelper.create({ x: 0, y: 0 }, 50)
      expect(circle.vertices).toHaveLength(31)
    })
    test("should generate unique ids", () =>
    {
      const c1 = ShapeCircleHelper.create({ x: 0, y: 0 }, 5)
      const c2 = ShapeCircleHelper.create({ x: 0, y: 0 }, 5)
      expect(c1.id).not.toEqual(c2.id)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const partial = { center: { x: 10, y: 10 }, radius: 5 }
      const circle = ShapeCircleHelper.createFromPartial(partial)
      expect(circle.center).toEqual(partial.center)
      expect(circle.radius).toEqual(partial.radius)
    })
    test("should preserve id from partial", () =>
    {
      const partial = { id: "test-id", center: { x: 0, y: 0 }, radius: 5 }
      const circle = ShapeCircleHelper.createFromPartial(partial)
      expect(circle.id).toEqual("test-id")
    })
    test("should throw if center missing", () =>
    {
      expect(() => ShapeCircleHelper.createFromPartial({ radius: 5 })).toThrow()
    })
    test("should throw if radius missing", () =>
    {
      expect(() => ShapeCircleHelper.createFromPartial({ center: { x: 0, y: 0 } })).toThrow()
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should recompute bounds after center change", () =>
    {
      const circle = ShapeCircleHelper.create({ x: 0, y: 0 }, 10)
      circle.center = { x: 5, y: 5 }
      ShapeCircleHelper.updateDerivedFields(circle)
      expect(circle.bounds.x).toEqual(-5)
      expect(circle.bounds.y).toEqual(-5)
    })
    test("should recompute vertices after radius change", () =>
    {
      const circle = ShapeCircleHelper.create({ x: 0, y: 0 }, 5)
      const prevLen = circle.vertices.length
      circle.radius = 50
      ShapeCircleHelper.updateDerivedFields(circle)
      expect(circle.vertices.length).toBeGreaterThan(prevLen)
    })
  })

  describe("overlaps", () =>
  {
    const circle = ShapeCircleHelper.create({ x: 10, y: 10 }, 10)
    test("should return true if box partially intersects", () =>
    {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(ShapeCircleHelper.overlaps(circle, box)).toEqual(true)
    })
    test("should return true if box fully wraps circle", () =>
    {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(ShapeCircleHelper.overlaps(circle, box)).toEqual(true)
    })
    test("should return false if box is outside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(ShapeCircleHelper.overlaps(circle, box)).toEqual(false)
    })
    test("should return false if box is fully inside circle", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(ShapeCircleHelper.overlaps(circle, box)).toEqual(false)
    })
  })

  describe("createBetweenPoints", () =>
  {
    test("should create with center at origin", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 3, y: 4 }
      const circle = ShapeCircleHelper.createBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(circle.radius).toEqual(5)
    })
    test("should create with default style", () =>
    {
      const circle = ShapeCircleHelper.createBetweenPoints({ x: 0, y: 0 }, { x: 1, y: 0 })
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create with zero radius when origin equals target", () =>
    {
      const pt: TPoint = { x: 5, y: 5 }
      const circle = ShapeCircleHelper.createBetweenPoints(pt, pt)
      expect(circle.radius).toEqual(0)
    })
  })

  describe("updateBetweenPoints", () =>
  {
    test("should update radius based on new target", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const circle = ShapeCircleHelper.createBetweenPoints(origin, { x: 3, y: 4 })
      expect(circle.radius).toEqual(5)
      ShapeCircleHelper.updateBetweenPoints(circle, origin, { x: 6, y: 8 })
      expect(circle.radius).toEqual(10)
    })
    test("should keep center at origin", () =>
    {
      const origin: TPoint = { x: 2, y: 3 }
      const circle = ShapeCircleHelper.createBetweenPoints(origin, { x: 5, y: 7 })
      ShapeCircleHelper.updateBetweenPoints(circle, origin, { x: 10, y: 3 })
      expect(circle.center).toEqual(origin)
    })
  })
})
