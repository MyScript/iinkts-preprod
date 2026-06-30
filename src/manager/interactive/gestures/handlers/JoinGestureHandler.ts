import type { TStroke, TText} from "@/symbol";
import { type TSymbol, isText, cloneSymbol } from "@/symbol"
import { TextOps } from "@/symbol/text/Text"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps } from "@/symbol/primitives/OBB"
import type { TIIHistoryChanges } from "@/history"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"
import { MatrixTransform } from "@/transform"

/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * @group Manager
 */
export class JoinGestureHandler extends GestureHandler
{
  readonly gestureType = "JOIN" as const

  constructor(
    editor: TInteractiveInkEditor,
    helpers: GestureHelpers
  )
  {
    super(editor, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void>
  {
    this.logger.debug("applyJoinGesture", { gestureStroke, gesture })

    const symbolsAbove = this.model.symbols.filter(s => this.model.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))

    const symbolsBeforeGestureInRow = symbolsRow.filter(s => s.bounds.center.x + s.bounds.width / 2 <= gestureStroke.bounds.center.x)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => s.bounds.center.x - s.bounds.width / 2 > gestureStroke.bounds.center.x)
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const changes: TIIHistoryChanges = {}
    const translate: { symbols: TSymbol[], tx: number, ty: number }[] = []

    if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = this.model.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfter = this.model.getFirstSymbol(symbolsAfterGestureInRow)!

      let lastXBefore = symbolsBeforeGestureInRow[0].bounds.center.x + symbolsBeforeGestureInRow[0].bounds.width / 2
      for (let i = 1; i < symbolsBeforeGestureInRow.length; i++) {
        const xMax = symbolsBeforeGestureInRow[i].bounds.center.x + symbolsBeforeGestureInRow[i].bounds.width / 2
        if (xMax > lastXBefore) lastXBefore = xMax
      }
      let firstXAfter = symbolsAfterGestureInRow[0].bounds.center.x - symbolsAfterGestureInRow[0].bounds.width / 2
      for (let i = 1; i < symbolsAfterGestureInRow.length; i++) {
        const xMin = symbolsAfterGestureInRow[i].bounds.center.x - symbolsAfterGestureInRow[i].bounds.width / 2
        if (xMin < firstXAfter) firstXAfter = xMin
      }
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = cloneSymbol(lastSymbBefore)
      const firstSymbolAfterClone = cloneSymbol(firstSymbolAfter)
      this.manager.translator.applyToSymbol(firstSymbolAfterClone, MatrixTransform.identity().translate(translateX, 0))

      if (isText(lastSymbBefore) && isText(firstSymbolAfter)) {
        const texts = [lastSymbBeforeClone as TText, firstSymbolAfterClone as TText]
        const text = TextOps.create(texts.flatMap(s => s.chars), texts[0].point, BoxOps.createFromBoxes(texts.map(t => OBBOps.toBox(t.bounds))))
        this.editor.typeset.setBounds(text)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [text]
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
        if (this.model.roundToLineGuide(lastSymbolBeforeGesture.bounds.center.y) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.center.y - this.rowHeight)) {
          const symbolInNextRow = symbolsBelow.filter(s => this.model.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX = lastSymbolBeforeGesture.bounds.center.x + lastSymbolBeforeGesture.bounds.width / 2 + this.strokeSpaceWidth - (firstSymbolAfterGesture.bounds.center.x - firstSymbolAfterGesture.bounds.width / 2)
            translate.push({ symbols: symbolInNextRow, tx: translateX, ty: -this.rowHeight })
          }
          const symbolsAfterNextRow = symbolsBelow.filter(s => this.model.isSymbolBelow(firstSymbolAfterGesture, s))
          if (symbolsAfterNextRow.length) {
            translate.push({ symbols: symbolsAfterNextRow, tx: 0, ty: -this.rowHeight })
          }
        }
      }
      else {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.rowHeight })
      }
    }
    else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.model.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.model.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        if (this.model.roundToLineGuide(lastSymbolAbove.bounds.center.y) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.center.y - this.rowHeight)) {
          const translateX = lastSymbolAbove.bounds.center.x + lastSymbolAbove.bounds.width / 2 + this.strokeSpaceWidth - (firstSymbolAfterGesture.bounds.center.x - firstSymbolAfterGesture.bounds.width / 2)
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: -this.rowHeight })
        }
        else {
          translate.push({ symbols: symbolsAfterGestureInRow, tx: 0, ty: -this.rowHeight })
        }

        if (symbolsBelow.length) {
          translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.rowHeight })
        }
      }
      else {
        translate.push({ symbols: symbolsAfterGestureInRow.concat(...symbolsBelow), tx: 0, ty: -this.rowHeight })
      }

    }

    if (changes.replaced?.oldSymbols.length) {
      await this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (translate.length) {
      changes.translate = translate
      await Promise.all(translate.map(tr => this.manager.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
    }
    this.history.push(this.model, changes)
  }
}
