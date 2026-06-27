import type { TStroke} from "@/symbol";
import { DecoratorKind } from "@/symbol"
import { BoxHelper } from "@/symbol/primitives/Box"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
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

  constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers)
  {
    super(editor, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>
  {
    this.logger.info("applySurroundGesture", { gestureStroke, gesture })
    const ids = this.model.symbols.filter(s => BoxHelper.contains(gestureStroke.bounds, s.bounds)).map(s => s.id)

    switch (this.manager.surroundAction) {
      case SurroundAction.Select:
        await this.processor.apply(ids, { kind: "select" })
        break
      case SurroundAction.Highlight: {
        const changes = await this.processor.apply(ids, { kind: "decorator", decoratorKind: DecoratorKind.Highlight })
        if (changes) this.history.push(this.model, changes)
        break
      }
      case SurroundAction.Surround: {
        const changes = await this.processor.apply(ids, { kind: "decorator", decoratorKind: DecoratorKind.Surround })
        if (changes) this.history.push(this.model, changes)
        break
      }
      default:
        this.logger.error("applySurroundGesture", `Unknown surroundAction: ${ this.manager.surroundAction }`)
        break
    }
  }
}
