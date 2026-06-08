import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIDecorator, IIStroke, IIText, DecoratorKind, type TIISymbol, isRecognizedText, isText, SymbolType } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { StrikeThroughAction } from "@/manager/interactive/gestures/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for STRIKETHROUGH gesture type
 * Supports two actions: Draw (apply decorator) and Erase (remove symbols)
 * @group Manager
 */
export class StrikeThroughGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "STRIKETHROUGH" as const

  constructor(
    editor: InteractiveInkEditor,
    helpers: GestureHelpers
  )
  {
    super(editor, helpers)
    this.#logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>
  {
    this.#logger.debug("applyStrikeThroughGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }

    switch (this.manager.strikeThroughAction) {
      case StrikeThroughAction.Draw:
        await this.applyDraw(gestureStroke, gesture)
        break
      case StrikeThroughAction.Erase:
        return this.editor.removeSymbols(gesture.strokeIds)
      default:
        this.#logger.warn("applyStrikeThroughGesture", `Unknown strikeThroughAction: ${ this.manager.strikeThroughAction }`)
        break
    }
  }

  private async applyDraw(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    const changes: TIIHistoryChanges = { decorator: [] }
    const symbolIds: string[] = []

    gesture.strokeIds.forEach(id =>
    {
      const symbol = this.model.getRootSymbol(id)
      if (symbol && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(symbol.type) && !symbolIds.includes(symbol.id)) {
        const symWithDec = symbol as (IIText | IIStroke)

        // Apply decorator on words for recognized text strokes, or on symbol level for others
        if (isRecognizedText(symWithDec) || isText(symWithDec)) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIStroke), gestureStroke, DecoratorKind.Strikethrough)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIds.push(symWithDec.id)
            const strikethrough = new IIDecorator(DecoratorKind.Strikethrough, this.editor.penStyle)
            changes.decorator?.push({ symbol: symWithDec, decorator: strikethrough, added: true })
          }
        }
      }
    })

    if (changes.decorator?.length) {
      this.history.push(this.model, changes)
    }
  }
}
