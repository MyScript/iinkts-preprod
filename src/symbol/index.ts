/**
 * @group Symbol
 * @summary Symbol types organized by category
 *
 * **Primitives** — {@link TPoint}, {@link TBox}, {@link BoxOps}
 *
 * **Stroke** — {@link TStroke}, {@link StrokeOps}
 *
 * **Text** — {@link TText}, {@link TextOps}
 *
 * **Math** — {@link TMath}, {@link MathOps}
 *
 * **Typeset** — {@link TTypesetChild}, {@link TRotation}
 *
 * **Decorator** — {@link TDecorator}, {@link DecoratorOps}
 *
 * **Eraser** — {@link TEraser}, {@link EraserOps}
 *
 * **Shape** — {@link TShape}, {@link TShapeCircle}, {@link TShapeEllipse}, {@link TShapePolygon}
 *
 * **Edge** — {@link TEdge}, {@link TEdgeArc}, {@link TEdgeLine}, {@link TEdgePolyLine}, {@link TAnchor}
 *
 * **Legacy** (deprecated v1) — {@link Stroke}, {@link TLegacyStroke}
 */

// Primitives
export * from "./primitives"

// Symbol categories
export * from "./decorator"
export * from "./edge"
export * from "./eraser"
export * from "./math"
export * from "./shape"
export * from "./stroke"
export * from "./text"
export * from "./typeset"

// Root union type + enum re-exports
export * from "./Symbol"

// Cross-type dispatchers
export * from "./SymbolHelpers"

// Legacy v1 symbols (deprecated)
export * from "./legacy"
