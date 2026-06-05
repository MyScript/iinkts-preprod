import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIStroke, IIText, type TIISymbol, isText, SymbolType, Box, TPoint } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import { computeAverage, isBetween } from "@/utils"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/GestureTypes"
import { InsertAction } from "@/manager/interactive/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Manager
 */
export class InsertGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "INSERT" as const

  constructor(
    editor: InteractiveInkEditor,
    helpers: GestureHelpers
  )
  {
    super(editor, helpers)
    this.#logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
  }

  /**
   * Create strokes from gesture substrokes
   * Reconstructs pointers with pressure and time information
   * @param strokeOrigin - The original stroke to get style and pointer info
   * @param subStrokes - Array of substroke data (x,y coordinates)
   * @returns Array of new strokes
   */
  createStrokesFromGestureSubStroke(strokeOrigin: IIStroke, subStrokes: { x: number[], y: number[] }[]): IIStroke[]
  {
    const strokes: IIStroke[] = []
    if (subStrokes[0]) {
      const subStroke = new IIStroke(strokeOrigin.style)
      subStrokes[0].x.forEach((x, i) =>
      {
        subStroke.pointers.push({
          x,
          y: subStrokes[0].y[i],
          p: strokeOrigin.pointers.at(i)?.p || 1,
          t: strokeOrigin.pointers.at(i)?.t || Math.max(...subStroke.pointers.map(p => p.t + 20))
        })
      })
      strokes.push(subStroke)
    }
    if (subStrokes[1]) {
      const subStroke = new IIStroke(strokeOrigin.style)
      subStrokes[1].x.forEach((x, i) =>
      {
        subStroke.pointers.push({
          x,
          y: subStrokes[1].y[i],
          p: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.p || 1,
          t: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.t || Math.max(...subStroke.pointers.map(p => p.t + 20))
        })
      })
      strokes.push(subStroke)
    }
    return strokes
  }

  /**
   * Compute split stroke into before/after parts
   * Applies translation to the "after" stroke
   * @param strokeOrigin - The original stroke to split
   * @param subStrokes - Array of substroke data
   * @returns Object with optional before and after strokes
   */
  computeSplitStroke(
    strokeOrigin: IIStroke,
    subStrokes: { x: number[], y: number[] }[]
  ): { before?: IIStroke, after?: IIStroke }
  {
    let after: IIStroke | undefined
    const newStrokes = this.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

    if (newStrokes[1]) {
      after = newStrokes[1]
      this.translator.applyToSymbol(after, this.strokeSpaceWidth, 0)
    }
    return {
      before: newStrokes[0],
      after
    }
  }

  /**
   * Compute changes needed when splitting a stroke
   * Handles both simple Stroke symbols and Recognized symbols with child strokes
   * @param gestureStroke - The gesture stroke
   * @param strokeIdToSplit - ID of the stroke to split
   * @param subStrokes - Substroke data
   * @returns History changes object with translate and replaced arrays
   */
  computeChangesOnSplitStroke(
    gestureStroke: IIStroke,
    strokeIdToSplit: string,
    subStrokes: { fullStrokeId: string, x: number[], y: number[] }[]
  ): TIIHistoryChanges
  {
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(s =>
      gestureStroke.id !== s.id &&
      this.model.isSymbolInRow(gestureStroke, s) &&
      gestureStroke.bounds.xMid < s.bounds.xMin
    )

    const symbolToSplit = this.model.getRootSymbol(strokeIdToSplit)
    if (symbolToSplit?.type === SymbolType.Stroke) {
      const newStrokes = this.computeSplitStroke(symbolToSplit, subStrokes)
      if (newStrokes.before) {
        replaced.newSymbols.push(newStrokes.before)
      }
      if (newStrokes.after) {
        replaced.newSymbols.push(newStrokes.after)
      }
      replaced.oldSymbols.push(symbolToSplit)
    }
    if (symbolsAfterGestureInRow.length) {
      translate.push({ symbols: symbolsAfterGestureInRow, tx: this.strokeSpaceWidth, ty: 0 })
    }

    return {
      translate,
      replaced
    }
  }

  /**
   * Compute changes when splitting a Text symbol
   * @param gestureStroke - The gesture stroke
   * @param textToSplit - The text symbol to split
   * @param insertAction - The insert action mode
   * @returns History changes object
   */
  computeChangesOnSplitText(
    gestureStroke: IIStroke,
    textToSplit: IIText,
    insertAction: InsertAction
  ): TIIHistoryChanges
  {
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(s =>
      gestureStroke.id !== s.id &&
      this.model.isSymbolInRow(gestureStroke, s) &&
      gestureStroke.bounds.xMid < s.bounds.xMin
    )
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const charsBefore = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 <= gestureStroke.bounds.xMid)
    const charsAfter = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 > gestureStroke.bounds.xMid)
    const newTexts: IIText[] = []
    if (charsBefore.length && charsAfter.length) {
      const textBefore = new IIText(charsBefore, textToSplit.point, Box.createFromBoxes(charsBefore.map(c => c.bounds)))
      this.texter.setBounds(textBefore)
      newTexts.push(textBefore)

      let pointAfter: TPoint
      if (insertAction === InsertAction.LineBreak) {
        // For line break, position at start of next line
        pointAfter = {
          x: textToSplit.point.x,
          y: textToSplit.point.y + this.rowHeight
        }
      } else {
        // For insert, add horizontal space
        pointAfter = {
          x: textBefore.point.x + textBefore.bounds.width + this.texter.getSpaceWidth(computeAverage(textBefore.chars.map(c => c.fontSize))),
          y: textBefore.point.y
        }
      }
      const textAfter = new IIText(charsAfter, pointAfter, Box.createFromBoxes(charsAfter.map(c => c.bounds)))
      this.texter.setBounds(textAfter)
      newTexts.push(textAfter)
      replaced.newSymbols = newTexts
      replaced.oldSymbols = [textToSplit]
    }

    // Handle other symbols based on insert action
    if (insertAction === InsertAction.LineBreak) {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== gestureStroke.id), tx: 0, ty: this.rowHeight })
      }
      if (symbolsBelow.length) {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: this.rowHeight })
      }
    } else {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== gestureStroke.id), tx: this.strokeSpaceWidth, ty: 0 })
      }
    }

    return {
      translate,
      replaced
    }
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gestureStroke, gesture })

    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))
    const textToSplit = symbolsRow.find(s => isText(s) && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as IIText | undefined
    const symbolsBeforeGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid > s.bounds.xMax)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid < s.bounds.xMin)

    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))


    let changes: TIIHistoryChanges | undefined
    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      changes = this.computeChangesOnSplitStroke(gestureStroke, gesture.strokeIds[0], gesture.subStrokes)
    }
    else if (textToSplit) {
      changes = this.computeChangesOnSplitText(gestureStroke, textToSplit, this.manager.insertAction)
    }
    else if (symbolsAfterGestureInRow.length) {
      const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        translateX = Math.min(...symbolsBeforeGestureInRow.map(s => s.bounds.xMin)) - Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
      }

      switch (this.manager.insertAction) {
        case InsertAction.LineBreak:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: this.manager.rowHeight })
          if (symbolsBelow.length) {
            translate.push({ symbols: symbolsBelow, tx: 0, ty: this.manager.rowHeight })
          }
          break
        case InsertAction.Insert:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: this.manager.strokeSpaceWidth * 2, ty: 0 })
          break
      }
      changes = { translate }
    }
    else if (symbolsBeforeGestureInRow.length && symbolsBelow.length && this.manager.insertAction === InsertAction.LineBreak) {
      changes = { translate: [{ symbols: symbolsBelow, tx: 0, ty: this.manager.rowHeight }] }
    }

    if (changes) {
      this.history.push(this.model, changes)
      const promises: Promise<void>[] = []
      if (changes.translate?.length) {
        promises.push(...changes.translate.map(tr => this.manager.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
      }
      if (changes.replaced?.newSymbols.length) {
        promises.push(this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false))
      }
      await Promise.all(promises)
    }
  }
}
