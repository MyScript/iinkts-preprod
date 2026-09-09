import {
  BoxOps,
  computeChildrenOverlaps,
  computeTypesetSnapPoints,
  computeTypesetVertices,
  TBox,
  TPoint,
  TTypesetChild,
  typesetOverlapsBox,
} from "@/iink"

describe("Typeset.ts", () => {
  describe("typesetOverlapsBox", () => {
    const box: TBox = { x: 0, y: 0, width: 10, height: 10 }

    test("should return true when a vertex is inside the box", () => {
      expect(typesetOverlapsBox([{ x: 5, y: 5 }], [], box)).toBe(true)
    })

    test("should return true when an edge crosses a side of the box", () => {
      const edges = [{ p1: { x: -5, y: 5 }, p2: { x: 15, y: 5 } }]
      expect(typesetOverlapsBox([], edges, box)).toBe(true)
    })

    test("should return false when no vertex is inside and no edge crosses the box", () => {
      const edges = [{ p1: { x: 100, y: 100 }, p2: { x: 110, y: 110 } }]
      expect(typesetOverlapsBox([{ x: 100, y: 100 }], edges, box)).toBe(false)
    })
  })

  describe("computeChildrenOverlaps", () => {
    function buildChild(id: string, bounds: TBox): TTypesetChild {
      return { id, label: id, color: "#000000", bounds, fontSize: 10, fontWeight: "normal" }
    }

    test("should return children whose bounds contain a given point", () => {
      const inside = buildChild("inside", { x: 0, y: 0, width: 10, height: 10 })
      const outside = buildChild("outside", { x: 100, y: 100, width: 10, height: 10 })
      const result = computeChildrenOverlaps([inside, outside], [{ x: 5, y: 5 }])
      expect(result).toEqual([inside])
    })

    test("should return an empty array when no point falls inside any child", () => {
      const child = buildChild("child", { x: 0, y: 0, width: 10, height: 10 })
      expect(computeChildrenOverlaps([child], [{ x: 100, y: 100 }])).toEqual([])
    })

    test("should account for rotation when testing containment", () => {
      const child = buildChild("child", { x: -5, y: -5, width: 10, height: 10 })
      const rotation = { degree: 45, center: { x: 0, y: 0 } }
      // (7,0) is outside the unrotated box but inside it once rotated -45deg back to axis-aligned.
      const result = computeChildrenOverlaps([child], [{ x: 7, y: 0 }], rotation)
      expect(result).toEqual([child])
    })
  })
})

/**
 * A typeset symbol is turned by the renderer, which writes `rotate(degree, center)` on its group.
 * The model has to describe the same quad, or nothing that reads `vertices` — surround selection,
 * hit-testing, snapping — agrees with what is on screen.
 *
 * These compare the two directly: the expected corners are the SVG transform's own arithmetic,
 * `x' = cx + cos·dx − sin·dy`, `y' = cy + sin·dx + cos·dy`, which is what a browser applies. The
 * helpers are pure, so this is provable without a layout engine — and that matters, because the rest
 * of the typeset measurement path needs `getBBox` and cannot be tested at all under jsdom.
 */
describe("Typeset rotation, against the transform the renderer writes", () => {
  const box: TBox = { x: 10, y: 20, width: 40, height: 10 }
  const center: TPoint = { x: 0, y: 0 }

  /** What `rotate(degree, center)` does to a point, per the SVG spec. */
  const asRendered = (point: TPoint, degree: number): TPoint => {
    const radian = (degree * Math.PI) / 180
    const dx = point.x - center.x
    const dy = point.y - center.y
    return {
      x: +(center.x + Math.cos(radian) * dx - Math.sin(radian) * dy).toFixed(3),
      y: +(center.y + Math.sin(radian) * dx + Math.cos(radian) * dy).toFixed(3),
    }
  }

  test.each([10, 45, 90, 180, -30])("should place the corners where the renderer draws them at %s°", (degree) => {
    const vertices = computeTypesetVertices(box, { degree, center })
    const expected = BoxOps.getCorners(box).map((corner) => asRendered(corner, degree))
    // Compared to a hundredth of a pixel, not exactly: `convertDegreeToRadian` rounds the radian to
    // four decimals and `computeRotatedPoint` rounds coordinates to three, so the chain can land on
    // either side of a half-thousandth. That tolerance still catches what matters — an inverted
    // sign moves a corner by tens of pixels, and a doubly-applied rotation by the envelope's growth.
    vertices.forEach((vertex, i) => {
      expect(vertex.x).toBeCloseTo(expected[i].x, 2)
      expect(vertex.y).toBeCloseTo(expected[i].y, 2)
    })
  })

  test("should turn the snap points the same way", () => {
    // Same negation lived here, so a rotated typeset symbol snapped to mirrored points.
    const point: TPoint = { x: 10, y: 28 }
    const rotated = computeTypesetSnapPoints(box, point, { degree: 90, center })
    const expected = computeTypesetSnapPoints(box, point).map((p) => asRendered(p, 90))
    rotated.forEach((p, i) => {
      expect(p.x).toBeCloseTo(expected[i].x, 2)
      expect(p.y).toBeCloseTo(expected[i].y, 2)
    })
  })

  test("should leave an unrotated symbol alone", () => {
    expect(computeTypesetVertices(box)).toEqual(BoxOps.getCorners(box))
  })

  test("should not mirror a small rotation, which is how this went unnoticed", () => {
    // At 10° only the y is mirrored by the old sign, so the wrong quad still overlapped the symbol
    // enough for surround selection to catch it. The failure grew with the angle.
    const [firstCorner] = computeTypesetVertices(box, { degree: 10, center })
    expect(firstCorner.y).toBeGreaterThan(0)
  })
})
