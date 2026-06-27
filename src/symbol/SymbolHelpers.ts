import type { TBaseSymbol } from "./Symbol"
import type { TSymbol } from "./Symbol"
import type { TShape } from "./shape/Shape"
import type { TShapeCircle, TShapeEllipse, TShapePolygon } from "./shape"
import type { TEdge } from "./edge/Edge"
import type { TEdgeArc, TEdgeLine, TEdgePolyLine } from "./edge"
import type { TStroke } from "./stroke/Stroke"
import type { TText } from "./text/Text"
import type { TMath } from "./math/Math"
import type { TDecorator } from "./decorator/Decorator"
import type { TEraser } from "./eraser/Eraser"
import type { TPartialDeep } from "@/utils"
import { SymbolType } from "./Symbol"
import { ShapeKind } from "./shape/Shape"
import { EdgeKind } from "./edge/Edge"
import type { TBox } from "./primitives/Box"
import type { TPoint } from "./primitives/Point"
import { DecoratorHelper } from "./decorator/Decorator"
import { StrokeHelper } from "./stroke/Stroke"
import { TextHelper } from "./text/Text"
import { MathHelper } from "./math/Math"
import { ShapeCircleHelper } from "./shape/Circle"
import { ShapeEllipseHelper } from "./shape/Ellipse"
import { ShapePolygonHelper } from "./shape/Polygon"
import { EdgeLineHelper } from "./edge/Line"
import { EdgePolyLineHelper } from "./edge/PolyLine"
import { EdgeArcHelper } from "./edge/Arc"

/**
 * @group Symbol
 * @summary Symbol utility functions and type guards
 *
 * Common helper functions for symbol type checking, classification,
 * and filtering used throughout the application.
 */

/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
export function isStroke(symbol: TBaseSymbol): symbol is TStroke
{
  return symbol.type === SymbolType.Stroke
}

/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
export function isText(symbol: TBaseSymbol): symbol is TText
{
  return symbol.type === SymbolType.Text
}

/**
 * @group Symbol
 * @summary Check if symbol is a shape (circle, ellipse, polygon)
 * @param symbol - Symbol to check
 * @returns True if symbol is a shape
 */
export function isShape(symbol: TBaseSymbol): symbol is TShape
{
  return symbol.type === SymbolType.Shape
}

/**
 * @group Symbol
 * @summary Check if symbol is an edge (line, arc, polyline)
 * @param symbol - Symbol to check
 * @returns True if symbol is an edge
 */
export function isEdge(symbol: TBaseSymbol): symbol is TEdge
{
  return symbol.type === SymbolType.Edge
}

/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
export function isMath(symbol: TBaseSymbol): symbol is TMath
{
  return symbol.type === SymbolType.Math
}

/**
 * @group Symbol
 * @summary Check if symbol is an eraser
 * @param symbol - Symbol to check
 * @returns True if symbol is an eraser
 */
