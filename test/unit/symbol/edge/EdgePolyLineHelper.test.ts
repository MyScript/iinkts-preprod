import
{
  EdgePolyLineHelper,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox,
  EdgeDecoration
} from "../../../../src/iink"

describe("EdgePolyLineHelper", () =>
{
  describe("create", () =>
  {
    const points: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
    test("should create with default style", () =>
    {
      const line = EdgePolyLineHelper.create(points)
      expect(line.style).toEqual(DefaultStyle)
      expect(line.selected).toEqual(false)
      expect(line.deleting).toEqual(false)
      expect(line.isClosed).toEqual(false)
      expect(line.points).toEqual(points)
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "blue", width: 3 }
      const line = EdgePolyLineHelper.create(points, undefined, undefined, style)
      expect(line.style).toEqual(expect.objectContaining(style))
    })
    test("should create with decorations", () =>
    {
      const line = EdgePolyLineHelper.create(points, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      expect(line.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(line.endDecoration).toEqual(EdgeDecoration.Arrow)
    })
    test("should have vertices same ref as points", () =>
    {
      const line = EdgePolyLineHelper.create(points)
      expect(line.vertices).toBe(line.points)
    })
    test("should compute vertices count matching points", () =>
    {
      const line = EdgePolyLineHelper.create(points)
      expect(line.vertices).toHaveLength(3)
    })
    test("should compute bounds with margin", () =>
    {
      const line = EdgePolyLineHelper.create(points, undefined, undefined, { width: 20 })
      expect(line.bounds.x).toEqual(-5)
      expect(line.bounds.y).toEqual(-5)
      expect(line.bounds.width).toEqual(15)
      expect(line.bounds.height).toEqual(15)
    })
    test("should generate unique ids", () =>
    {
      const l1 = EdgePolyLineHelper.create(points)
      const l2 = EdgePolyLineHelper.create(points)
      expect(l1.id).not.toEqual(l2.id)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const pts: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 5 }]
      const line = EdgePolyLineHelper.createFromPartial({ points: pts })
      expect(line.points).toEqual(pts)
    })
    test("should preserve id", () =>
    {
      const pts: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 5 }]
      const line = EdgePolyLineHelper.createFromPartial({ id: "pl-id", points: pts })
      expect(line.id).toEqual("pl-id")
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should recompute after points change", () =>
    {
      const pts: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
      const line = EdgePolyLineHelper.create(pts)
      line.points = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }]
      EdgePolyLineHelper.updateDerivedFields(line)
      expect(line.vertices).toBe(line.points)
      expect(line.bounds.width).toBeGreaterThan(20)
    })
  })

  describe("getResizePoints", () =>
  {
    test("should return one resize point per vertex", () =>
    {
      const pts: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
      const line = EdgePolyLineHelper.create(pts)
      const rp = EdgePolyLineHelper.getResizePoints(line)
      expect(rp).toHaveLength(3)
      expect(rp[0].vertexIndex).toEqual(0)
      expect(rp[2].vertexIndex).toEqual(2)
    })
  })

  describe("overlaps", () =>
  {
    const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 15, y: 15 }, { x: 0, y: 25 }]
    const line = EdgePolyLineHelper.create(middles)
    test("should return true if partially intersects", () =>
    {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(EdgePolyLineHelper.overlaps(line, box)).toEqual(true)
    })
    test("should return true if totally wraps", () =>
    {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(EdgePolyLineHelper.overlaps(line, box)).toEqual(true)
    })
    test("should return false if box is outside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(EdgePolyLineHelper.overlaps(line, box)).toEqual(false)
    })
  })
})
