import type {
  TBaseSymbol,
  TDecorator,
  TEdge,
  TEdgeArc,
  TEdgeLine,
  TEdgePolyLine,
  TMath,
  TReadonlyDeep,
  TShape,
  TShapeCircle,
  TShapeEllipse,
  TShapePolygon,
  TStroke,
  TSymbol,
  TText,
} from "@/iink"
import {
  EdgeUtil,
  isDecorator,
  isMath,
  isRecognizedMath,
  isRecognizedText,
  isStroke,
  isStrokeSolverOutput,
  isText,
  ShapeUtil,
  StrokeUtil,
  SymbolType,
} from "@/iink"

/**
 * These are type-level tests: the assertions are the `expectType` calls, checked by `yarn typecheck`.
 * The runtime `expect` calls only keep Jest from reporting an empty suite.
 */

/** Compiles only when `A` and `B` are the same type, invariantly. */
type TIsExact<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false

function expectType<TExpected>(): <TActual>(...args: TIsExact<TExpected, TActual> extends true ? [] : [never]) => void {
  return () => undefined
}

const stroke: TBaseSymbol = StrokeUtil.createEmpty()

describe("symbol type guards", () => {
  describe("on a read-only symbol", () => {
    const frozen = stroke as TReadonlyDeep<TSymbol>

    test("should keep the stroke read-only once narrowed", () => {
      if (isStroke(frozen)) {
        expectType<TReadonlyDeep<TStroke>>()<typeof frozen>()
        // @ts-expect-error a narrowed read-only stroke cannot be written to
        frozen.pointers.push({ x: 0, y: 0, t: 0, p: 0 })
      }
      expect(isStroke(frozen)).toBe(true)
    })

    test("should keep every other kind read-only once narrowed", () => {
      if (isText(frozen)) {
        expectType<TReadonlyDeep<TText>>()<typeof frozen>()
      }
      if (isMath(frozen)) {
        expectType<TReadonlyDeep<TMath>>()<typeof frozen>()
      }
      if (isDecorator(frozen)) {
        expectType<TReadonlyDeep<TDecorator>>()<typeof frozen>()
      }
      if (ShapeUtil.isShape(frozen)) {
        expectType<TReadonlyDeep<TShape>>()<typeof frozen>()
      }
      if (ShapeUtil.isCircleShape(frozen)) {
        expectType<TReadonlyDeep<TShapeCircle>>()<typeof frozen>()
      }
      if (ShapeUtil.isEllipseShape(frozen)) {
        expectType<TReadonlyDeep<TShapeEllipse>>()<typeof frozen>()
      }
      if (ShapeUtil.isPolygonShape(frozen)) {
        expectType<TReadonlyDeep<TShapePolygon>>()<typeof frozen>()
      }
      if (EdgeUtil.isEdge(frozen)) {
        expectType<TReadonlyDeep<TEdge>>()<typeof frozen>()
      }
      if (EdgeUtil.isLineEdge(frozen)) {
        expectType<TReadonlyDeep<TEdgeLine>>()<typeof frozen>()
      }
      if (EdgeUtil.isArcEdge(frozen)) {
        expectType<TReadonlyDeep<TEdgeArc>>()<typeof frozen>()
      }
      if (EdgeUtil.isPolyEdge(frozen)) {
        expectType<TReadonlyDeep<TEdgePolyLine>>()<typeof frozen>()
      }
      expect(isText(frozen)).toBe(false)
    })

    test("should keep a recognized stroke read-only once narrowed", () => {
      if (isRecognizedMath(frozen)) {
        expectType<TReadonlyDeep<TStroke>>()<typeof frozen>()
      }
      if (isRecognizedText(frozen)) {
        expectType<TReadonlyDeep<TStroke>>()<typeof frozen>()
      }
      if (isStrokeSolverOutput(frozen)) {
        expectType<TReadonlyDeep<TStroke>>()<typeof frozen>()
      }
      expect(isRecognizedMath(frozen)).toBe(false)
    })

    test("should filter a read-only list without losing read-only", () => {
      const symbols: readonly TReadonlyDeep<TSymbol>[] = [frozen]
      const strokes = symbols.filter(isStroke)
      expectType<TReadonlyDeep<TStroke>[]>()<typeof strokes>()
      expect(strokes).toHaveLength(1)
    })
  })

  describe("on a mutable symbol", () => {
    const mutable = stroke as TSymbol

    test("should narrow to the mutable variant", () => {
      if (isStroke(mutable)) {
        expectType<TStroke>()<typeof mutable>()
      }
      if (ShapeUtil.isCircleShape(mutable)) {
        expectType<TShapeCircle>()<typeof mutable>()
      }
      if (EdgeUtil.isArcEdge(mutable)) {
        expectType<TEdgeArc>()<typeof mutable>()
      }
      expect(isStroke(mutable)).toBe(true)
    })

    test("should filter a list down to the variant", () => {
      const strokes = [mutable].filter(isStroke)
      expectType<TStroke[]>()<typeof strokes>()
      const circles = [mutable].filter(ShapeUtil.isCircleShape)
      expectType<TShapeCircle[]>()<typeof circles>()
      expect(strokes).toHaveLength(1)
      expect(circles).toHaveLength(0)
    })
  })

  describe("on a base symbol", () => {
    test("should narrow to something usable as the variant", () => {
      const base: TBaseSymbol = stroke
      const asStroke: TStroke | undefined = isStroke(base) ? base : undefined
      expect(asStroke?.type).toBe(SymbolType.Stroke)
    })
  })
})
