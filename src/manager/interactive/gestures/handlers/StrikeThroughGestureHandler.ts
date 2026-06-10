import { type TIISymbol } from "@/symbol"
import { DecoratorKind, IIStroke } from "@/symbol"
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
  readonly gestureType = "STRIKETHROUGH" as const

  constructor(editor: InteractiveInkEditor, helpers: GestureHelpers)
  {
    super(editor, helpers)
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>
  {
    this.logger.debug("applyStrikeThroughGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }

    switch (this.manager.strikeThroughAction) {
      case StrikeThroughAction.Draw: {
        const decorators = this.applyDecoratorToIds(gesture.strokeIds, gestureStroke, DecoratorKind.Strikethrough)
        if (decorators.length) {
          const changes: TIIHistoryChanges = { decorator: decorators }
          this.history.push(this.model, changes)
        }
        break
      }
      case StrikeThroughAction.Erase:
        return this.editor.removeSymbols(gesture.strokeIds)
      default:
        this.logger.warn("applyStrikeThroughGesture", `Unknown strikeThroughAction: ${ this.manager.strikeThroughAction }`)
        break
    }
  }
}
