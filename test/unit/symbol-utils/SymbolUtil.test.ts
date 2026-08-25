import { SymbolUtil, TBaseSymbol, TPartialDeep } from "@/iink"

class TestSymbolUtil extends SymbolUtil<TBaseSymbol> {
  readonly type = "test"
  create(params: TPartialDeep<TBaseSymbol>): TBaseSymbol {
    return {
      id: params.id ?? "test-id",
      creationTime: params.creationTime ?? 0,
      modificationDate: params.modificationDate ?? 0,
      type: "test",
      style: params.style ?? {},
    }
  }
  updateDerivedFields(): void {
    // no derived fields for this test double
  }
  overlaps(): boolean {
    return false
  }
}

describe("SymbolUtil.ts", () => {
  const util = new TestSymbolUtil()
  const symbol: TBaseSymbol = { id: "1", creationTime: 0, modificationDate: 0, type: "test", style: {} }

  test("should default getSnapPoints to an empty array", () => {
    expect(util.getSnapPoints(symbol)).toEqual([])
  })

  test("should default canSelect to true", () => {
    expect(util.canSelect(symbol)).toBe(true)
  })

  test("should default canTransform to true", () => {
    expect(util.canTransform(symbol)).toBe(true)
  })

  test("should default canResize to true", () => {
    expect(util.canResize(symbol)).toBe(true)
  })

  test("should default canRotate to true", () => {
    expect(util.canRotate(symbol)).toBe(true)
  })

  test("should leave getSVGElement undefined by default", () => {
    expect(util.getSVGElement).toBeUndefined()
  })
})
