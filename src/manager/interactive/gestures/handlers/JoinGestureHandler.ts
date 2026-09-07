import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { BoxOps, MatrixTransform, OBBOps } from "@/core/geometry"
import { roundTo } from "@/core/math"
import type { TIIHistoryChanges } from "@/history"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import type { TStroke, TText } from "@/symbol"
import { cloneSymbol, isText, type TSymbol } from "@/symbol"
import { TextOps } from "@/symbol/typeset/Text"
import { SymbolGeometry } from "@/symbol-utils/SymbolGeometry"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"
/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * @group Manager
 */
export class JoinGestureHandler extends GestureHandler {
  readonly gestureType = "JOIN" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyJoinGesture", {
      gestureStroke,
      gesture,
    })

    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of
    // throwing. Every set derived below is a subset of these three, so gating here keeps every
    // later geometry read in this method safe without repeating the check on each of them.
    const isRegistered = (s: TSymbol) => symbolRegistry.has(s.type)
    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)

    const symbolsAbove = this.model.symbols.filter((s) => isRegistered(s) && this.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(
      (s) => isRegistered(s) && gestureStroke.id !== s.id && this.isSymbolInRow(gestureStroke, s)
    )

    const symbolsBeforeGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x + b.width / 2 <= gestureBounds.center.x
    })
    const symbolsAfterGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x - b.width / 2 > gestureBounds.center.x
    })
    const symbolsBelow = this.model.symbols.filter((s) => isRegistered(s) && this.isSymbolBelow(gestureStroke, s))

    const changes: TIIHistoryChanges = {}
    const translate: {
      symbols: TSymbol[]
      tx: number
      ty: number
    }[] = []

    if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = this.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfter = this.getFirstSymbol(symbolsAfterGestureInRow)!

      const firstBeforeBounds = SymbolGeometry.boundsOf(symbolsBeforeGestureInRow[0])
      let lastXBefore = firstBeforeBounds.center.x + firstBeforeBounds.width / 2
      for (let i = 1; i < symbolsBeforeGestureInRow.length; i++) {
        const b = SymbolGeometry.boundsOf(symbolsBeforeGestureInRow[i])
        const xMax = b.center.x + b.width / 2
        if (xMax > lastXBefore) {
          lastXBefore = xMax
        }
      }
      const firstAfterBounds = SymbolGeometry.boundsOf(symbolsAfterGestureInRow[0])
      let firstXAfter = firstAfterBounds.center.x - firstAfterBounds.width / 2
      for (let i = 1; i < symbolsAfterGestureInRow.length; i++) {
        const b = SymbolGeometry.boundsOf(symbolsAfterGestureInRow[i])
        const xMin = b.center.x - b.width / 2
        if (xMin < firstXAfter) {
          firstXAfter = xMin
        }
      }
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = cloneSymbol(lastSymbBefore)
      const firstSymbolAfterClone = cloneSymbol(firstSymbolAfter)
      this.manager.translator.applyToSymbol(firstSymbolAfterClone, MatrixTransform.identity().translate(translateX, 0))

      if (isText(lastSymbBefore) && isText(firstSymbolAfter)) {
        const texts = [lastSymbBeforeClone as TText, firstSymbolAfterClone as TText]
        const text = TextOps.create(
          texts.flatMap((s) => s.chars),
          texts[0].point,
          BoxOps.createFromBoxes(texts.map((t) => OBBOps.toBox(SymbolGeometry.boundsOf(t))))
        )
        this.canvas.typeset.setBounds(text)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [text],
        }
      }

      const rest = symbolsAfterGestureInRow.filter((s) => s.id !== firstSymbolAfter.id)
      if (rest.length) {
        translate.push({
          symbols: rest,
          tx: translateX,
          ty: 0,
        })
      }
    } else if (symbolsBeforeGestureInRow.length) {
      const lastSymbolBeforeGesture = this.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsBelow)
      if (firstSymbolAfterGesture) {
        const lastBeforeBounds = SymbolGeometry.boundsOf(lastSymbolBeforeGesture)
        const firstAfterBounds = SymbolGeometry.boundsOf(firstSymbolAfterGesture)
        if (
          roundTo(lastBeforeBounds.center.y, this.rowHeight) >=
          roundTo(firstAfterBounds.center.y - this.rowHeight, this.rowHeight)
        ) {
          const symbolInNextRow = symbolsBelow.filter((s) => this.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX =
              lastBeforeBounds.center.x +
              lastBeforeBounds.width / 2 +
              this.strokeSpaceWidth -
              (firstAfterBounds.center.x - firstAfterBounds.width / 2)
            translate.push({
              symbols: symbolInNextRow,
              tx: translateX,
              ty: -this.rowHeight,
            })
          }
          const symbolsAfterNextRow = symbolsBelow.filter((s) => this.isSymbolBelow(firstSymbolAfterGesture, s))
          if (symbolsAfterNextRow.length) {
            translate.push({
              symbols: symbolsAfterNextRow,
              tx: 0,
              ty: -this.rowHeight,
            })
          }
        }
      } else {
        translate.push({
          symbols: symbolsBelow,
          tx: 0,
          ty: -this.rowHeight,
        })
      }
    } else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        const lastAboveBounds = SymbolGeometry.boundsOf(lastSymbolAbove)
        const firstAfterBounds = SymbolGeometry.boundsOf(firstSymbolAfterGesture)
        if (
          roundTo(lastAboveBounds.center.y, this.rowHeight) >=
          roundTo(firstAfterBounds.center.y - this.rowHeight, this.rowHeight)
        ) {
          const translateX =
            lastAboveBounds.center.x +
            lastAboveBounds.width / 2 +
            this.strokeSpaceWidth -
            (firstAfterBounds.center.x - firstAfterBounds.width / 2)
          translate.push({
            symbols: symbolsAfterGestureInRow,
            tx: translateX,
            ty: -this.rowHeight,
          })
        } else {
          translate.push({
            symbols: symbolsAfterGestureInRow,
            tx: 0,
            ty: -this.rowHeight,
          })
        }

        if (symbolsBelow.length) {
          translate.push({
            symbols: symbolsBelow,
            tx: 0,
            ty: -this.rowHeight,
          })
        }
      } else {
        translate.push({
          symbols: symbolsAfterGestureInRow.concat(...symbolsBelow),
          tx: 0,
          ty: -this.rowHeight,
        })
      }
    }

    if (changes.replaced?.oldSymbols.length) {
      await this.canvas.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (translate.length) {
      changes.translate = translate
      await Promise.all(translate.map((tr) => this.manager.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
    }
    this.history.push(changes)
  }
}
