import { describe, test, expect } from "@jest/globals"
import { OBBOps, TBox, TOBB, TPoint, TSegment } from "@/iink"

describe("OBBOps", () => {
  describe("polygonOverlapsBox", () => {
    const box: TBox = { x: 0, y: 0, width: 10, height: 10 }

    test("should return true when the bounds are fully contained in the box", () => {
      const bounds: TOBB = { center: { x: 5, y: 5 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.polygonOverlapsBox(bounds, [], box)).toBe(true)
    })

    test("should return true when an edge crosses a side of the box, even if bounds aren't contained", () => {
      const bounds: TOBB = { center: { x: 20, y: 5 }, width: 30, height: 2, angle: 0 }
      const edges: TSegment[] = [{ p1: { x: -5, y: 5 }, p2: { x: 25, y: 5 } }]
      expect(OBBOps.polygonOverlapsBox(bounds, edges, box)).toBe(true)
    })

    test("should return false when neither the bounds nor any edge intersects the box", () => {
      const bounds: TOBB = { center: { x: 100, y: 100 }, width: 2, height: 2, angle: 0 }
      const edges: TSegment[] = [{ p1: { x: 95, y: 100 }, p2: { x: 105, y: 100 } }]
      expect(OBBOps.polygonOverlapsBox(bounds, edges, box)).toBe(false)
    })
  })

  describe("create", () => {
    test("should default angle to 0", () => {
      expect(OBBOps.create({ x: 1, y: 2 }, 10, 20)).toEqual({ center: { x: 1, y: 2 }, width: 10, height: 20, angle: 0 })
    })

    test("should keep the given angle and clone the center point", () => {
      const center = { x: 1, y: 2 }
      const obb = OBBOps.create(center, 10, 20, Math.PI / 4)
      expect(obb).toEqual({ center: { x: 1, y: 2 }, width: 10, height: 20, angle: Math.PI / 4 })
      expect(obb.center).not.toBe(center)
    })
  })

  describe("fromBox", () => {
    test("should center the OBB on the box and keep angle 0", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 4 }
      expect(OBBOps.fromBox(box)).toEqual({ center: { x: 5, y: 2 }, width: 10, height: 4, angle: 0 })
    })
  })

  describe("toBox", () => {
    test("should return the axis-aligned bounding box unchanged when angle is 0", () => {
      const obb: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.toBox(obb)).toEqual({ x: 0, y: 3, width: 10, height: 4 })
    })

    test("should return the corners' bounding box when rotated", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: Math.PI / 4 }
      const box = OBBOps.toBox(obb)
      const diagonal = Math.sqrt(2)
      expect(box.x).toBeCloseTo(-diagonal)
      expect(box.y).toBeCloseTo(-diagonal)
      expect(box.width).toBeCloseTo(2 * diagonal)
      expect(box.height).toBeCloseTo(2 * diagonal)
    })
  })

  describe("createFromPoints", () => {
    test("should build the axis-aligned OBB of the bounding box of the points", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 4 },
      ]
      expect(OBBOps.createFromPoints(points)).toEqual({ center: { x: 5, y: 2 }, width: 10, height: 4, angle: 0 })
    })
  })

  describe("createFromOBBs", () => {
    test("should return a zero-sized OBB at the origin when given an empty array", () => {
      expect(OBBOps.createFromOBBs([])).toEqual({ center: { x: 0, y: 0 }, width: 0, height: 0, angle: 0 })
    })

    test("should return the bounding OBB of the given OBBs' boxes", () => {
      const a: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const b: TOBB = { center: { x: 25, y: 5 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.createFromOBBs([a, b])).toEqual({ center: { x: 15, y: 5 }, width: 30, height: 10, angle: 0 })
    })
  })

  describe("getCorners", () => {
    test("should return the 4 axis-aligned corners in clockwise order starting top-left", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.getCorners(obb)).toEqual([
        { x: -5, y: -2 },
        { x: 5, y: -2 },
        { x: 5, y: 2 },
        { x: -5, y: 2 },
      ])
    })

    test("should rotate the corners around the center for a non-zero angle", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: Math.PI / 2 }
      const corners = OBBOps.getCorners(obb)
      expect(corners[0].x).toBeCloseTo(1)
      expect(corners[0].y).toBeCloseTo(-1)
      expect(corners[1].x).toBeCloseTo(1)
      expect(corners[1].y).toBeCloseTo(1)
    })
  })

  describe("getSides", () => {
    test("should return 4 segments connecting consecutive corners, wrapping around", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      const corners = OBBOps.getCorners(obb)
      const sides = OBBOps.getSides(obb)
      expect(sides).toHaveLength(4)
      expect(sides[3]).toEqual({ p1: corners[3], p2: corners[0] })
    })
  })

  describe("getSnapPoints", () => {
    test("should return the 4 corners, 4 side midpoints and the center", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      const snapPoints = OBBOps.getSnapPoints(obb)
      expect(snapPoints).toHaveLength(9)
      expect(snapPoints).toEqual(
        expect.arrayContaining([
          { x: 0, y: -2 },
          { x: 5, y: 0 },
          { x: 0, y: 2 },
          { x: -5, y: 0 },
          { x: 0, y: 0 },
        ])
      )
    })
  })

  describe("containsPoint", () => {
    test("should return true/false for a point inside/outside an axis-aligned OBB", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.containsPoint(obb, { x: 1, y: 1 })).toBe(true)
      expect(OBBOps.containsPoint(obb, { x: 100, y: 1 })).toBe(false)
    })

    test("should account for rotation", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 2, angle: Math.PI / 2 }
      expect(OBBOps.containsPoint(obb, { x: 0, y: 4 })).toBe(true)
      expect(OBBOps.containsPoint(obb, { x: 4, y: 0 })).toBe(false)
    })
  })

  describe("overlaps", () => {
    test("should use the fast axis-aligned box path when both angles are 0", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: 0 }
      const b: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const c: TOBB = { center: { x: 100, y: 100 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.overlaps(a, b)).toBe(true)
      expect(OBBOps.overlaps(a, c)).toBe(false)
    })

    test("should use SAT when either OBB is rotated", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: Math.PI / 4 }
      const b: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const c: TOBB = { center: { x: 100, y: 100 }, width: 10, height: 10, angle: Math.PI / 4 }
      expect(OBBOps.overlaps(a, b)).toBe(true)
      expect(OBBOps.overlaps(a, c)).toBe(false)
    })
  })

  describe("overlapsBox", () => {
    test("should delegate to overlaps() against the box converted to an OBB", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.overlapsBox(obb, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
      expect(OBBOps.overlapsBox(obb, { x: 100, y: 100, width: 10, height: 10 })).toBe(false)
    })
  })

  describe("isContained", () => {
    test("should check the axis-aligned box when angle is 0", () => {
      const obb: TOBB = { center: { x: 5, y: 5 }, width: 2, height: 2, angle: 0 }
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      expect(OBBOps.isContained(obb, box)).toBe(true)
      expect(OBBOps.isContained({ ...obb, center: { x: 100, y: 100 } }, box)).toBe(false)
    })

    test("should check every rotated corner is inside the box when angle is non-zero", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      const insideRotated: TOBB = { center: { x: 5, y: 5 }, width: 4, height: 4, angle: Math.PI / 4 }
      const outsideRotated: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: Math.PI / 4 }
      expect(OBBOps.isContained(insideRotated, box)).toBe(true)
      expect(OBBOps.isContained(outsideRotated, box)).toBe(false)
    })
  })

  describe("contains", () => {
    test("should return true when every corner of b is inside a", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 20, height: 20, angle: 0 }
      const b: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.contains(a, b)).toBe(true)
    })

    test("should return false when a corner of b is outside a", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 20, height: 20, angle: 0 }
      const b: TOBB = { center: { x: 15, y: 0 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.contains(a, b)).toBe(false)
    })
  })
})
