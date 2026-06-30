import { describe, test, expect } from "@jest/globals"
import { symbolRegistry, registerBuiltinSymbolUtils, StrokeUtil, TextUtil, SymbolType } from "@/iink"

// SymbolRegistryClass is only exported as a type (not a value), so we test via the singleton.
// Each test registers into the singleton — the registry is additive across all tests.

describe("symbolRegistry", () => {
  describe("register", () => {
    test("should return the registry instance for chaining", () => {
      const result = symbolRegistry.register(new StrokeUtil())
      expect(result).toBe(symbolRegistry)
    })

    test("should allow chaining multiple registers", () => {
      expect(() => symbolRegistry.register(new StrokeUtil()).register(new TextUtil())).not.toThrow()
    })
  })

  describe("getUtil", () => {
    test("should return undefined for an unknown type", () => {
      expect(symbolRegistry.getUtil("__no_such_type__")).toBeUndefined()
    })

    test("should return the registered util by type", () => {
      const util = new StrokeUtil()
      symbolRegistry.register(util)
      const retrieved = symbolRegistry.getUtil(SymbolType.Stroke)
      expect(retrieved).toBeDefined()
      expect(retrieved?.type).toBe(SymbolType.Stroke)
    })
  })

  describe("has", () => {
    test("should return false for an unknown type", () => {
      expect(symbolRegistry.has("__no_such_type__")).toBe(false)
    })

    test("should return true after registering a util", () => {
      symbolRegistry.register(new StrokeUtil())
      expect(symbolRegistry.has(SymbolType.Stroke)).toBe(true)
    })
  })
})

describe("registerBuiltinSymbolUtils", () => {
  test("should register all 6 built-in utils into symbolRegistry", () => {
    registerBuiltinSymbolUtils()
    expect(symbolRegistry.has(SymbolType.Stroke)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Text)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Math)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Shape)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Edge)).toBe(true)
    expect(symbolRegistry.has(SymbolType.Decorator)).toBe(true)
  })

  test("getUtil returns a util with matching type after registration", () => {
    registerBuiltinSymbolUtils()
    const strokeUtil = symbolRegistry.getUtil(SymbolType.Stroke)
    expect(strokeUtil?.type).toBe(SymbolType.Stroke)
    const mathUtil = symbolRegistry.getUtil(SymbolType.Math)
    expect(mathUtil?.type).toBe(SymbolType.Math)
  })
})
