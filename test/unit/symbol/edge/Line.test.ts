import { EdgeLineOps } from "../../../../src/symbol/edge/Line"
import { OBBOps } from "../../../../src/symbol/primitives/OBB"
import
{
  TPoint,
  DefaultStyle,
  TStyle,
  TBox,
} from "../../../../src/iink"

describe("Line.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const line = EdgeLineOps.create(start, end, undefined, undefined, style)
      expect(line).toBeDefined()
      expect(line.creationTime).toBeLessThanOrEqual(Date.now())
      expect(line.creationTime).toEqual(line.modificationDate)
      expect(line.style).toEqual(expect.objectContaining(style))
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
      expect(OBBOps.toBox(line.bounds).x).toEqual(-5)
      expect(OBBOps.toBox(line.bounds).y).toEqual(-5)
      expect(line.bounds.width).toEqual(15)
      expect(line.bounds.height).toEqual(15)
      expect(line.vertices).toHaveLength(2)
    })
    test("should create with default style", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const line = EdgeLineOps.create(start, end)
      expect(line.style).toEqual(DefaultStyle)
    })
  })
  describe("overlaps", () =>
  {
    const start: TPoint = { x: 0, y: 0 }
    const end: TPoint = { x: 0, y: 25 }
    const line = EdgeLineOps.create(start, end)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(EdgeLineOps.overlaps(line, boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(EdgeLineOps.overlaps(line, boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(EdgeLineOps.overlaps(line, boundaries)).toEqual(false)
    })
  })
  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 25 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const line = EdgeLineOps.create(start, end, undefined, undefined, style)
      const clone = structuredClone(line)
      expect(clone).toEqual(line)
      expect(clone).not.toBe(line)
    })
  })
})
