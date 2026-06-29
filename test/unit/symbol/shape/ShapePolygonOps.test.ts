import { ShapePolygonOps, TPoint, DefaultStyle, TStyle, TBox, OBBOps } from "@/iink"

describe("ShapePolygonOps", () => {
  describe("create", () => {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    test("should create with default style", () => {
      const polygon = ShapePolygonOps.create(points)
      expect(polygon.style).toEqual(DefaultStyle)
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "green", width: 3 }
      const polygon = ShapePolygonOps.create(points, style)
      expect(polygon.style).toEqual(expect.objectContaining(style))
    })
    test("should have vertices same ref as points", () => {
      const polygon = ShapePolygonOps.create(points)
      expect(polygon.vertices).toBe(polygon.points)
    })
    test("should compute bounds from points", () => {
      const polygon = ShapePolygonOps.create(points)
      expect(OBBOps.toBox(polygon.bounds).x).toBeLessThanOrEqual(0)
      expect(OBBOps.toBox(polygon.bounds).y).toBeLessThanOrEqual(0)
      expect(polygon.bounds.width).toBeGreaterThan(0)
      expect(polygon.bounds.height).toBeGreaterThan(0)
    })
    test("should generate unique ids", () => {
      const p1 = ShapePolygonOps.create(points)
      const p2 = ShapePolygonOps.create(points)
      expect(p1.id).not.toEqual(p2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2, y: 5 },
      ]
      const polygon = ShapePolygonOps.createFromPartial({ points: pts })
      expect(polygon.points).toEqual(pts)
    })
    test("should preserve id", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2, y: 5 },
      ]
      const polygon = ShapePolygonOps.createFromPartial({ id: "poly-id", points: pts })
      expect(polygon.id).toEqual("poly-id")
    })
    test("should throw if fewer than 3 points", () => {
      expect(() =>
        ShapePolygonOps.createFromPartial({
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        })
      ).toThrow()
    })
  })

  describe("updateDerivedFields", () => {
    test("should refresh vertices and bounds after points change", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]
      const polygon = ShapePolygonOps.create(pts)
      polygon.points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      ShapePolygonOps.updateDerivedFields(polygon)
      expect(polygon.bounds.width).toBeGreaterThan(50)
      expect(polygon.vertices).toBe(polygon.points)
    })
  })

  describe("overlaps", () => {
    const pts: TPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const polygon = ShapePolygonOps.create(pts)
    test("should return true if partially intersects", () => {
      const box: TBox = { height: 100, width: 100, x: -50, y: -50 }
      expect(ShapePolygonOps.overlaps(polygon, box)).toEqual(true)
    })
    test("should return true if totally wraps", () => {
      const box: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(ShapePolygonOps.overlaps(polygon, box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 20, width: 20, x: 500, y: 500 }
      expect(ShapePolygonOps.overlaps(polygon, box)).toEqual(false)
    })
    test("should return false if box is inside polygon", () => {
      const box: TBox = { height: 2, width: 2, x: 5, y: 50 }
      expect(ShapePolygonOps.overlaps(polygon, box)).toEqual(false)
    })
  })

  describe("createTriangleBetweenPoints", () => {
    test("should create 3 points", () => {
      const polygon = ShapePolygonOps.createTriangleBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(3)
    })
  })

  describe("createRectangleBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapePolygonOps.createRectangleBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
    test("should update rectangle between points", () => {
      const polygon = ShapePolygonOps.createRectangleBetweenPoints({ x: 0, y: 0 }, { x: 5, y: 5 })
      ShapePolygonOps.updateRectangleBetweenPoints(polygon, { x: 0, y: 0 }, { x: 20, y: 20 })
      expect(polygon.bounds.width).toBeGreaterThan(10)
    })
  })

  describe("createParallelogramBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapePolygonOps.createParallelogramBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
  })

  describe("createRhombusBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapePolygonOps.createRhombusBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
  })
})
