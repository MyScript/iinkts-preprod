import
{
  IIDecorator,
  IIStroke,
  SymbolType,
  IIText,
  DecoratorKind,
  TIISymbol,
  isRecognizedText,
} from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Helper class containing all shared utility methods for gesture handlers
 * Centralizes common functionality to avoid code duplication across handlers
 * @group Manager
 */
export class GestureHelpers
{
  constructor(private editor: InteractiveInkEditor)
  {
  }

  /**
   * Check if a symbol can have decorators applied to it
   * @param symbol - The symbol to check
   * @returns true if symbol is Stroke, Text, or RecognizedText
   */
  isDecorable(symbol: TIISymbol): boolean
  {
    return symbol.type === SymbolType.Stroke ||
           symbol.type === SymbolType.Text ||
           isRecognizedText(symbol)
  }

  /**
   * Apply decorator on words that intersect with gesture stroke
   * Handles different detection logic based on decorator kind:
   * - Underline: gesture stroke is below the word
   * - Strikethrough: gesture stroke crosses through the middle
   * - Highlight/Surround: gesture stroke overlaps with word
   *
   * @param symbol - The symbol to apply decorator on (IIText or IIStroke with text metadata)
   * @param _gestureStroke - The gesture stroke (reserved for future logic differentiation)
   * @param decoratorKind - The kind of decorator to apply
   * @returns true if at least one word was modified, false otherwise
   */
  applyDecoratorOnWords(
    symbol: IIText | IIStroke,
    _gestureStroke: IIStroke,
    decoratorKind: DecoratorKind
  ): boolean
  {
    //TODO: Implement different logic based on decoratorKind (underline, strikethrough, highlight, surround)
    // For IIText or other decorable symbols, apply at symbol level
    const decorator = new IIDecorator(decoratorKind, this.editor.penStyle)
    const index = symbol.decorators.findIndex(d => d.kind === decoratorKind)
    const added = index === -1
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    added ? symbol.decorators.push(decorator) : symbol.decorators.splice(index, 1)
    return added
  }


}
