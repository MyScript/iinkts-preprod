import type {
  TSymbol,
  TIISymbol,
  TIIShape,
  TIIEdge,
  TIIRecognized,
  IIStroke,
  IIText,
  IIMath,
  IIEraser
} from "./index"
import type { IIRecognizedText, IIRecognizedMath, IIRecognizedArc, IIRecognizedCircle, IIRecognizedEllipse, IIRecognizedLine, IIRecognizedPolyLine, IIRecognizedPolygon } from "./recognized"
import type { IIShapeCircle, IIShapeEllipse, IIShapePolygon } from "./geometry"
import type { IIEdgeArc, IIEdgeLine, IIEdgePolyLine } from "./geometry"
import { SymbolType } from "./base/Symbol"
import { RecognizedKind } from "./recognized/IIRecognizedBase"
import { ShapeKind } from "./geometry/IIShape"
import { EdgeKind } from "./geometry/IIEdge"

/**
 * @group Symbol
 * @summary Symbol utility functions and type guards
 *
 * Common helper functions for symbol type checking, classification,
 * and filtering used throughout the application.
 */

// ============================================================================
// Type Guards for Base Symbol Types
// ============================================================================

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
 * @summary Check if symbol is a recognized result (text, arc, circle, etc.)
 * @param symbol - Symbol to check
 * @returns True if symbol is recognized
 */
export function isRecognized(symbol: TSymbol): symbol is TIIRecognized
{
  return symbol.type === SymbolType.Recognized
}

// ============================================================================
// Type Guards for Specific Symbol Types
// ============================================================================

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized math symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized math symbol
 */
export function isRecognizedMath(symbol: TIISymbol): symbol is IIRecognizedMath
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Math
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized text symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized text symbol
 */
export function isRecognizedText(symbol: TIISymbol): symbol is IIRecognizedText
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Text
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized line
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized line
 */
export function isRecognizedLine(symbol: TIISymbol): symbol is IIRecognizedLine
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Line
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized arc
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized arc
 */
export function isRecognizedArc(symbol: TIISymbol): symbol is IIRecognizedArc
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Arc
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized circle
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized circle
 */
export function isRecognizedCircle(symbol: TIISymbol): symbol is IIRecognizedCircle
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Circle
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized ellipse
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized ellipse
 */
export function isRecognizedEllipse(symbol: TIISymbol): symbol is IIRecognizedEllipse
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Ellipse
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized polygon
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized polygon
 */
export function isRecognizedPolygon(symbol: TIISymbol): symbol is IIRecognizedPolygon
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Polygone
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized polyline
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized polyline
 */
export function isRecognizedPolyLine(symbol: TIISymbol): symbol is IIRecognizedPolyLine
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.PolyEdge
}

// ============================================================================
// Type Guards for Shape Kinds
// ============================================================================

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

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * @group Symbol
 * @summary Filter math symbols from an array
 * @param symbols - Array of symbols to filter
 * @returns Array of recognized math symbols
 */
export function filterMathSymbols(symbols: TIISymbol[]): IIRecognizedMath[]
{
  return symbols.filter(isRecognizedMath)
}
