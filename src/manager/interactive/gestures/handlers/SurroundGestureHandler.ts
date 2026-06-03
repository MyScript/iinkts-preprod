import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { EditorTool } from "@/Constants"
import { IIDecorator, IIStroke, SymbolType, IIText, DecoratorKind, IIRecognizedText, RecognizedKind } from "@/symbol"
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

    switch (this.helpers.surroundAction) {
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
        this.#logger.error("applySurroundGesture", `Unknown surroundAction: ${ this.helpers.surroundAction }`)
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

  private async applyHighlight(ids: string[], gestureStroke: IIStroke): Promise<Array<{ symbol: IIText | IIStroke | IIRecognizedText, decorator: IIDecorator, added: boolean }>>
  {
    const decoratorChanges: Array<{ symbol: IIText | IIStroke | IIRecognizedText, decorator: IIDecorator, added: boolean }> = []
    const symbolIdSet = new Set<string>()

    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && this.helpers.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
        const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

        // Apply decorator on words for IIRecognizedText, or on symbol level for others
        if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Highlight)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIdSet.add(symWithDec.id)
            const highlight = new IIDecorator(DecoratorKind.Highlight, this.editor.penStyle)
            decoratorChanges.push({ symbol: symWithDec, decorator: highlight, added: true })
          }
        } else {
          const highlight = new IIDecorator(DecoratorKind.Highlight, this.editor.penStyle)
          const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Highlight)
          const added = index === -1
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          added ? symWithDec.decorators.push(highlight) : symWithDec.decorators.splice(index, 1)
          this.model.updateSymbol(symWithDec)
          this.renderer.drawSymbol(symWithDec)
          symbolIdSet.add(symWithDec.id)
          decoratorChanges.push({ symbol: symWithDec, decorator: highlight, added })
        }
      }
    })

    return decoratorChanges
  }

  private async applySurround(ids: string[], gestureStroke: IIStroke): Promise<Array<{ symbol: IIText | IIStroke | IIRecognizedText, decorator: IIDecorator, added: boolean }>>
  {
    const decoratorChanges: Array<{ symbol: IIText | IIStroke | IIRecognizedText, decorator: IIDecorator, added: boolean }> = []
    const symbolIdSet = new Set<string>()

    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && this.helpers.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
        const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

        // Apply decorator on words for IIRecognizedText, or on symbol level for others
        if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
          const modified = this.helpers.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Surround)
          if (modified) {
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIdSet.add(symWithDec.id)
            const surround = new IIDecorator(DecoratorKind.Surround, this.editor.penStyle)
            decoratorChanges.push({ symbol: symWithDec, decorator: surround, added: true })
          }
        } else {
          const surround = new IIDecorator(DecoratorKind.Surround, this.editor.penStyle)
          const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Surround)
          const added = index === -1
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          added ? symWithDec.decorators.push(surround) : symWithDec.decorators.splice(index, 1)
          this.model.updateSymbol(symWithDec)
          this.renderer.drawSymbol(symWithDec)
          decoratorChanges.push({ symbol: symWithDec, decorator: surround, added })
          symbolIdSet.add(symWithDec.id)
        }
      }
    })

    return decoratorChanges
  }
}
