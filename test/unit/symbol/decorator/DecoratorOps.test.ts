import { describe, test, expect } from "@jest/globals"
import { DecoratorKind } from "../../../../src/iink"
import { DecoratorOps } from "../../../../src/symbol/decorator/Decorator"
import { SymbolType } from "../../../../src/symbol/Symbol"

describe("DecoratorOps", () =>
{
  describe("create", () =>
  {
    test("should create a decorator with required fields", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, { color: "red", width: 2 })
      expect(d.type).toBe(SymbolType.Decorator)
      expect(d.kind).toBe(DecoratorKind.Underline)
      expect(d.isClosed).toBe(false)
      expect(d.selected).toBe(false)
      expect(d.deleting).toBe(false)
      expect(d.targetIds).toEqual([])
      expect(d.hasBounds).toBe(false)
      expect(d.vertices).toEqual([])
      expect(d.snapPoints).toEqual([])
      expect(d.edges).toEqual([])
    })

    test("should merge style with DefaultStyle", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Highlight, { color: "blue" })
      expect(d.style.color).toBe("blue")
      expect(typeof d.style.width).toBe("number")
    })

    test("should include targetIds when provided", () =>
    {
      const ids = ["id1", "id2"]
      const d = DecoratorOps.create(DecoratorKind.Surround, {}, ids)
      expect(d.targetIds).toEqual(ids)
    })

    test("should call setBounds when bounds provided", () =>
    {
      const bounds = { x: 10, y: 20, width: 100, height: 30 }
      const d = DecoratorOps.create(DecoratorKind.Strikethrough, {}, [], bounds)
      expect(d.hasBounds).toBe(true)
      expect(d.bounds).toEqual(bounds)
      expect(d.vertices).toHaveLength(2)
    })

    test("should generate a unique id prefixed with kind", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      expect(d.id).toMatch(new RegExp(`^${DecoratorKind.Underline}-`))
    })

    test("should set numeric creationTime and modificationDate", () =>
    {
      const before = Date.now()
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      const after = Date.now()
      expect(d.creationTime).toBeGreaterThanOrEqual(before)
      expect(d.creationTime).toBeLessThanOrEqual(after)
      expect(d.modificationDate).toBeGreaterThanOrEqual(before)
    })

    test("should coerce style.opacity to number", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Highlight, { opacity: 0.5 })
      expect(typeof d.style.opacity).toBe("number")
      expect(d.style.opacity).toBe(0.5)
    })
  })

  describe("setBounds", () =>
  {
    test("should set bounds and hasBounds", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      const bounds = { x: 5, y: 10, width: 80, height: 20 }
      DecoratorOps.setBounds(d, bounds)
      expect(d.bounds).toEqual(bounds)
      expect(d.hasBounds).toBe(true)
    })

    test("should compute vertices at y midpoint", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      const bounds = { x: 0, y: 10, width: 100, height: 20 }
      DecoratorOps.setBounds(d, bounds)
      const yMid = 10 + 20 / 2 // = 20
      expect(d.vertices).toEqual([
        { x: 0, y: yMid },
        { x: 100, y: yMid },
      ])
    })

    test("should set snapPoints equal to vertices", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      DecoratorOps.setBounds(d, { x: 0, y: 0, width: 50, height: 10 })
      expect(d.snapPoints).toEqual(d.vertices)
    })

    test("should set edges from first to second vertex", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      DecoratorOps.setBounds(d, { x: 0, y: 0, width: 50, height: 10 })
      expect(d.edges).toHaveLength(1)
      expect(d.edges[0].p1).toEqual(d.vertices[0])
      expect(d.edges[0].p2).toEqual(d.vertices[1])
    })

    test("should overwrite previous bounds when called again", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Underline, {})
      DecoratorOps.setBounds(d, { x: 0, y: 0, width: 50, height: 10 })
      const newBounds = { x: 100, y: 200, width: 300, height: 40 }
      DecoratorOps.setBounds(d, newBounds)
      expect(d.bounds).toEqual(newBounds)
    })
  })

  describe("overlaps", () =>
  {
    test("should return false when hasBounds is false", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      expect(d.hasBounds).toBe(false)
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 200, height: 200 })).toBe(false)
    })

    test("should return true when bounds overlap the query box", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      DecoratorOps.setBounds(d, { x: 10, y: 10, width: 50, height: 20 })
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 30, height: 30 })).toBe(true)
    })

    test("should return false when bounds do not overlap the query box", () =>
    {
      const d = DecoratorOps.create(DecoratorKind.Highlight, {})
      DecoratorOps.setBounds(d, { x: 200, y: 200, width: 50, height: 20 })
      expect(DecoratorOps.overlaps(d, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })
})
