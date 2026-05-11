import type { TIISymbol } from "./interactive/IISymbol"
import type { IIRecognizedMath } from "./recognized/IIRecognizedMath"
import { SymbolType } from "./base/Symbol"
import { RecognizedKind } from "./recognized/IIRecognizedBase"

/**
 * Type guard to check if a symbol is a recognized math symbol
 * @param symbol - The symbol to check
 * @returns True if the symbol is a recognized math symbol
 * @group Utils
 */
export function isMathSymbol(symbol: TIISymbol): symbol is IIRecognizedMath {
  return symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Math
}

/**
 * Filter math symbols from an array
 * @param symbols - Array of symbols to filter
 * @returns Array of recognized math symbols
 * @group Utils
 */
export function filterMathSymbols(symbols: TIISymbol[]): IIRecognizedMath[] {
  return symbols.filter(isMathSymbol)
}
