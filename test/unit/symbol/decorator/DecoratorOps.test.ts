import { describe, test, expect } from "@jest/globals"
import { DecoratorOps, OBBOps, SymbolType, DecoratorKind, MatrixTransform, DecoratorUtil } from "@/iink"

describe("DecoratorOps", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, { color: "red", width: 2 })
      expect(d.transform).toEqual(MatrixTransform.identity())
    })
    test("should create a decorator with required fields", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, { color: "red", width: 2 })
      expect(d.type).toBe(SymbolType.Decorator)
      expect(d.kind).toBe(DecoratorKind.Underline)
      expect(d.targetIds).toEqual([])
      expect(d.targetBounds).toBeUndefined()
      // Through the util, not `DecoratorOps.computeVertices` directly: a decorator with no
      // `targetBounds` has no vertices, and that emptiness comes from `computeGeometry`'s guard.
      // Calling the raw computation on a zero-size box would return two coincident points instead.
      expect(new DecoratorUtil().computeGeometry(d).vertices).toEqual([])
    })

    test("should merge style with DefaultStyle", () => {
      const d = DecoratorOps.create(DecoratorKind.Highlight, { color: "blue" })
      expect(d.style.color).toBe("blue")
      expect(typeof d.style.width).toBe("number")
    })

    test("should include targetIds when provided", () => {
      const ids = ["id1", "id2"]
      const d = DecoratorOps.create(DecoratorKind.Surround, {}, ids)
      expect(d.targetIds).toEqual(ids)
    })

    test("should set targetBounds when provided", () => {
      const bounds = { x: 10, y: 20, width: 100, height: 30 }
      const d = DecoratorOps.create(DecoratorKind.Strikethrough, {}, [], bounds)
      expect(d.targetBounds).toBeDefined()
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(bounds)
      expect(DecoratorOps.computeVertices(d.targetBounds!)).toHaveLength(2)
    })

    test("should generate a unique id prefixed with kind", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      expect(d.id).toMatch(new RegExp(`^${DecoratorKind.Underline}-`))
    })

    test("should set numeric creationTime and modificationDate", () => {
      const before = Date.now()
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      const after = Date.now()
      expect(d.creationTime).toBeGreaterThanOrEqual(before)
      expect(d.creationTime).toBeLessThanOrEqual(after)
      expect(d.modificationDate).toBeGreaterThanOrEqual(before)
    })

    test("should coerce style.opacity to number", () => {
      const d = DecoratorOps.create(DecoratorKind.Highlight, { opacity: 0.5 })
      expect(typeof d.style.opacity).toBe("number")
      expect(d.style.opacity).toBe(0.5)
    })
  })

  describe("setTargetBounds", () => {
    test("should set targetBounds", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      const bounds = { x: 5, y: 10, width: 80, height: 20 }
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox(bounds))
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(bounds)
    })

    test("should compute vertices at y midpoint", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      const bounds = { x: 0, y: 10, width: 100, height: 20 }
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox(bounds))
      const yMid = 10 + 20 / 2 // = 20
      expect(DecoratorOps.computeVertices(d.targetBounds!)).toEqual([
        { x: 0, y: yMid },
        { x: 100, y: yMid },
      ])
    })

    test("should set edges from first to second vertex", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox({ x: 0, y: 0, width: 50, height: 10 }))
      // Edges are no longer stored; a decorator's single edge joins its two vertices, which is
      // what `DecoratorUtil.computeGeometry` builds and what this used to read off the field.
      const edges = new DecoratorUtil().computeGeometry(d).edges
      expect(edges).toHaveLength(1)
      expect(edges[0].p1).toEqual(DecoratorOps.computeVertices(d.targetBounds!)[0])
      expect(edges[0].p2).toEqual(DecoratorOps.computeVertices(d.targetBounds!)[1])
    })

    test("should overwrite previous targetBounds when called again", () => {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox({ x: 0, y: 0, width: 50, height: 10 }))
      const newBounds = { x: 100, y: 200, width: 300, height: 40 }
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox(newBounds))
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(newBounds)
    })
  })

  describe("overlaps", () => {
    test("should return false when targetBounds is unset", () => {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      expect(d.targetBounds).toBeUndefined()
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 200, height: 200 })).toBe(false)
    })

    test("should return true when targetBounds overlap the query box", () => {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox({ x: 10, y: 10, width: 50, height: 20 }))
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 30, height: 30 })).toBe(true)
    })

    test("should return false when targetBounds do not overlap the query box", () => {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      DecoratorOps.setTargetBounds(d, OBBOps.fromBox({ x: 200, y: 200, width: 50, height: 20 }))
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })
})
