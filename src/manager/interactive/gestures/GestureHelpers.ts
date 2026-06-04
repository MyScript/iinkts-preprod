import
{
  IIDecorator,
  IIStroke,
  SymbolType,
  IIText,
  DecoratorKind,
  TIISymbol,
  IIRecognizedText,
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
   * @param symbol - The symbol to apply decorator on (IIText or IIRecognizedText)
   * @param gestureStroke - The gesture stroke
   * @param decoratorKind - The kind of decorator to apply
   * @returns true if at least one word was modified, false otherwise
   */
  applyDecoratorOnWords(
    symbol: IIText | IIRecognizedText,
    gestureStroke: IIStroke,
    decoratorKind: DecoratorKind
  ): boolean
  {
    // For IIRecognizedText with words
    if (isRecognizedText(symbol)) {
      const recognizedText = symbol

      if (!recognizedText.words || !recognizedText.words.length) {
        // Fallback to text-level decorator if no words
        const decorator = new IIDecorator(decoratorKind, this.editor.penStyle)
        const index = recognizedText.decorators.findIndex(d => d.kind === decoratorKind)
        const added = index === -1
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        added ? recognizedText.decorators.push(decorator) : recognizedText.decorators.splice(index, 1)
        return added
      }

      let modified = false
      recognizedText.words.forEach(word =>
      {
        if (!word.bounds) return

        // Different detection logic based on decorator kind
        let shouldApplyDecorator: boolean
        if (decoratorKind === DecoratorKind.Underline) {
          // For underline: gesture stroke is below the word
          const horizontalOverlap = gestureStroke.bounds.xMax >= word.bounds.xMin &&
                                   gestureStroke.bounds.xMin <= word.bounds.xMax
          const isBelow = gestureStroke.bounds.yMid >= word.bounds.yMin &&
                         gestureStroke.bounds.yMid <= word.bounds.yMax + word.bounds.height * 0.5
          shouldApplyDecorator = horizontalOverlap && isBelow
        } else if (decoratorKind === DecoratorKind.Strikethrough) {
          // For strikethrough: gesture stroke crosses through the middle of the word
          const horizontalOverlap = gestureStroke.bounds.xMax >= word.bounds.xMin &&
                                   gestureStroke.bounds.xMin <= word.bounds.xMax
          const crossesMiddle = gestureStroke.bounds.yMid >= word.bounds.yMin + word.bounds.height * 0.25 &&
                               gestureStroke.bounds.yMid <= word.bounds.yMax - word.bounds.height * 0.25
          shouldApplyDecorator = horizontalOverlap && crossesMiddle
        } else {
          // For highlight, surround: gesture stroke overlaps with word bounds
          shouldApplyDecorator = gestureStroke.bounds.overlaps(word.bounds)
        }

        if (shouldApplyDecorator) {
          if (!word.decorators) {
            word.decorators = []
          }
          const index = word.decorators.findIndex(d => d.kind === decoratorKind)
          const added = index === -1
          if (added) {
            word.decorators.push(new IIDecorator(decoratorKind, this.editor.penStyle))
          } else {
            word.decorators.splice(index, 1)
          }
          modified = true
        }
      })
      return modified
    } else {
      // For IIText or other decorable symbols, apply at symbol level
      const decorator = new IIDecorator(decoratorKind, this.editor.penStyle)
      const index = symbol.decorators.findIndex(d => d.kind === decoratorKind)
      const added = index === -1
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      added ? symbol.decorators.push(decorator) : symbol.decorators.splice(index, 1)
      return added
    }
  }


}
