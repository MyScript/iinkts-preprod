import
{
  ShapeEllipseHelper,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox
} from "../../../../src/iink"

describe("ShapeEllipseHelper", () =>
{
  describe("create", () =>
  {
    test("should create with default style", () =>
    {
      const ellipse = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 10, 0)
      expect(ellipse.style).toEqual(DefaultStyle)
      expect(ellipse.selected).toEqual(false)
      expect(ellipse.deleting).toEqual(false)
      expect(ellipse.isClosed).toEqual(true)
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "red", width: 4 }
      const ellipse = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 10, 0, style)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
    })
    test("should compute bounds from vertices", () =>
    {
      const ellipse = ShapeEllipseHelper.create({ x: 5, y: 0 }, 5, 10, 0)
      expect(ellipse.bounds.x).toBeCloseTo(0, 0)
      expect(ellipse.bounds.y).toBeCloseTo(-10, 0)
      expect(ellipse.bounds.width).toBeCloseTo(10, 0)
      expect(ellipse.bounds.height).toBeCloseTo(20, 0)
    })
    test("should compute minimum 8 vertices for small ellipse", () =>
    {
      const ellipse = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 10, 0)
      expect(ellipse.vertices).toHaveLength(8)
    })
    test("should compute more vertices for large ellipse", () =>
    {
      const ellipse = ShapeEllipseHelper.create({ x: 0, y: 0 }, 50, 100, 0)
      expect(ellipse.vertices).toHaveLength(50)
    })
    test("should generate unique ids", () =>
    {
      const e1 = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 5, 0)
      const e2 = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 5, 0)
      expect(e1.id).not.toEqual(e2.id)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const partial = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 10, orientation: 0 }
      const ellipse = ShapeEllipseHelper.createFromPartial(partial)
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
    test("should preserve id", () =>
    {
      const partial = { id: "my-id", center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5 }
      const ellipse = ShapeEllipseHelper.createFromPartial(partial)
      expect(ellipse.id).toEqual("my-id")
    })
    test("should throw if center missing", () =>
    {
      expect(() => ShapeEllipseHelper.createFromPartial({ radiusX: 5, radiusY: 5 })).toThrow()
    })
    test("should throw if radiusX missing", () =>
    {
      expect(() => ShapeEllipseHelper.createFromPartial({ center: { x: 0, y: 0 }, radiusY: 5 })).toThrow()
    })
    test("should throw if radiusY missing", () =>
    {
      expect(() => ShapeEllipseHelper.createFromPartial({ center: { x: 0, y: 0 }, radiusX: 5 })).toThrow()
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should recompute bounds after radiusX change", () =>
    {
      const ellipse = ShapeEllipseHelper.create({ x: 0, y: 0 }, 5, 10, 0)
      ellipse.radiusX = 20
      ShapeEllipseHelper.updateDerivedFields(ellipse)
      expect(ellipse.bounds.width).toBeCloseTo(40, 0)
    })
  })

  describe("overlaps", () =>
  {
    const ellipse = ShapeEllipseHelper.create({ x: 5, y: 0 }, 5, 10, 0)
    test("should return true if partially intersects", () =>
    {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(ShapeEllipseHelper.overlaps(ellipse, box)).toEqual(true)
    })
    test("should return true if totally wraps", () =>
    {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(ShapeEllipseHelper.overlaps(ellipse, box)).toEqual(true)
    })
    test("should return false if box is outside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(ShapeEllipseHelper.overlaps(ellipse, box)).toEqual(false)
    })
    test("should return false if box is fully inside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(ShapeEllipseHelper.overlaps(ellipse, box)).toEqual(false)
    })
  })

  describe("createBetweenPoints", () =>
  {
    test("should set center as midpoint", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const ellipse = ShapeEllipseHelper.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 5, y: 10 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
    test("should create with default style", () =>
    {
      const ellipse = ShapeEllipseHelper.createBetweenPoints({ x: 0, y: 0 }, { x: 4, y: 6 })
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create with zero radii when origin equals target", () =>
    {
      const pt: TPoint = { x: 1, y: 2 }
      const ellipse = ShapeEllipseHelper.createBetweenPoints(pt, pt)
      expect(ellipse.radiusX).toEqual(0)
      expect(ellipse.radiusY).toEqual(0)
    })
  })

  describe("updateBetweenPoints", () =>
  {
    test("should update center and radii", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const ellipse = ShapeEllipseHelper.createBetweenPoints(origin, { x: 4, y: 6 })
      ShapeEllipseHelper.updateBetweenPoints(ellipse, origin, { x: 10, y: 20 })
      expect(ellipse.center).toEqual({ x: 5, y: 10 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
  })
})
