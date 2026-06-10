import { EditorTool } from "@/Constants"
import { IIStroke, DecoratorKind } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { SurroundAction } from "@/manager/interactive/gestures/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for SURROUND gesture type
 * Supports three actions: Select, Highlight, and Surround
 * @group Manager
 */
export class SurroundGestureHandler extends GestureHandler
{
  readonly gestureType = "SURROUND" as const

  constructor(editor: InteractiveInkEditor, helpers: GestureHelpers)
  {
    super(editor, helpers)
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.logger.info("applySurroundGesture", { gestureStroke, gesture })
    const changes: TIIHistoryChanges = {}
    const ids = this.model.symbols.filter(s => gestureStroke.bounds.contains(s.bounds)).map(s => s.id)

    switch (this.manager.surroundAction) {
      case SurroundAction.Select:
        if (ids.length) {
          this.editor.tool = EditorTool.Select
          this.editor.select(ids)
        }
        break
      case SurroundAction.Highlight:
        changes.decorator = this.applyDecoratorToIds(ids, gestureStroke, DecoratorKind.Highlight)
        if (changes.decorator?.length) {
          this.history.push(this.model, changes)
        }
        break
      case SurroundAction.Surround:
        changes.decorator = this.applyDecoratorToIds(ids, gestureStroke, DecoratorKind.Surround)
        this.history.push(this.model, changes)
        break
      default:
        this.logger.error("applySurroundGesture", `Unknown surroundAction: ${ this.manager.surroundAction }`)
        break
    }
  }
}
