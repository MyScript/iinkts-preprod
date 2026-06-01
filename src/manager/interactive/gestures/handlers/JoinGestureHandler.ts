import { LoggerManager, LoggerCategory, type Logger } from "../../../../logger"
import { IIStroke, SymbolType, IIText, Box, IIRecognizedText, type TIISymbol } from "../../../../symbol"
import { TIIHistoryChanges } from "../../../../history"
import type { InteractiveInkEditor } from "../../../../editor"
import type { TGesture } from "../../IIGestureManager"
import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"

/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * @group Gesture/Handler
 */
export class JoinGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "JOIN" as const

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
    this.#logger.debug("applyJoinGesture", { gestureStroke, gesture })

    const symbolsAbove = this.model.symbols.filter(s => this.model.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))

    const symbolsBeforeGestureInRow = symbolsRow.filter(s => s.bounds.xMax <= gestureStroke.bounds.xMid)
    const symbolsOnGestureInRow = symbolsRow.filter(s => s.bounds.xMax > gestureStroke.bounds.xMid && s.bounds.xMin <= gestureStroke.bounds.xMid)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => s.bounds.xMin > gestureStroke.bounds.xMid)
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const changes: TIIHistoryChanges = {}
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []

    if (symbolsOnGestureInRow.length) {
      const symbolToJoin = symbolsOnGestureInRow[0]
      if (symbolToJoin?.type === SymbolType.Recognized) {
        const strokeText = symbolToJoin.clone()
        const childBefore = strokeText.strokes.filter(c => c.bounds.xMid <= gestureStroke.bounds.xMid)
        const childAfter = strokeText.strokes.filter(c => c.bounds.xMid > gestureStroke.bounds.xMid)
        if (childBefore.length && childAfter.length) {
          const tx = Math.max(...childBefore.map(c => c.bounds.xMax)) - Math.min(...childAfter.map(c => c.bounds.xMin))
          childAfter.forEach(c => this.helpers.translator.applyToSymbol(c, tx, 0))
          changes.replaced = {
            oldSymbols: [symbolToJoin],
            newSymbols: [strokeText]
          }
          if (symbolsAfterGestureInRow.length) {
            translate.push({ symbols: symbolsAfterGestureInRow, tx, ty: 0 })
          }
        }
        else if (symbolsAfterGestureInRow.length) {
          const tx = symbolToJoin.bounds.xMax - Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
          translate.push({ symbols: symbolsAfterGestureInRow, tx, ty: 0 })
        }
      }
    }
    else if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = this.model.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfter = this.model.getFirstSymbol(symbolsAfterGestureInRow)!

      let lastXBefore = symbolsBeforeGestureInRow[0].bounds.xMax
      for (let i = 1; i < symbolsBeforeGestureInRow.length; i++) {
        const xMax = symbolsBeforeGestureInRow[i].bounds.xMax
        if (xMax > lastXBefore) lastXBefore = xMax
      }
      let firstXAfter = symbolsAfterGestureInRow[0].bounds.xMin
      for (let i = 1; i < symbolsAfterGestureInRow.length; i++) {
        const xMin = symbolsAfterGestureInRow[i].bounds.xMin
        if (xMin < firstXAfter) firstXAfter = xMin
      }
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = lastSymbBefore.clone()
      const firstSymbolAfterClone = firstSymbolAfter.clone()
      this.helpers.translator.applyToSymbol(firstSymbolAfterClone, translateX, 0)

      if (lastSymbBefore.type === SymbolType.Text && firstSymbolAfter.type === SymbolType.Text) {
        const texts = [lastSymbBeforeClone as IIText, firstSymbolAfterClone as IIText]
        const text = new IIText(texts.flatMap(s => s.chars), texts[0].point, Box.createFromBoxes(texts.map(t => t.bounds)))
        this.helpers.texter.setBounds(text)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [text]
        }
      }
      else if (lastSymbBefore.type === SymbolType.Recognized && firstSymbolAfter.type === SymbolType.Recognized) {
        const strokeTexts = [lastSymbBeforeClone as IIRecognizedText, firstSymbolAfterClone as IIRecognizedText]
        const strokeText = new IIRecognizedText(strokeTexts.flatMap(s => s.strokes), strokeTexts[0], strokeTexts[0].style)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [strokeText]
        }
      }

      const rest = symbolsAfterGestureInRow.filter(s => s.id !== firstSymbolAfter.id)
      if (rest.length) {
        translate.push({ symbols: rest, tx: translateX, ty: 0 })
      }
    }
    else if (symbolsBeforeGestureInRow.length) {
      const lastSymbolBeforeGesture = this.model.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfterGesture = this.model.getFirstSymbol(symbolsBelow)
      if (firstSymbolAfterGesture) {
        if (this.model.roundToLineGuide(lastSymbolBeforeGesture.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.helpers.rowHeight)) {
          const symbolInNextRow = symbolsBelow.filter(s => this.model.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX = lastSymbolBeforeGesture.bounds.xMax + this.helpers.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
            translate.push({ symbols: symbolInNextRow, tx: translateX, ty: -this.helpers.rowHeight })
          }
          const symbolsAfterNextRow = symbolsBelow.filter(s => this.model.isSymbolBelow(firstSymbolAfterGesture, s))
          if (symbolsAfterNextRow.length) {
            translate.push({ symbols: symbolsAfterNextRow, tx: 0, ty: -this.helpers.rowHeight })
          }
        }
      }
      else {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.helpers.rowHeight })
      }
    }
    else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.model.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.model.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        if (this.model.roundToLineGuide(lastSymbolAbove.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.helpers.rowHeight)) {
          const translateX = lastSymbolAbove.bounds.xMax + this.helpers.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: -this.helpers.rowHeight })
        }
        else {
          translate.push({ symbols: symbolsAfterGestureInRow, tx: 0, ty: -this.helpers.rowHeight })
        }

        if (symbolsBelow.length) {
          translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.helpers.rowHeight })
        }
      }
      else {
        translate.push({ symbols: symbolsAfterGestureInRow.concat(...symbolsBelow), tx: 0, ty: -this.helpers.rowHeight })
      }

    }

    if (changes.replaced?.oldSymbols.length) {
      this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (translate.length) {
      changes.translate = translate
      Promise.all(translate.map(tr => this.helpers.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
    }
    this.history.push(this.model, changes)
  }
}
