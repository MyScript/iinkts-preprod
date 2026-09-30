/**
 * @group Symbol
 * @summary Symbol types organized by category
 *
 * **Primitives** — {@link TPoint}, {@link TBox}, {@link BoxOps}
 *
 * **Stroke** — {@link TStroke}, {@link isStroke}
 *
 * **Text** — {@link TText}, {@link TextUtil}
 *
 * **Math** — {@link TMath}, {@link MathUtil}
 *
 * **Typeset** — {@link TTypesetChild}
 *
 * **Decorator** — {@link TDecorator}, {@link DecoratorUtil}
 *
 * **Eraser** — {@link TEraser}, {@link EraserOps}
 *
 * **Shape** — {@link TShape}, {@link TShapeCircle}, {@link TShapeEllipse}, {@link TShapePolygon}
 *
 * **Edge** — {@link TEdge}, {@link TEdgeArc}, {@link TEdgeLine}, {@link TEdgePolyLine}, {@link TAnchor}
 *
 * **Legacy** (deprecated v1) — {@link Stroke}, {@link TLegacyStroke}
 */

// Symbol categories
export * from "./decorator"
export * from "./edge"
export * from "./eraser"
export * from "./shape"
export * from "./stroke"
export * from "./typeset"

// Root union type + enum re-exports
export * from "./Symbol"

// Cross-type dispatchers
export * from "./SymbolHelpers"

// Legacy v1 symbols (deprecated)
export * from "./legacy"
