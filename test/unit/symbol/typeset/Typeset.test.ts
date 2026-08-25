import { typesetOverlapsBox, computeChildrenOverlaps, TBox, TTypesetChild } from "@/iink"

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
