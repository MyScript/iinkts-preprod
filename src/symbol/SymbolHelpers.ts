import type {
  TBaseSymbol,
  TSymbol,
  TShape,
  TEdge,
  TStroke,
  TText,
  TMath,
  TEraser,
  TDecorator
} from "./index"
import type { TShapeCircle, TShapeEllipse, TShapePolygon } from "./geometry"
import type { TEdgeArc, TEdgeLine, TEdgePolyLine } from "./geometry"
import { PartialDeep } from "@/utils"
import { SymbolType } from "./base/Symbol"
import { ShapeKind } from "./geometry/IIShape"
import { EdgeKind } from "./geometry/IIEdge"
import type { TBox } from "./base/Box"
import type { TPoint } from "./base/Point"
import { IIDecoratorHelper } from "./helpers/IIDecoratorHelper"
import { IIStrokeHelper } from "./helpers/IIStrokeHelper"
import { IITextHelper } from "./helpers/IITextHelper"
import { IIMathHelper } from "./helpers/IIMathHelper"
import { IIShapeCircleHelper } from "./helpers/IIShapeCircleHelper"
import { IIShapeEllipseHelper } from "./helpers/IIShapeEllipseHelper"
import { IIShapePolygonHelper } from "./helpers/IIShapePolygonHelper"
import { IIEdgeLineHelper } from "./helpers/IIEdgeLineHelper"
import { IIEdgePolyLineHelper } from "./helpers/IIEdgePolyLineHelper"
import { IIEdgeArcHelper } from "./helpers/IIEdgeArcHelper"

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
  if (isStroke(symbol)) return IIStrokeHelper.overlaps(symbol, box)
  if (isDecorator(symbol)) return IIDecoratorHelper.overlaps(symbol, box)
  if (isText(symbol)) return IITextHelper.overlaps(symbol, box)
  if (isMath(symbol)) return IIMathHelper.overlaps(symbol, box)
  if (isShape(symbol)) {
    if (isCircleShape(symbol)) return IIShapeCircleHelper.overlaps(symbol, box)
    if (isEllipseShape(symbol)) return IIShapeEllipseHelper.overlaps(symbol, box)
    if (isPolygonShape(symbol)) return IIShapePolygonHelper.overlaps(symbol, box)
  }
  if (isEdge(symbol)) {
    if (isLineEdge(symbol)) return IIEdgeLineHelper.overlaps(symbol, box)
    if (isPolyEdge(symbol)) return IIEdgePolyLineHelper.overlaps(symbol, box)
    if (isArcEdge(symbol)) return IIEdgeArcHelper.overlaps(symbol, box)
  }
  return false
}

/**
 * @group Symbol
 * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TShape.
 */
export function updateShapeDerivedFields(shape: TShape): void
{
  if (isCircleShape(shape)) IIShapeCircleHelper.updateDerivedFields(shape)
  else if (isEllipseShape(shape)) IIShapeEllipseHelper.updateDerivedFields(shape)
  else if (isPolygonShape(shape)) IIShapePolygonHelper.updateDerivedFields(shape)
}

/**
 * @group Symbol
 * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TEdge.
 */
export function updateEdgeDerivedFields(edge: TEdge): void
{
  if (isLineEdge(edge)) IIEdgeLineHelper.updateDerivedFields(edge)
  else if (isPolyEdge(edge)) IIEdgePolyLineHelper.updateDerivedFields(edge)
  else if (isArcEdge(edge)) IIEdgeArcHelper.updateDerivedFields(edge)
}

/**
 * @group Symbol
 * @summary Get resize points for any TEdge.
 */
export function getEdgeResizePoints(edge: TEdge): { point: TPoint, vertexIndex: number }[]
{
  if (isLineEdge(edge)) return IIEdgeLineHelper.getResizePoints(edge)
  if (isPolyEdge(edge)) return IIEdgePolyLineHelper.getResizePoints(edge)
  if (isArcEdge(edge)) return IIEdgeArcHelper.getResizePoints(edge)
  return []
}

/**
 * @group Symbol
 * @summary Create a TShape from partial data — dispatches by kind.
 */
export function createShapeFromPartial(partial: PartialDeep<TShape>): TShape
{
  switch (partial.kind) {
    case ShapeKind.Circle:
      return IIShapeCircleHelper.createFromPartial(partial as PartialDeep<TShapeCircle>)
    case ShapeKind.Ellipse:
      return IIShapeEllipseHelper.createFromPartial(partial as PartialDeep<TShapeEllipse>)
    case ShapeKind.Polygon:
      return IIShapePolygonHelper.createFromPartial(partial as PartialDeep<TShapePolygon>)
    default:
      throw new Error(`Unable to create shape, kind: "${ partial.kind }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create a TEdge from partial data — dispatches by kind.
 */
export function createEdgeFromPartial(partial: PartialDeep<TEdge>): TEdge
{
  switch (partial.kind) {
    case EdgeKind.Arc:
      return IIEdgeArcHelper.createFromPartial(partial as PartialDeep<TEdgeArc>)
    case EdgeKind.Line:
      return IIEdgeLineHelper.createFromPartial(partial as PartialDeep<TEdgeLine>)
    case EdgeKind.PolyEdge:
      return IIEdgePolyLineHelper.createFromPartial(partial as PartialDeep<TEdgePolyLine>)
    default:
      throw new Error(`Unable to create edge, kind: "${ partial.kind }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create any TSymbol from partial data — dispatches by type.
 */
export function createSymbolFromPartial(partial: PartialDeep<TSymbol>): TSymbol
{
  switch (partial.type) {
    case SymbolType.Stroke:
      return IIStrokeHelper.createFromPartial(partial as PartialDeep<TStroke>)
    case SymbolType.Shape:
      return createShapeFromPartial(partial as PartialDeep<TShape>)
    case SymbolType.Edge:
      return createEdgeFromPartial(partial as PartialDeep<TEdge>)
    case SymbolType.Text:
      return IITextHelper.createFromPartial(partial as PartialDeep<TText>)
    case SymbolType.Math:
      return IIMathHelper.createFromPartial(partial as PartialDeep<TMath>)
    default:
      throw new Error(`Unable to create symbol, type: "${ partial.type }" is unknown`)
  }
}

/**
 * @group Symbol
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
export function createSymbolsFromPartial(partials: PartialDeep<TSymbol>[]): TSymbol[]
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
