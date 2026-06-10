import { IIStroke, DecoratorKind, type TIISymbol } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { UnderlineAction } from "@/manager/interactive/gestures/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (increase stroke width)
 * @group Manager
 */
export class UnderlineGestureHandler extends GestureHandler
{
  readonly gestureType = "UNDERLINE" as const

  constructor(editor: InteractiveInkEditor, helpers: GestureHelpers)
  {
    super(editor, helpers)
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.logger.debug("applyUnderlineGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }

    switch (this.manager.underlineAction) {
      case UnderlineAction.Draw: {
        const decorators = this.applyDecoratorToIds(gesture.strokeIds, gestureStroke, DecoratorKind.Underline)
        if (decorators.length) {
          const changes: TIIHistoryChanges = { decorator: decorators }
          this.history.push(this.model, changes)
        }
        break
      }
      case UnderlineAction.Thicken:
        await this.applyThicken(gesture)
        break
      default:
        this.logger.warn("applyUnderlineGesture", `Unknown underlineAction: ${ this.manager.underlineAction }`)
        break
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
