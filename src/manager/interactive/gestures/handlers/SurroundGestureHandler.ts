import type { TInteractiveInkCanvas } from "@/canvas"
import { OBBOps } from "@/core"
import type { TStroke } from "@/symbol"
import { DecoratorKind } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { SurroundAction } from "../GestureTypes"
/**
 * Handler for SURROUND gesture type
 * Supports three actions: Select, Highlight, and Surround
 * @group Manager
 */
export class SurroundGestureHandler extends GestureHandler {
  readonly gestureType = "SURROUND" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.info("applySurroundGesture", {
      gestureStroke,
      gesture,
    })
    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)
    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of throwing.
    const ids = this.model.symbols
      .filter((s) => symbolRegistry.has(s.type) && OBBOps.contains(gestureBounds, SymbolGeometry.boundsOf(s)))
      .map((s) => s.id)

    switch (this.manager.surroundAction) {
      case SurroundAction.Select:
        await this.processor.apply(ids, {
          kind: "select",
        })
        break
      case SurroundAction.Highlight:
        await this.decorate(ids, DecoratorKind.Highlight)
        break
      case SurroundAction.Surround:
        await this.decorate(ids, DecoratorKind.Surround)
        break
      default:
        this.logger.error("applySurroundGesture", `Unknown surroundAction: ${this.manager.surroundAction}`)
        break
    }
  }

  /** One decorator around everything the gesture encloses, not one per word */
  protected async decorate(ids: string[], decoratorKind: DecoratorKind): Promise<void> {
    const changes = await this.processor.apply(ids, { kind: "decorator", decoratorKind, group: true })
    if (changes) {
      this.history.push(changes)
    }
  }
}
