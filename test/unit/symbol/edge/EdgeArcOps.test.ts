import
{
  EdgeArcOps,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox,
  EdgeDecoration,
  OBBOps
} from "@/iink"

describe("EdgeArcOps", () =>
{
  describe("create", () =>
  {
    test("should create with default style", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const arc = EdgeArcOps.create(center, Math.PI / 4, Math.PI / 2, 10, 10, 0)
      expect(arc.style).toEqual(DefaultStyle)
      expect(arc.center).toEqual(center)
      expect(arc.startAngle).toEqual(Math.PI / 4)
      expect(arc.sweepAngle).toEqual(Math.PI / 2)
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "blue", width: 5 }
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0, undefined, undefined, style)
      expect(arc.style).toEqual(expect.objectContaining(style))
    })
    test("should create with decorations", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      expect(arc.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(arc.endDecoration).toEqual(EdgeDecoration.Arrow)
    })
    test("should compute bounds", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, 3 * Math.PI / 4, 10, 50, 0, undefined, undefined, { width: 20 })
      expect(OBBOps.toBox(arc.bounds).x).toEqual(-15)
      expect(OBBOps.toBox(arc.bounds).y).toEqual(-5)
      expect(+arc.bounds.width.toFixed(0)).toEqual(27)
      expect(+arc.bounds.height.toFixed(0)).toEqual(60)
    })
    test("should compute vertices", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 4, 5, 5, 0)
      expect(arc.vertices).toHaveLength(9)
    })
    test("should generate unique ids", () =>
    {
      const a1 = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 5, 5, 0)
      const a2 = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 5, 5, 0)
      expect(a1.id).not.toEqual(a2.id)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const partial = {
        center: { x: 0, y: 0 },
        startAngle: Math.PI / 4,
        sweepAngle: Math.PI / 2,
        radiusX: 10,
        radiusY: 10,
        phi: 0
      }
      const arc = EdgeArcOps.createFromPartial(partial)
      expect(arc.center).toEqual(partial.center)
      expect(arc.startAngle).toEqual(partial.startAngle)
    })
    test("should preserve id", () =>
    {
      const partial = {
        id: "arc-id",
        center: { x: 0, y: 0 },
        startAngle: 0,
        sweepAngle: Math.PI,
        radiusX: 5,
        radiusY: 5
      }
      const arc = EdgeArcOps.createFromPartial(partial)
      expect(arc.id).toEqual("arc-id")
    })
    test("should throw if center missing", () =>
    {
      expect(() => EdgeArcOps.createFromPartial({ startAngle: 0, sweepAngle: Math.PI, radiusX: 5, radiusY: 5 })).toThrow()
    })
    test("should throw if startAngle missing", () =>
    {
      expect(() => EdgeArcOps.createFromPartial({ center: { x: 0, y: 0 }, sweepAngle: Math.PI, radiusX: 5, radiusY: 5 })).toThrow()
    })
  })

  describe("computeVertices", () =>
  {
    test("should compute vertices for clockwise arc", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 4, 5, 5, 0)
      const v = EdgeArcOps.computeVertices(arc)
      expect(v).toHaveLength(9)
      expect(v).toEqual(expect.arrayContaining([{ x: 3.536, y: 3.536 }]))
    })
    test("should compute vertices for counter-clockwise arc", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, -Math.PI / 4, 5, 5, 0)
      const v = EdgeArcOps.computeVertices(arc)
      expect(v.length).toBeGreaterThan(2)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should recompute after center change", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      const prevBounds = { ...arc.bounds }
      arc.center = { x: 50, y: 50 }
      EdgeArcOps.updateDerivedFields(arc)
      expect(OBBOps.toBox(arc.bounds).x).not.toEqual(OBBOps.toBox(prevBounds).x)
    })
  })

  describe("getResizePoints", () =>
  {
    test("should return 3 resize points (start, mid, end)", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 2, 10, 10, 0)
      const pts = EdgeArcOps.getResizePoints(arc)
      expect(pts).toHaveLength(3)
      expect(pts[0].vertexIndex).toEqual(0)
      expect(pts[2].vertexIndex).toEqual(arc.vertices.length - 1)
    })
    test("mid point index is middle vertex", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 2, 10, 10, 0)
      const pts = EdgeArcOps.getResizePoints(arc)
      const mid = Math.floor(arc.vertices.length / 2)
      expect(pts[1].vertexIndex).toEqual(mid)
    })
  })

  describe("snapPoints", () =>
  {
    test("should have 2 snap points (start and end)", () =>
    {
      const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 4, 5, 5, 0)
      expect(arc.snapPoints).toHaveLength(2)
      expect(arc.snapPoints[0]).toEqual({ x: 3.536, y: 3.536 })
      expect(arc.snapPoints[1]).toEqual({ x: 0, y: 5 })
    })
  })

  describe("overlaps", () =>
  {
    const arc = EdgeArcOps.create({ x: 0, y: 0 }, Math.PI / 4, Math.PI / 2, 10, 50, 0)
    test("should return true if partially intersects", () =>
    {
      const box: TBox = { height: 20, width: 20, x: 0, y: 45 }
      expect(EdgeArcOps.overlaps(arc, box)).toEqual(true)
    })
    test("should return true if totally wraps", () =>
    {
      const box: TBox = { height: 200, width: 100, x: -50, y: -5 }
      expect(EdgeArcOps.overlaps(arc, box)).toEqual(true)
    })
    test("should return false if box is outside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(EdgeArcOps.overlaps(arc, box)).toEqual(false)
    })
  })
})
