import { LoggerManager, LoggerCategory, type Logger } from "../../../../logger"
import { IIStroke, SymbolType, IIText, IIRecognizedText, type TIISymbol } from "../../../../symbol"
import { TIIHistoryChanges } from "../../../../history"
import { isBetween } from "../../../../utils"
import type { InteractiveInkEditor } from "../../../../editor"
import type { TGesture } from "../../IIGestureManager"
import { InsertAction } from "../../IIGestureManager"
import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"

/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Gesture/Handler
 */
export class InsertGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "INSERT" as const
  private insertAction: InsertAction

  constructor(
    editor: InteractiveInkEditor,
    helpers: GestureHelpers,
    insertAction: InsertAction
  )
  {
    super(editor, helpers)
    this.#logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
    this.insertAction = insertAction
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gestureStroke, gesture })

    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))
    const textToSplit = symbolsRow.find(s => s.type === SymbolType.Text && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as IIText | undefined
    const strokeTextToSplit = symbolsRow.find(s => s.type === SymbolType.Recognized && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as IIRecognizedText | undefined

    const symbolsBeforeGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid > s.bounds.xMax)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid < s.bounds.xMin)

    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))


    let changes: TIIHistoryChanges | undefined
    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      changes = this.helpers.computeChangesOnSplitStroke(gestureStroke, gesture.strokeIds[0], gesture.subStrokes)
    }
    else if (textToSplit) {
      changes = this.helpers.computeChangesOnSplitText(gestureStroke, textToSplit, this.insertAction)
    }
    else if (strokeTextToSplit) {
      changes = this.helpers.computeChangesOnSplitStrokeText(gestureStroke, strokeTextToSplit, this.insertAction)
    }
    else if (symbolsAfterGestureInRow.length) {
      const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        translateX = Math.min(...symbolsBeforeGestureInRow.map(s => s.bounds.xMin)) - Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
      }

      switch (this.insertAction) {
        case InsertAction.LineBreak:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: this.helpers.rowHeight })
          if (symbolsBelow.length) {
            translate.push({ symbols: symbolsBelow, tx: 0, ty: this.helpers.rowHeight })
          }
          break
        case InsertAction.Insert:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: this.helpers.strokeSpaceWidth * 2, ty: 0 })
          break
      }
      changes = { translate }
    }
    else if (symbolsBeforeGestureInRow.length && symbolsBelow.length && this.insertAction === InsertAction.LineBreak) {
      changes = { translate: [{ symbols: symbolsBelow, tx: 0, ty: this.helpers.rowHeight }] }
    }

    if (changes) {
      this.history.push(this.model, changes)
      const promises: Promise<void>[] = []
      if (changes.translate?.length) {
        promises.push(...changes.translate.map(tr => this.helpers.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
      }
      if (changes.replaced?.newSymbols.length) {
        promises.push(this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false))
      }
      await Promise.all(promises)
    }
  }
}
