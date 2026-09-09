import { BoxOps, OBBOps, TBox, TextOps, TPoint, TSymbolChar } from "@/iink"

describe("Text.ts", () => {
  const chars: TSymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: "normal",
      id: "id-1",
      label: "first",
      bounds: { height: 10, width: 5, x: 1, y: 2 },
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: "normal",
      id: "id-2",
      label: "second",
      bounds: { height: 10, width: 5, x: 6, y: 2 },
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const box = BoxOps.createFromBoxes(chars.map((c) => c.bounds))
  test("should instanciate", () => {
    const text = TextOps.create(chars, point, box)
    expect(text).toBeDefined()
  })

  describe("properties", () => {
    test("should get label", () => {
      const text = TextOps.create(chars, point, box)
      expect(TextOps.getLabel(text)).toEqual("firstsecond")
    })
    test(`should get vertices without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      expect(text.vertices).toEqual(BoxOps.getCorners(box))
    })
    test(`should get vertices with rotation 90°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 },
      }
      TextOps.updateDerivedFields(text)
      // Expected the mirrored quad until this ticket. Written from what the implementation
      // produced rather than from what the renderer draws, so it locked the sign error in place:
      // for a 90° turn about the origin the two differ by exactly a negation. The values below are
      // `rotate(90, 0, 0)`'s own arithmetic — x' = −y, y' = x.
      expect(text.vertices).toEqual([
        { x: -2, y: 1 },
        { x: -2, y: 11 },
        { x: -12, y: 11 },
        { x: -12, y: 1 },
      ])
    })
    test(`should get edges without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      expect(text.edges).toEqual([
        { p1: { x: 1, y: 2 }, p2: { x: 11, y: 2 } },
        { p1: { x: 11, y: 2 }, p2: { x: 11, y: 12 } },
        { p1: { x: 11, y: 12 }, p2: { x: 1, y: 12 } },
        { p1: { x: 1, y: 12 }, p2: { x: 1, y: 2 } },
      ])
    })
    test(`should get edges with rotation 90°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 },
      }
      TextOps.updateDerivedFields(text)
      // Expected the mirrored quad until this ticket. Written from what the implementation
      // produced rather than from what the renderer draws, so it locked the sign error in place:
      // for a 90° turn about the origin the two differ by exactly a negation. The values below are
      // `rotate(90, 0, 0)`'s own arithmetic — x' = −y, y' = x.
      expect(text.edges).toEqual([
        { p1: { x: -2, y: 1 }, p2: { x: -2, y: 11 } },
        { p1: { x: -2, y: 11 }, p2: { x: -12, y: 11 } },
        { p1: { x: -12, y: 11 }, p2: { x: -12, y: 1 } },
        { p1: { x: -12, y: 1 }, p2: { x: -2, y: 1 } },
      ])
    })
    test(`should get snapPoints without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      expect(text.snapPoints).toEqual([
        { x: 1, y: 14 },
        { x: 11, y: 14 },
        { x: 11, y: 0 },
        { x: 1, y: 0 },
        { x: 6, y: 7 },
      ])
    })
    test(`should get snapPoints with rotation 90°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 },
      }
      TextOps.updateDerivedFields(text)
      // Expected the mirrored quad until this ticket. Written from what the implementation
      // produced rather than from what the renderer draws, so it locked the sign error in place:
      // for a 90° turn about the origin the two differ by exactly a negation. The values below are
      // `rotate(90, 0, 0)`'s own arithmetic — x' = −y, y' = x.
      expect(text.snapPoints).toEqual([
        { x: -14, y: 1 },
        { x: -14, y: 11 },
        // Negative zero, which `toEqual` distinguishes from zero: the rounding in
        // `computeRotatedPoint` yields `+(-0).toFixed(3)`. The old expectation carried it too, on
        // the other side of the sign.
        { x: -0, y: 11 },
        { x: -0, y: 1 },
        { x: -7, y: 6 },
      ])
    })
  })

  describe("overlaps", () => {
    const text = TextOps.create(chars, point, box)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(TextOps.overlaps(text, boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(TextOps.overlaps(text, boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: -50, y: -50 }
      expect(TextOps.overlaps(text, boundaries)).toEqual(false)
    })
  })

  describe("getChildrenOverlaps", () => {
    test(`should return only first char without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual([chars[0]])
    })
    test(`should return all char without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual(chars)
    })
    test(`should return false if box is outside without rotation`, () => {
      const text = TextOps.create(chars, point, box)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual([])
    })
    test(`should return only second char with rotation 180°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 180,
      }
      TextOps.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual([chars[1]])
    })
    test(`should return all char with rotation 180°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 90,
      }
      TextOps.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual(chars)
    })
    test(`should return false if box is outside with rotation 180°`, () => {
      const text = TextOps.create(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 90,
      }
      TextOps.updateDerivedFields(text)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(TextOps.getChildrenOverlaps(text, points)).toEqual([])
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const text = TextOps.create(chars, point, box)
      const clone = structuredClone(text)
      expect(clone).toEqual(text)
      expect(clone).not.toBe(text)
    })
  })
})

/**
 * The rotation used to be applied twice: `bounds.angle` was set alongside `rotation.degree`, so
 * `OBBOps.toBox` handed `updateDerivedFields` the axis-aligned **envelope** of the already-rotated
 * box, whose corners were then rotated again.
 *
 * A square box turned by 90° hides it — the envelope equals the box — which is why the existing
 * rotation tests never caught it. This one uses an oblong box and an oblique angle, where the
 * envelope is visibly larger.
 */
describe("Text derived fields, with the angle recorded on the bounds", () => {
  const chars: TSymbolChar[] = [
    { id: "c1", label: "a", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 0, y: 0, width: 40, height: 10 } },
  ]

  test("should rotate the glyph box, not an envelope grown for the angle", () => {
    const text = TextOps.create(chars, { x: 0, y: 0 }, { x: 0, y: 0, width: 40, height: 10 })
    text.rotation = { degree: 30, center: { x: 0, y: 0 } }
    text.bounds.angle = 30
    TextOps.updateDerivedFields(text)

    // A 40×10 box stays 40×10 through any rotation — only its orientation changes. Grown to its 30°
    // envelope first (39.64 × 28.66) the quad would come out with those sides instead.
    // Corners run top-left, top-right, bottom-right, bottom-left.
    const side = (a: TPoint, b: TPoint) => Math.hypot(b.x - a.x, b.y - a.y)
    const [topLeft, topRight, , bottomLeft] = text.vertices
    expect(side(topLeft, topRight)).toBeCloseTo(40, 1)
    expect(side(topLeft, bottomLeft)).toBeCloseTo(10, 1)
  })

  test("should keep the recorded angle, which callers read as the on-screen extent", () => {
    // `bounds.angle` is deliberately still written: `OBBOps.toBox` uses it to report the area the
    // symbol covers, which the erase hit box, decorator bounds and annotation extents depend on.
    const text = TextOps.create(chars, { x: 0, y: 0 }, { x: 0, y: 0, width: 40, height: 10 })
    text.bounds.angle = 30
    // The envelope of a rotated box is not simply bigger: a long thin box projects *narrower* as it
    // turns (39.64 here) while growing taller (28.66). Height is the side that shows the growth.
    const envelope = OBBOps.toBox(text.bounds)
    expect(envelope.height).toBeGreaterThan(10)
    expect(OBBOps.toUnrotatedBox(text.bounds)).toEqual({ x: 0, y: 0, width: 40, height: 10 })
  })
})
