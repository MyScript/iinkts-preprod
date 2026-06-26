import { TMathElement, TPoint } from "../../../src/iink"
import { BoxHelper } from "../../../src/iink"
import { IIMathHelper } from "../../../src/symbol/helpers/IIMathHelper"

describe("IIMath.ts", () =>
{
  const elements: TMathElement[] = [
    {
      id: "elem-1",
      label: "x",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 10, y: 10, width: 10, height: 16 }
    },
    {
      id: "elem-2",
      label: "+",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 25, y: 10, width: 8, height: 16 }
    },
    {
      id: "elem-3",
      label: "1",
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: { x: 38, y: 10, width: 8, height: 16 }
    }
  ]
  const point: TPoint = { x: 10, y: 20 }
  const box = BoxHelper.createFromBoxes(elements.map(e => e.bounds))

  test("should instantiate", () =>
  {
    const math = IIMathHelper.create(elements, point, box)
    expect(math).toBeDefined()
  })

  describe("properties", () =>
  {
    test("should get label", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      expect(IIMathHelper.getLabel(math)).toEqual("x+1")
    })

    test("should get vertices without rotation", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      expect(math.vertices).toEqual(BoxHelper.getCorners(box))
    })

    test("should get vertices with rotation 90°", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      math.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      IIMathHelper.updateDerivedFields(math)
      const vertices = math.vertices
      expect(vertices.length).toBe(4)
      expect(vertices[0].x).toBeCloseTo(10, 1)
      expect(vertices[0].y).toBeCloseTo(-10, 1)
    })

    test("should get snapPoints without rotation", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const snapPoints = math.snapPoints
      expect(snapPoints.length).toBe(5)
      expect(snapPoints[4]).toEqual(BoxHelper.getCenter(box))
    })

    test("should get snapPoints with rotation 90°", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      math.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      IIMathHelper.updateDerivedFields(math)
      const snapPoints = math.snapPoints
      expect(snapPoints.length).toBe(5)
    })
  })

  describe("methods", () =>
  {
    test("should update children style", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, box)
      math.style.color = "#FF0000"
      IIMathHelper.updateChildrenStyle(math)

      expect(math.elements[0].color).toBe("#FF0000")
      expect(math.elements[1].color).toBe("#FF0000")
      expect(math.elements[2].color).toBe("#FF0000")
    })

    test("should update children font", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, box)
      IIMathHelper.updateChildrenFont(math, { fontSize: 20, fontWeight: "bold", fontFamily: "Times" })

      expect(math.elements[0].fontSize).toBe(20)
      expect(math.elements[0].fontWeight).toBe("bold")
      expect(math.elements[0].fontFamily).toBe("Times")
    })

    test("should update children font partially", () =>
    {
      const math = IIMathHelper.create(structuredClone(elements), point, box)
      IIMathHelper.updateChildrenFont(math, { fontSize: 18 })

      expect(math.elements[0].fontSize).toBe(18)
      expect(math.elements[0].fontWeight).toBe("normal")
      expect(math.elements[0].fontFamily).toBe("Arial")
    })

    test("should find elements that overlap with points", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const overlappingElements = IIMathHelper.getChildrenOverlaps(math, [{ x: 12, y: 12 }])

      expect(overlappingElements.length).toBe(1)
      expect(overlappingElements[0].id).toBe("elem-1")
    })

    test("should find no elements when point is outside", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const overlappingElements = IIMathHelper.getChildrenOverlaps(math, [{ x: 100, y: 100 }])

      expect(overlappingElements.length).toBe(0)
    })

    test("should check overlap with box", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const overlappingBox = { x: 5, y: 5, width: 10, height: 10 }

      expect(IIMathHelper.overlaps(math, overlappingBox)).toBe(true)
    })

    test("should check no overlap with distant box", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const distantBox = { x: 100, y: 100, width: 10, height: 10 }

      expect(IIMathHelper.overlaps(math, distantBox)).toBe(false)
    })
  })

  describe("clone", () =>
  {
    test("should clone math symbol", () =>
    {
      const math = IIMathHelper.create(elements, point, box)
      const clone = structuredClone(math)

      expect(clone.id).toBe(math.id)
      expect(IIMathHelper.getLabel(clone)).toBe(IIMathHelper.getLabel(math))
      expect(clone.elements.length).toBe(math.elements.length)
      expect(clone.point).toEqual(math.point)
    })
  })
})
