import
{
  OIShapeEllipse,
  TPoint,
  DefaultStyle,
  TStyle,
  SELECTION_MARGIN,
  TBoundingBox
} from "../../../src/iink"

describe("OIShapeEllipse.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = new OIShapeEllipse(style, center, radiusX, radiusY)
      expect(ellipse).toBeDefined()
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
      expect(ellipse.creationTime).toEqual(ellipse.modificationDate)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
      expect(ellipse.selected).toEqual(false)
      expect(ellipse.center).toEqual(center)
      expect(ellipse.radiusX).toEqual(radiusX)
      expect(ellipse.radiusY).toEqual(radiusY)
      expect(ellipse.boundingBox.x).toEqual(0)
      expect(ellipse.boundingBox.y).toEqual(-10)
      expect(ellipse.boundingBox.width).toEqual(10)
      expect(ellipse.boundingBox.height).toEqual(20)
      expect(ellipse.vertices).toHaveLength(8)
    })
    test("should create with default style", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const ellipse = new OIShapeEllipse({}, center, radiusX, radiusY)
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create and have many vertices", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 50
      const radiusY = 100
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = new OIShapeEllipse(style, center, radiusX, radiusY)
      expect(ellipse.vertices).toHaveLength(50)
    })
  })

  describe("createFromLine", () =>
  {
    test("should create", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse).toBeDefined()
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
      expect(ellipse.creationTime).toEqual(ellipse.modificationDate)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
      expect(ellipse.selected).toEqual(false)
      expect(ellipse.center).toEqual({ x: 2.5, y: 4 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(2)
    })
    test("should create with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const ellipse = OIShapeEllipse.createFromLine({}, origin, target)
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 1, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse.center).toEqual(origin)
      expect(ellipse.radiusX).toEqual(0)
      expect(ellipse.radiusY).toEqual(0)
      expect(ellipse.boundingBox.height).toEqual(0)
      expect(ellipse.boundingBox.width).toEqual(0)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
      expect(ellipse.vertices).toHaveLength(8)
    })
    test("should create when origin is at the top left", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 11, y: 22 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.boundingBox.width).toEqual(10)
      expect(ellipse.boundingBox.height).toEqual(20)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
    test("should create when origin is at the top right", () =>
    {
      const origin: TPoint = { x: 11, y: 2 }
      const target: TPoint = { x: 1, y: 22 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.boundingBox.width).toEqual(10)
      expect(ellipse.boundingBox.height).toEqual(20)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
    test("should create when origin is at the bottom right", () =>
    {
      const origin: TPoint = { x: 11, y: 22 }
      const target: TPoint = { x: 1, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.boundingBox.width).toEqual(10)
      expect(ellipse.boundingBox.height).toEqual(20)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
    test("should create when origin is at the bottom left", () =>
    {
      const origin: TPoint = { x: 1, y: 22 }
      const target: TPoint = { x: 11, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.boundingBox.width).toEqual(10)
      expect(ellipse.boundingBox.height).toEqual(20)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
  })

  describe("updateFromLine", () =>
  {
    const origin: TPoint = { x: 1, y: 2 }
    const target: TPoint = { x: 4, y: 6 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const ellipse = OIShapeEllipse.createFromLine(style, origin, target)
    test("should updateFromLine when target x increas", () =>
    {
      expect(ellipse.center).toEqual({ x: 2.5, y: 4 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(2)
      expect(ellipse.boundingBox.width).toEqual(3)
      expect(ellipse.boundingBox.height).toEqual(4)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
      OIShapeEllipse.updateFromLine(ellipse, origin, { x: target.x + 6, y: target.y })
      expect(ellipse.center).toEqual({ x: 5.5, y: 4 })
      expect(ellipse.radiusX).toEqual(4.5)
      expect(ellipse.radiusY).toEqual(2)
      expect(ellipse.boundingBox.width).toEqual(9)
      expect(ellipse.boundingBox.height).toEqual(4)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
    test("should updateFromLine when target y increase", () =>
    {
      OIShapeEllipse.updateFromLine(ellipse, origin, { x: target.x, y: target.y + 4 })
      expect(ellipse.center).toEqual({ x: 2.5, y: 6 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(4)
      expect(ellipse.boundingBox.width).toEqual(3)
      expect(ellipse.boundingBox.height).toEqual(8)
      expect(ellipse.boundingBox.x).toEqual(1)
      expect(ellipse.boundingBox.y).toEqual(2)
    })
  })

  describe("isCloseToPoint", () =>
  {
    const center: TPoint = { x: 5, y: 0 }
    const radiusX = 50
    const radiusY = 100
    const ellipse = new OIShapeEllipse({}, center, radiusX, radiusY)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
    {
      const closePoint: TPoint = { x: center.x, y: center.y + radiusY + SELECTION_MARGIN / 2 }
      expect(ellipse.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: center.x, y: center.y + radiusY + SELECTION_MARGIN * 2 }
      expect(ellipse.isCloseToPoint(closePoint)).toEqual(false)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      expect(ellipse.isCloseToPoint(ellipse.center)).toEqual(false)
    })
  })

  describe("overlaps", () =>
  {
    const center: TPoint = { x: 5, y: 0 }
    const radiusX = 5
    const radiusY = 10
    const ellipse = new OIShapeEllipse({}, center, radiusX, radiusY)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(ellipse.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(ellipse.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(ellipse.overlaps(boundaries)).toEqual(false)
    })
    test(`should return false if box is inside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(ellipse.overlaps(boundaries)).toEqual(false)
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const ellipse = new OIShapeEllipse({}, center, radiusX, radiusY)
      const clone = ellipse.clone()
      expect(clone).toEqual(ellipse)
      expect(clone).not.toBe(ellipse)
    })
  })
})
