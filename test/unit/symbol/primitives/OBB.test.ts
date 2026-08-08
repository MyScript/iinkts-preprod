import { describe, test, expect } from "@jest/globals"
import { OBBOps, TBox, TOBB, TSegment } from "@/iink"

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
})
