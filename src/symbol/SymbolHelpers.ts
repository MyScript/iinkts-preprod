import type {
  TSymbol,
  TIISymbol,
  TIIShape,
  TIIEdge,
  IIStroke,
  IIText,
  IIMath,
  IIEraser
} from "./index"
import type { IIShapeCircle, IIShapeEllipse, IIShapePolygon } from "./geometry"
import type { IIEdgeArc, IIEdgeLine, IIEdgePolyLine } from "./geometry"
import { SymbolType } from "./base/Symbol"
import { ShapeKind } from "./geometry/IIShape"
import { EdgeKind } from "./geometry/IIEdge"

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
export function isStroke(symbol: TSymbol): symbol is IIStroke
{
  return symbol.type === SymbolType.Stroke
}

/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
export function isText(symbol: TSymbol): symbol is IIText
{
  return symbol.type === SymbolType.Text
}

/**
 * @group Symbol
 * @summary Check if symbol is a shape (circle, ellipse, polygon)
 * @param symbol - Symbol to check
 * @returns True if symbol is a shape
 */
export function isShape(symbol: TSymbol): symbol is TIIShape
{
  return symbol.type === SymbolType.Shape
}

/**
 * @group Symbol
 * @summary Check if symbol is an edge (line, arc, polyline)
 * @param symbol - Symbol to check
 * @returns True if symbol is an edge
 */
export function isEdge(symbol: TSymbol): symbol is TIIEdge
{
  return symbol.type === SymbolType.Edge
}

/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
export function isMath(symbol: TSymbol): symbol is IIMath
{
  return symbol.type === SymbolType.Math
}

/**
 * @group Symbol
 * @summary Check if symbol is an eraser
 * @param symbol - Symbol to check
 * @returns True if symbol is an eraser
 */
export function isEraser(symbol: TSymbol): symbol is IIEraser
{
  return symbol.type === SymbolType.Eraser
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
export function isRecognizedMath(symbol: TIISymbol): symbol is IIStroke
{
  return isStroke(symbol) && symbol.jiixBlockType === "Math"
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
export function isStrokeSolverOutput(symbol: TIISymbol): symbol is IIStroke
{
  return isStroke(symbol) && symbol.isSolverOutput === true
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
export function isRecognizedText(symbol: TIISymbol): symbol is IIStroke
{
  return isStroke(symbol) && symbol.jiixBlockType === "Text"
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is a circle
 * @param shape - The shape to check
 * @returns True if the shape is a circle
 */
export function isCircleShape(shape: TIIShape): shape is IIShapeCircle
{
  return shape.kind === ShapeKind.Circle
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is an ellipse
 * @param shape - The shape to check
 * @returns True if the shape is an ellipse
 */
export function isEllipseShape(shape: TIIShape): shape is IIShapeEllipse
{
  return shape.kind === ShapeKind.Ellipse
}

/**
 * @group Symbol
 * @summary Type guard to check if a shape is a polygon
 * @param shape - The shape to check
 * @returns True if the shape is a polygon
 */
export function isPolygonShape(shape: TIIShape): shape is IIShapePolygon
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
export function isLineEdge(edge: TIIEdge): edge is IIEdgeLine
{
  return edge.kind === EdgeKind.Line
}

/**
 * @group Symbol
 * @summary Type guard to check if an edge is an arc
 * @param edge - The edge to check
 * @returns True if the edge is an arc
 */
export function isArcEdge(edge: TIIEdge): edge is IIEdgeArc
{
  return edge.kind === EdgeKind.Arc
}

/**
 * @group Symbol
 * @summary Type guard to check if an edge is a polyline
 * @param edge - The edge to check
 * @returns True if the edge is a polyline
 */
export function isPolyEdge(edge: TIIEdge): edge is IIEdgePolyLine
{
  return edge.kind === EdgeKind.PolyEdge
}
