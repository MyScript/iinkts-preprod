import { TBox, TSymbolChar, TPoint } from "../../../../src/iink"
import { BoxHelper } from "../../../../src/iink"
import { TextHelper } from "../../../../src/symbol/text/Text"

describe("Text.ts", () =>
{
  const chars: TSymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: "normal",
      id: 'id-1',
      label: "first",
      bounds: { height: 10, width: 5, x: 1, y: 2 }
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: "normal",
      id: 'id-2',
      label: "second",
      bounds: { height: 10, width: 5, x: 6, y: 2 }
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const box = BoxHelper.createFromBoxes(chars.map(c => c.bounds))
  test("should instanciate", () =>
  {
    const text = TextHelper.create(chars, point, box)
    expect(text).toBeDefined()
  })

  describe("properties", () =>
  {
    test("should get label", () =>
    {
      const text = TextHelper.create(chars, point, box)
      expect(TextHelper.getLabel(text)).toEqual("firstsecond")
    })
    test(`should get vertices without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      expect(text.vertices).toEqual(BoxHelper.getCorners(box))
    })
    test(`should get vertices with rotation 90°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      TextHelper.updateDerivedFields(text)
      expect(text.vertices).toEqual([
        { x: 2, y: -1 },
        { x: 2, y: -11 },
        { x: 12, y: -11 },
        { x: 12, y: -1 },
      ])
    })
    test(`should get edges without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      expect(text.edges).toEqual([
        { "p1": { "x": 1, "y": 2 }, "p2": { "x": 11, "y": 2 } },
        { "p1": { "x": 11, "y": 2 }, "p2": { "x": 11, "y": 12 } },
        { "p1": { "x": 11, "y": 12 }, "p2": { "x": 1, "y": 12 } },
        { "p1": { "x": 1, "y": 12 }, "p2": { "x": 1, "y": 2 } }
      ])
    })
    test(`should get edges with rotation 90°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      TextHelper.updateDerivedFields(text)
      expect(text.edges).toEqual([
        { "p1": { "x": 2, "y": -1 }, "p2": { "x": 2, "y": -11 } },
        { "p1": { "x": 2, "y": -11 }, "p2": { "x": 12, "y": -11 } },
        { "p1": { "x": 12, "y": -11 }, "p2": { "x": 12, "y": -1 } },
        { "p1": { "x": 12, "y": -1 }, "p2": { "x": 2, "y": -1 } }
      ])
    })
    test(`should get snapPoints without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      expect(text.snapPoints).toEqual([
        { "x": 1, "y": 14 },
        { "x": 11, "y": 14 },
        { "x": 11, "y": 0 },
        { "x": 1, "y": 0 },
        { "x": 6, "y": 7 }
    ])
    })
    test(`should get snapPoints with rotation 90°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      TextHelper.updateDerivedFields(text)
      expect(text.snapPoints).toEqual([
        { "x": 14, "y": -1 },
        { "x": 14, "y": -11 },
        { "x": -0, "y": -11 },
        { "x": -0, "y": -1 },
        { "x": 7, "y": -6 }
      ])
    })
  })

  describe("overlaps", () =>
  {
    const text = TextHelper.create(chars, point, box)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(TextHelper.overlaps(text, boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(TextHelper.overlaps(text, boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBox = { height: 2, width: 2, x: -50, y: -50 }
      expect(TextHelper.overlaps(text, boundaries)).toEqual(false)
    })
  })

  describe("getChildrenOverlaps", () =>
  {
    test(`should return only first char without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual([chars[0]])
    })
    test(`should return all char without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual(chars)
    })
    test(`should return false if box is outside without rotation`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual([])
    })
    test(`should return only second char with rotation 180°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        center: BoxHelper.getCenter(text.bounds),
        degree: 180
      }
      TextHelper.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual([chars[1]])
    })
    test(`should return all char with rotation 180°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        center: BoxHelper.getCenter(text.bounds),
        degree: 90
      }
      TextHelper.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual(chars)
    })
    test(`should return false if box is outside with rotation 180°`, () =>
    {
      const text = TextHelper.create(chars, point, box)
      text.rotation = {
        center: BoxHelper.getCenter(text.bounds),
        degree: 90
      }
      TextHelper.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(TextHelper.getChildrenOverlaps(text, points)).toEqual([])
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const text = TextHelper.create(chars, point, box)
      const clone = structuredClone(text)
      expect(clone).toEqual(text)
      expect(clone).not.toBe(text)
    })
  })
})
