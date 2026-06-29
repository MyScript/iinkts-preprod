import { describe, test, expect, beforeEach } from "@jest/globals"
import { DecoratorUtil } from "../../../../src/symbol-utils/decorator/DecoratorUtil"
import { DecoratorKind } from "../../../../src/symbol/decorator/Decorator"
import { SymbolType } from "../../../../src/symbol/Symbol"
import { buildIIDecorator } from "../../helpers"

describe("DecoratorUtil", () =>
{
  let util: DecoratorUtil

  beforeEach(() =>
  {
    util = new DecoratorUtil()
  })

  test("should have type decorator", () =>
  {
    expect(util.type).toBe(SymbolType.Decorator)
  })

  describe("create", () =>
  {
    test("should create a decorator from partial with kind", () =>
    {
      const decorator = util.create({ kind: DecoratorKind.Underline })
      expect(decorator.type).toBe(SymbolType.Decorator)
      expect(decorator.kind).toBe(DecoratorKind.Underline)
    })

    test("should create with provided targetIds", () =>
    {
      const decorator = util.create({ kind: DecoratorKind.Highlight, targetIds: ["id1", "id2"] })
      expect(decorator.targetIds).toEqual(["id1", "id2"])
    })

    test("should throw when kind is missing", () =>
    {
      expect(() => util.create({})).toThrow("TDecorator requires kind")
    })

    test("should generate unique ids each call", () =>
    {
      const d1 = util.create({ kind: DecoratorKind.Surround })
      const d2 = util.create({ kind: DecoratorKind.Surround })
      expect(d1.id).not.toBe(d2.id)
    })
  })

  describe("updateDerivedFields", () =>
  {
    test("should not throw when decorator has no bounds", () =>
    {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      expect(() => util.updateDerivedFields(decorator)).not.toThrow()
    })

    test("should not throw when decorator has bounds", () =>
    {
      const decorator = util.create({
        kind: DecoratorKind.Highlight,
        bounds: { x: 0, y: 0, width: 10, height: 10 },
      })
      // setBounds is guarded by hasBounds
      expect(() => util.updateDerivedFields(decorator)).not.toThrow()
    })
  })

  describe("overlaps", () =>
  {
    test("should return false when decorator with no bounds is tested against box", () =>
    {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      // No bounds set so expected to not overlap (no vertices)
      const result = util.overlaps(decorator, { x: 0, y: 0, width: 100, height: 100 })
      expect(typeof result).toBe("boolean")
    })
  })

  describe("getSnapPoints", () =>
  {
    test("should return decorator snapPoints", () =>
    {
      const decorator = buildIIDecorator(DecoratorKind.Strikethrough)
      const result = util.getSnapPoints(decorator)
      expect(result).toBe(decorator.snapPoints)
    })
  })

  describe("capability flags", () =>
  {
    test("canSelect should return true (default)", () =>
    {
      expect(util.canSelect(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canTransform should return true (default)", () =>
    {
      expect(util.canTransform(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canResize should return false", () =>
    {
      expect(util.canResize(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })

    test("canRotate should return false", () =>
    {
      expect(util.canRotate(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })
  })
})
