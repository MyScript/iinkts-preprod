import type {
  TSymbol} from "@/symbol";
import
{
  SymbolType,
  isRecognizedText,
} from "@/symbol"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"

/**
 * Helper class containing all shared utility methods for gesture handlers
 * Centralizes common functionality to avoid code duplication across handlers
 * @group Manager
 */
export class GestureHelpers
{
  constructor(protected editor: TInteractiveInkEditor)
  {
  }

  /**
   * Check if a symbol can have decorators applied to it
   * @param symbol - The symbol to check
   * @returns true if symbol is Stroke, Text, or RecognizedText
   */
  isDecorable(symbol: TSymbol): boolean
  {
    return symbol.type === SymbolType.Stroke ||
           symbol.type === SymbolType.Text ||
           isRecognizedText(symbol)
  }
}
