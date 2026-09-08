import {
  BoxOps,
  MatrixTransform,
  OBBOps,
  SymbolUtil,
  TBaseSymbol,
  TBox,
  TPartialDeep,
  TPoint,
  TSymbolGeometry,
} from "@/iink"

/** The raw (pre-matrix) box every test double instance answers `computeGeometry` with below. */
const RAW_BOX: TBox = { x: 0, y: 0, width: 10, height: 10 }

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
    return {
      bounds: OBBOps.fromBox(RAW_BOX),
      vertices: BoxOps.getCorners(RAW_BOX),
      snapPoints: [{ x: 5, y: 5 }],
      edges: BoxOps.getSides(RAW_BOX),
      length: 0,
    }
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

  /** Exposes the protected `overlapsQuery` to the tests below, unchanged. */
  testOverlapsQuery(symbol: TBaseSymbol, box: TBox, rawOverlaps: (box: TBox) => boolean): boolean {
    return this.overlapsQuery(symbol, box, rawOverlaps)
  }

  /** Exposes the protected `mapPointsForward` to the tests below, unchanged. */
  testMapPointsForward(symbol: TBaseSymbol, points: TPoint[]): TPoint[] {
    return this.mapPointsForward(symbol, points)
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

/**
 * `overlapsQuery` is what every concrete `overlaps` override (Stroke/Shape/Edge/Text/Math/Decorator)
 * now delegates to instead of testing the query box directly — these cases pin its behaviour once,
 * on the test double, rather than once per type.
 */
describe("SymbolUtil.ts overlapsQuery", () => {
  const util = new TestSymbolUtil()

  test("an identity transform tests the query exactly as given, unmapped", () => {
    const symbol = util.create({})
    const rawOverlaps = jest.fn(() => true)
    const box: TBox = { x: 100, y: 200, width: 1, height: 1 }

    expect(util.testOverlapsQuery(symbol, box, rawOverlaps)).toBe(true)
    // Same box, not merely an equal one: identity skips the corner round-trip entirely.
    expect(rawOverlaps).toHaveBeenCalledWith(box)
  })

  test("a translate maps the query back into the raw frame before testing it", () => {
    // transform moves the symbol by (10, 20): raw coordinates + (10, 20) = document coordinates, so
    // a document-frame query maps back to raw by subtracting (10, 20) from every corner.
    const symbol = util.create({ transform: { tx: 10, ty: 20 } })
    const rawOverlaps = jest.fn(() => true)

    util.testOverlapsQuery(symbol, { x: 15, y: 25, width: 1, height: 1 }, rawOverlaps)

    expect(rawOverlaps).toHaveBeenCalledWith({ x: 5, y: 5, width: 1, height: 1 })
  })

  test("a non-invertible matrix (scaled to nothing on one axis) overlaps no query", () => {
    // determinant = xx*yy - yx*xy = 0*1 - 0*0 = 0: this symbol has no width left to land a query in.
    const symbol = util.create({ transform: { xx: 0, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 } })
    const rawOverlaps = jest.fn(() => true)

    expect(util.testOverlapsQuery(symbol, { x: 0, y: 0, width: 1000, height: 1000 }, rawOverlaps)).toBe(false)
    // Deliberately never reaches the raw test: there is nothing meaningful to hand it.
    expect(rawOverlaps).not.toHaveBeenCalled()
  })

  /**
   * `Math.abs(NaN) < MIN_DETERMINANT` is `false` — a `NaN` determinant passes a guard that only
   * checks magnitude, and `pointInConvexPolygon`'s cross-product comparisons are all `false` against
   * `NaN` corners, which the sign-tracking loop reads as "never disagrees", i.e. "contains everything".
   * Un-guarded, a `NaN` determinant would therefore make `overlapsQuery` report every query as
   * overlapping, the opposite of the non-invertible case immediately above.
   */
  test("a NaN determinant overlaps no query either, not everything", () => {
    const symbol = util.create({ transform: { xx: NaN, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 } })
    const rawOverlaps = jest.fn(() => true)

    expect(util.testOverlapsQuery(symbol, { x: 0, y: 0, width: 1000, height: 1000 }, rawOverlaps)).toBe(false)
    expect(rawOverlaps).not.toHaveBeenCalled()
  })

  /**
   * A shear (rotation composed with a non-uniform resize) maps an axis-aligned query to a genuine
   * parallelogram - not a `TBox`, and not a `TOBB` either (that assumes right angles). This is the
   * hazard `polygonOverlapsQuad` exists for; `OBB.test.ts` hand-derives the same query/geometry pair
   * against that function directly. Here the point is that `overlapsQuery` reaches it at all, for a
   * query a naive (untransformed) test would reject outright.
   */
  test("a sheared transform is tested exactly, via the symbol's raw bounds/edges, not approximated", () => {
    // (x, y) -> (x + y, y): raw (0,0)-(10,10) becomes the parallelogram (0,0),(10,0),(20,10),(10,10).
    const symbol = util.create({ transform: { xx: 1, yx: 0, xy: 1, yy: 1, tx: 0, ty: 0 } })
    // Straddles that parallelogram's slanted right edge near y=8 (which runs from x=18 to x=19 as y
    // goes 8 to 9) - a query a naive test against the raw axis-aligned box [0,10]x[0,10] would reject
    // outright (17 > 10).
    const straddling: TBox = { x: 17, y: 8, width: 4, height: 1 }
    const rawOverlaps = jest.fn(() => false) // must not be asked to judge a shape it cannot express

    expect(util.testOverlapsQuery(symbol, straddling, rawOverlaps)).toBe(true)
    expect(rawOverlaps).not.toHaveBeenCalled()

    // Clearly outside the parallelogram everywhere near y=8 (x well past the right edge's x=19 cap).
    const clearMiss: TBox = { x: 25, y: 8, width: 2, height: 1 }
    expect(util.testOverlapsQuery(symbol, clearMiss, rawOverlaps)).toBe(false)
  })
})

/**
 * `mapPointsForward` is what `getSnapPoints`/`getResizePoints` overrides use to carry a raw point
 * through the symbol's matrix - the mirror image of `overlapsQuery`'s inverse mapping, and exact
 * regardless of rotation or shear since a single point never needs approximating.
 */
describe("SymbolUtil.ts mapPointsForward", () => {
  const util = new TestSymbolUtil()

  test("an identity transform returns the same points unchanged", () => {
    const symbol = util.create({})
    const points: TPoint[] = [{ x: 1, y: 2 }]

    expect(util.testMapPointsForward(symbol, points)).toBe(points)
  })

  test("a rotate composed with a translate carries each point through both, in order", () => {
    // Rotate 90° about the origin sends (x, y) to (-y, x); then translate(10, 0) adds (10, 0).
    const symbol = util.create({ transform: { xx: 0, yx: 1, xy: -1, yy: 0, tx: 10, ty: 0 } })

    expect(util.testMapPointsForward(symbol, [{ x: 1, y: 0 }, { x: 0, y: 1 }])).toEqual([
      { x: 10, y: 1 },
      { x: 9, y: 0 },
    ])
  })
})
