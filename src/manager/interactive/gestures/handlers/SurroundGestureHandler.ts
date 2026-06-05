import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { EditorTool } from "@/Constants"
import { IIDecorator, IIStroke, IIText, DecoratorKind, isRecognizedText, isText } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/GestureTypes"
import { SurroundAction } from "@/manager/interactive/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for SURROUND gesture type
 * Supports three actions: Select, Highlight, and Surround
 * @group Manager
 */
export class SurroundGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "SURROUND" as const

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
    this.#logger.info("applySurroundGesture", { gestureStroke, gesture })
    const changes: TIIHistoryChanges = {}
    const ids = this.model.symbols.filter(s => gestureStroke.bounds.contains(s.bounds)).map(s => s.id)

    switch (this.manager.surroundAction) {
      case SurroundAction.Select:
        await this.applySelect(ids)
        break
      case SurroundAction.Highlight:
        changes.decorator = await this.applyHighlight(ids, gestureStroke)
        if (changes.decorator?.length) {
          this.history.push(this.model, changes)
        }
        break
      case SurroundAction.Surround:
        changes.decorator = await this.applySurround(ids, gestureStroke)
        this.history.push(this.model, changes)
        break
      default:
        this.#logger.error("applySurroundGesture", `Unknown surroundAction: ${ this.manager.surroundAction }`)
        break
    }
  }

  private async applySelect(ids: string[]): Promise<void>
  {
    if (ids.length) {
      this.editor.tool = EditorTool.Select
      this.editor.select(ids)
    }
  }

  private async applyHighlight(ids: string[], gestureStroke: IIStroke): Promise<Array<{ symbol: IIText | IIStroke, decorator: IIDecorator, added: boolean }>>
  {
    const decoratorChanges: Array<{ symbol: IIText | IIStroke, decorator: IIDecorator, added: boolean }> = []
    const symbolIdSet = new Set<string>()

    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && this.helpers.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
        const symWithDec = sym as (IIText | IIStroke)

        // Apply decorator on words for recognized text strokes, or on symbol level for others
        if (isRecognizedText(symWithDec) || isText(symWithDec)) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIStroke), gestureStroke, DecoratorKind.Highlight)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIdSet.add(symWithDec.id)
            const highlight = new IIDecorator(DecoratorKind.Highlight, this.editor.penStyle)
            decoratorChanges.push({ symbol: symWithDec, decorator: highlight, added: true })
          }
        }
      }
    })

    return decoratorChanges
  }

  private async applySurround(ids: string[], gestureStroke: IIStroke): Promise<Array<{ symbol: IIText | IIStroke, decorator: IIDecorator, added: boolean }>>
  {
    const decoratorChanges: Array<{ symbol: IIText | IIStroke, decorator: IIDecorator, added: boolean }> = []
    const symbolIdSet = new Set<string>()

    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && this.helpers.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
        const symWithDec = sym as (IIText | IIStroke)

        // Apply decorator on words for recognized text strokes, or on symbol level for others
        if (isRecognizedText(symWithDec) || isText(symWithDec)) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIStroke), gestureStroke, DecoratorKind.Surround)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIdSet.add(symWithDec.id)
            const surround = new IIDecorator(DecoratorKind.Surround, this.editor.penStyle)
            decoratorChanges.push({ symbol: symWithDec, decorator: surround, added: true })
          }
        }
      }
    })

    return decoratorChanges
  }
}