export function isEraser(symbol: { type: string }): symbol is TEraser
{
  return symbol.type === SymbolType.Eraser
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
export function isRecognizedMath(symbol: TSymbol): symbol is TStroke
{
  return isStroke(symbol) && symbol.jiixBlockType === "Math"
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
export function isStrokeSolverOutput(symbol: TSymbol): symbol is TStroke
{
  return isStroke(symbol) && symbol.isSolverOutput === true
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
export function isRecognizedText(symbol: TSymbol): symbol is TStroke
{
  return isStroke(symbol) && symbol.jiixBlockType === "Text"
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is a circle
 * @param shape - The shape to check
 * @returns True if the shape is a circle
 */
export function isCircleShape(shape: TShape): shape is TShapeCircle
{
  return shape.kind === ShapeKind.Circle
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is an ellipse
 * @param shape - The shape to check
 * @returns True if the shape is an ellipse
 */
export function isEllipseShape(shape: TShape): shape is TShapeEllipse
{
  return shape.kind === ShapeKind.Ellipse
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is a polygon
 * @param shape - The shape to check
 * @returns True if the shape is a polygon
 */
export function isPolygonShape(shape: TShape): shape is TShapePolygon
{
  return shape.kind === ShapeKind.Polygon
}

// ============================================================================
// Type Guards for Edge Kinds
// ============================================================================

/**
 * @group Symbol
 * @summary Type guard to check if an edge is a line
 * @param edge - The edge to check
 * @returns True if the edge is a line
 */
export function isLineEdge(edge: TEdge): edge is TEdgeLine
{
  return edge.kind === EdgeKind.Line
}

/**
 * @group Symbol
 * @summary Type guard to check if an edge is an arc
 * @param edge - The edge to check
 * @returns True if the edge is an arc
 */
export function isArcEdge(edge: TEdge): edge is TEdgeArc
{
  return edge.kind === EdgeKind.Arc
}

/**
 * @group Symbol
 * @summary Type guard to check if an edge is a polyline
 * @param edge - The edge to check
 * @returns True if the edge is a polyline
 */
export function isPolyEdge(edge: TEdge): edge is TEdgePolyLine
{
  return edge.kind === EdgeKind.PolyEdge
}

/**
 * @group Symbol
 * @summary Check if symbol is a standalone decorator
 */
export function isDecorator(symbol: TBaseSymbol): symbol is TDecorator
{
  return symbol.type === SymbolType.Decorator
}

/**
 * @group Symbol
 * @summary Clone any TSymbol — all types are now plain objects, use structuredClone.
 */
export function cloneSymbol(symbol: TSymbol): TSymbol
{
  return structuredClone(symbol)
}

/**
 * @group Symbol
 * @summary Test if a symbol overlaps a bounding box — dispatches to the appropriate helper.
 */
export function overlapsSymbol(symbol: TSymbol, box: TBox): boolean
{
  if (isStroke(symbol)) return StrokeHelper.overlaps(symbol, box)
  if (isDecorator(symbol)) return DecoratorHelper.overlaps(symbol, box)
  if (isText(symbol)) return TextHelper.overlaps(symbol, box)
  if (isMath(symbol)) return MathHelper.overlaps(symbol, box)
  if (isShape(symbol)) {
    if (isCircleShape(symbol)) return ShapeCircleHelper.overlaps(symbol, box)
    if (isEllipseShape(symbol)) return ShapeEllipseHelper.overlaps(symbol, box)
    if (isPolygonShape(symbol)) return ShapePolygonHelper.overlaps(symbol, box)
  }
  if (isEdge(symbol)) {
    if (isLineEdge(symbol)) return EdgeLineHelper.overlaps(symbol, box)
    if (isPolyEdge(symbol)) return EdgePolyLineHelper.overlaps(symbol, box)
    if (isArcEdge(symbol)) return EdgeArcHelper.overlaps(symbol, box)
  }
  return false
}

/**
 * @group Symbol
 * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TShape.
 */
export function updateShapeDerivedFields(shape: TShape): void
{
  if (isCircleShape(shape)) ShapeCircleHelper.updateDerivedFields(shape)
  else if (isEllipseShape(shape)) ShapeEllipseHelper.updateDerivedFields(shape)
  else if (isPolygonShape(shape)) ShapePolygonHelper.updateDerivedFields(shape)
}

/**
 * @group Symbol
 * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TEdge.
 */
export function updateEdgeDerivedFields(edge: TEdge): void
{
  if (isLineEdge(edge)) EdgeLineHelper.updateDerivedFields(edge)
  else if (isPolyEdge(edge)) EdgePolyLineHelper.updateDerivedFields(edge)
  else if (isArcEdge(edge)) EdgeArcHelper.updateDerivedFields(edge)
}

/**
 * @group Symbol
 * @summary Get resize points for any TEdge.
 */
export function getEdgeResizePoints(edge: TEdge): { point: TPoint, vertexIndex: number }[]
{
  if (isLineEdge(edge)) return EdgeLineHelper.getResizePoints(edge)
  if (isPolyEdge(edge)) return EdgePolyLineHelper.getResizePoints(edge)
  if (isArcEdge(edge)) return EdgeArcHelper.getResizePoints(edge)
  return []
}

/**
 * @group Symbol
 * @summary Create a TShape from partial data — dispatches by kind.
 */
export function createShapeFromPartial(partial: TPartialDeep<TShape>): TShape
{
  switch (partial.kind) {
    case ShapeKind.Circle:
      return ShapeCircleHelper.createFromPartial(partial as TPartialDeep<TShapeCircle>)
    case ShapeKind.Ellipse:
      return ShapeEllipseHelper.createFromPartial(partial as TPartialDeep<TShapeEllipse>)
    case ShapeKind.Polygon:
      return ShapePolygonHelper.createFromPartial(partial as TPartialDeep<TShapePolygon>)
    default:
      throw new Error(`Unable to create shape, kind: "${ partial.kind }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create a TEdge from partial data — dispatches by kind.
 */
export function createEdgeFromPartial(partial: TPartialDeep<TEdge>): TEdge
{
  switch (partial.kind) {
    case EdgeKind.Arc:
      return EdgeArcHelper.createFromPartial(partial as TPartialDeep<TEdgeArc>)
    case EdgeKind.Line:
      return EdgeLineHelper.createFromPartial(partial as TPartialDeep<TEdgeLine>)
    case EdgeKind.PolyEdge:
      return EdgePolyLineHelper.createFromPartial(partial as TPartialDeep<TEdgePolyLine>)
    default:
      throw new Error(`Unable to create edge, kind: "${ partial.kind }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create any TSymbol from partial data — dispatches by type.
 */
export function createSymbolFromPartial(partial: TPartialDeep<TSymbol>): TSymbol
{
  switch (partial.type) {
    case SymbolType.Stroke:
      return StrokeHelper.createFromPartial(partial as TPartialDeep<TStroke>)
    case SymbolType.Shape:
      return createShapeFromPartial(partial as TPartialDeep<TShape>)
    case SymbolType.Edge:
      return createEdgeFromPartial(partial as TPartialDeep<TEdge>)
    case SymbolType.Text:
      return TextHelper.createFromPartial(partial as TPartialDeep<TText>)
    case SymbolType.Math:
      return MathHelper.createFromPartial(partial as TPartialDeep<TMath>)
    default:
      throw new Error(`Unable to create symbol, type: "${ partial.type }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
export function createSymbolsFromPartial(partials: TPartialDeep<TSymbol>[]): TSymbol[]
{
  const errors: string[] = []
  const symbols: TSymbol[] = []
  partials.forEach((partial, index) =>
  {
    try {
      symbols.push(createSymbolFromPartial(partial))
    } catch (error) {
      errors.push(`Symbol ${ index }: ${ (error as Error).message || error }`)
    }
  })
  if (errors.length) {
    throw new Error(`Failed to create ${ errors.length } symbol(s):\n${ errors.join("\n") }`)
  }
  return symbols
}
