import type { TSymbol, TIISymbol, IIStroke, IIText, IIRecognizedText } from "./index"
import type { IIRecognizedMath } from "./recognized/IIRecognizedMath"
import { SymbolType } from "./base/Symbol"
import { RecognizedKind } from "./recognized/IIRecognizedBase"

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
export function isShape(symbol: TSymbol): boolean
{
  return symbol.type === SymbolType.Shape || symbol.type === SymbolType.Edge
}

/**
 * @group Symbol
 * @summary Check if symbol is a recognized result (text, arc, circle, etc.)
 * @param symbol - Symbol to check
 * @returns True if symbol is recognized
 */
export function isRecognized(symbol: TSymbol): boolean
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
export function isRecognizedMathSymbol(symbol: TIISymbol): symbol is IIRecognizedMath
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Math
}

/**
 * @group Symbol
 * @summary Type guard to check if a symbol is a recognized text symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized text symbol
 */
export function isRecognizedTextSymbol(symbol: TIISymbol): symbol is IIRecognizedText
{
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Text
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
  return symbols.filter(isRecognizedMathSymbol)
}
