import { MatrixTransform, OBBOps, SymbolUtil, TBaseSymbol, TPartialDeep, TSymbolGeometry } from "@/iink"

class TestSymbolUtil extends SymbolUtil<TBaseSymbol> {
  readonly type = "test"
  create(params: TPartialDeep<TBaseSymbol>): TBaseSymbol {
    return {
      id: params.id ?? "test-id",
      creationTime: params.creationTime ?? 0,
      modificationDate: params.modificationDate ?? 0,
      type: "test",
      style: params.style ?? {},
      transform: { ...MatrixTransform.identity(), ...params.transform },
    }
  }
  updateDerivedFields(): void {
    // no derived fields for this test double
  }
  computeGeometry(): TSymbolGeometry {
    return { bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0), vertices: [], snapPoints: [], edges: [], length: 0 }
  }
  overlaps(): boolean {
    return false
  }
  translate(): void {
    // this double exists to exercise the contract's defaults, not to move anything
  }

  rotate(): void {
    // likewise
  }

  resize(): void {
    // likewise
  }
  getSVGElement(symbol: TBaseSymbol): SVGGraphicsElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.setAttribute("id", symbol.id)
    return group
  }
}

describe("SymbolUtil.ts", () => {
  const util = new TestSymbolUtil()
  const symbol: TBaseSymbol = {
    id: "1",
    creationTime: 0,
    modificationDate: 0,
    type: "test",
    style: {},
    transform: MatrixTransform.identity(),
  }

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

  test("should require getSVGElement rather than defaulting it", () => {
    // It was optional until IIC-2006, which let a util register successfully and then draw nothing.
    // There is no default to assert any more; what matters is that the member is there and used.
    expect(util.getSVGElement(symbol).getAttribute("id")).toBe("1")
  })
})
