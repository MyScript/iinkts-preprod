import
{
  EdgeLineOps,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox,
  EdgeDecoration
} from "../../../../src/iink"
import { OBBOps } from "../../../../src/symbol/primitives/OBB"

describe("EdgeLineOps", () =>
{
  describe("create", () =>
  {
    test("should create with default style", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 10, y: 10 }
      const line = EdgeLineOps.create(start, end)
      expect(line.style).toEqual(DefaultStyle)
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
    })
    test("should create with custom style", () =>
    {
      const style: TStyle = { color: "blue", width: 5 }
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 5, y: 5 }, undefined, undefined, style)
      expect(line.style).toEqual(expect.objectContaining(style))
    })
    test("should create with decorations", () =>
    {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 5, y: 5 }, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      expect(line.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(line.endDecoration).toEqual(EdgeDecoration.Arrow)
    })
    test("should compute 2 vertices", () =>
    {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 5, y: 5 })
      expect(line.vertices).toHaveLength(2)
    })
    test("vertices[0] same ref as start", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const line = EdgeLineOps.create(start, end)
      expect(line.vertices[0]).toBe(line.start)
      expect(line.vertices[1]).toBe(line.end)
    })
    test("should compute bounds with margin", () =>
    {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 5, y: 5 }, undefined, undefined, { width: 20 })
      expect(OBBOps.toBox(line.bounds).x).toEqual(-5)
      expect(OBBOps.toBox(line.bounds).y).toEqual(-5)
      expect(line.bounds.width).toEqual(15)
      expect(line.bounds.height).toEqual(15)
    })
    test("should generate unique ids", () =>
    {
      const l1 = EdgeLineOps.create({ x: 0, y: 0 }, { x: 1, y: 1 })
      const l2 = EdgeLineOps.create({ x: 0, y: 0 }, { x: 1, y: 1 })
      expect(l1.id).not.toEqual(l2.id)
    })
  })

  describe("createFromPartial", () =>
  {
    test("should create from valid partial", () =>
    {
      const partial = { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }
      const line = EdgeLineOps.createFromPartial(partial)
      expect(line.start).toEqual(partial.start)
      expect(line.end).toEqual(partial.end)
    })
    test("should preserve id", () =>
    {
      const partial = { id: "line-id", start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }
      const line = EdgeLineOps.createFromPartial(partial)
      expect(line.id).toEqual("line-id")
    })
    test("should throw if start missing", () =>
    {
      expect(() => EdgeLineOps.createFromPartial({ end: { x: 5, y: 5 } })).toThrow()
    })
    test("should throw if end missing", () =>
    {
      expect(() => EdgeLineOps.createFromPartial({ start: { x: 0, y: 0 } })).toThrow()
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should recompute vertices and bounds after end change", () =>
    {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 5, y: 5 })
      line.end = { x: 50, y: 50 }
      EdgeLineOps.updateDerivedFields(line)
      expect(line.vertices[1]).toBe(line.end)
      expect(line.bounds.width).toBeGreaterThan(20)
    })
  })

  describe("getResizePoints", () =>
  {
    test("should return 2 resize points", () =>
    {
      const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 10, y: 10 })
      const pts = EdgeLineOps.getResizePoints(line)
      expect(pts).toHaveLength(2)
      expect(pts[0].vertexIndex).toEqual(0)
      expect(pts[1].vertexIndex).toEqual(1)
    })
  })

  describe("overlaps", () =>
  {
    const line = EdgeLineOps.create({ x: 0, y: 0 }, { x: 0, y: 25 })
    test("should return true if partially intersects", () =>
    {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(EdgeLineOps.overlaps(line, box)).toEqual(true)
    })
    test("should return true if totally wraps", () =>
    {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(EdgeLineOps.overlaps(line, box)).toEqual(true)
    })
    test("should return false if box is outside", () =>
    {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(EdgeLineOps.overlaps(line, box)).toEqual(false)
    })
  })
})
