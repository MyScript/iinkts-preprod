import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIDecorator, IIStroke, SymbolType, IIText, DecoratorKind, IIRecognizedText, RecognizedKind, type TIISymbol } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/GestureTypes"
import { UnderlineAction } from "@/manager/interactive/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (increase stroke width)
 * @group Manager
 */
export class UnderlineGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "UNDERLINE" as const

  constructor(
    editor: InteractiveInkEditor,
    helpers: GestureHelpers
  )
  {
    super(editor, helpers)
    this.#logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }

    switch (this.helpers.underlineAction) {
      case UnderlineAction.Draw:
        await this.applyDraw(gestureStroke, gesture)
        break
      case UnderlineAction.Thicken:
        await this.applyThicken(gesture)
        break
      default:
        this.#logger.warn("applyUnderlineGesture", `Unknown underlineAction: ${ this.helpers.underlineAction }`)
        break
    }
  }

  private async applyDraw(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    const changes: TIIHistoryChanges = { decorator: [] }
    const symbolIdSet = new Set<string>()

    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && this.helpers.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
        const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

        // Apply decorator on words for IIRecognizedText, or on symbol level for others
        if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Underline)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIdSet.add(symWithDec.id)
            const underline = new IIDecorator(DecoratorKind.Underline, this.editor.penStyle)
            changes.decorator?.push({ symbol: symWithDec, decorator: underline, added: true })
          }
        } else {
          const underline = new IIDecorator(DecoratorKind.Underline, this.editor.penStyle)
          const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Underline)
          const added = index === -1
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          added ? symWithDec.decorators.push(underline) : symWithDec.decorators.splice(index, 1)
          this.model.updateSymbol(symWithDec)
          this.renderer.drawSymbol(symWithDec)
          changes.decorator?.push({ symbol: symWithDec, decorator: underline, added })
          symbolIdSet.add(symWithDec.id)
        }
      }
    })

    if (changes.decorator?.length) {
      this.history.push(this.model, changes)
    }
  }

  private async applyThicken(gesture: TGesture): Promise<void>
  {
    const symbolsToThicken: TIISymbol[] = []

    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && !symbolsToThicken.some(s => s.id === sym.id)) {
        const currentWidth = sym.style.width || 1
        const newWidth = currentWidth * 2
        this.editor.updateSymbolsStyle([sym.id], { width: newWidth }, false)
        symbolsToThicken.push(sym)
      }
    })

    if (symbolsToThicken.length) {
      const changes: TIIHistoryChanges = {
        style: { symbols: symbolsToThicken }
      }
      this.history.push(this.model, changes)
    }
  }
}
