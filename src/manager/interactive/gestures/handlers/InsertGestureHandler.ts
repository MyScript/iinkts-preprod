import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIStroke, IIText, IIRecognizedText, type TIISymbol, isText, isRecognizedText, SymbolType, IIDecorator, Box, TPoint } from "@/symbol"
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
    else if (symbolToSplit?.type === SymbolType.Recognized) {
      const strokesToSplit = symbolToSplit.strokes.find(s => s.id === strokeIdToSplit)!
      const strokesBefore = symbolToSplit.strokes.filter(s => s.id !== strokeIdToSplit && s.bounds.xMid < gestureStroke.bounds.xMid)
      const strokesAfter = symbolToSplit.strokes.filter(s => s.id !== strokeIdToSplit && s.bounds.xMid > gestureStroke.bounds.xMid)
      const newStrokes = this.computeSplitStroke(strokesToSplit, subStrokes)
      if (newStrokes.before) {
        replaced.newSymbols.push(...strokesBefore, newStrokes.before)
      }
      if (newStrokes.after) {
        replaced.newSymbols.push(newStrokes.after, ...strokesAfter)
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
   * Compute changes when splitting a RecognizedText symbol
   * Complex logic handling word-level or stroke-level splits
   * @param gestureStroke - The gesture stroke
   * @param strokeTextToSplit - The RecognizedText symbol to split
   * @param insertAction - The insert action mode (LineBreak or Insert)
   * @returns History changes object
   */
  computeChangesOnSplitStrokeText(
    gestureStroke: IIStroke,
    strokeTextToSplit: IIRecognizedText,
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

    const gestureX = gestureStroke.bounds.xMid
    const gestureY = gestureStroke.bounds.yMid

    // If the recognized text has words with bounds, use them to identify the split point
    if (strokeTextToSplit.words && strokeTextToSplit.words.length > 0 && strokeTextToSplit.words.some(w => w.bounds)) {
      const wordsWithBounds = strokeTextToSplit.words.filter(w => w.bounds)

      // Group words by visual lines based on their Y position
      const lineGroups: { words: typeof wordsWithBounds, yMid: number }[] = []
      const lineTolerance = this.rowHeight / 3

      wordsWithBounds.forEach(word => {
        const wordYMid = word.bounds!.yMid
        let foundLine = false

        for (const line of lineGroups) {
          if (Math.abs(wordYMid - line.yMid) < lineTolerance) {
            line.words.push(word)
            foundLine = true
            break
          }
        }

        if (!foundLine) {
          lineGroups.push({ words: [word], yMid: wordYMid })
        }
      })

      // Sort line groups by Y position (top to bottom)
      lineGroups.sort((a, b) => a.yMid - b.yMid)

      // Find which line the gesture is on (or between lines)
      let splitIndex = -1

      for (let lineIdx = 0; lineIdx < lineGroups.length; lineIdx++) {
        const currentLine = lineGroups[lineIdx]
        const nextLine = lineGroups[lineIdx + 1]

        // Check if gesture is on this line
        const isOnThisLine = Math.abs(gestureY - currentLine.yMid) < lineTolerance

        if (isOnThisLine) {
          // Gesture is on this line - find position within the line
          const lineWords = currentLine.words.sort((a, b) => a.bounds!.xMin - b.bounds!.xMin)

          for (let i = 0; i < lineWords.length; i++) {
            const word = lineWords[i]

            // Check if gesture is after this word
            if (gestureX > word.bounds!.xMax) {
              // Check if there's a next word on the same line
              const nextWordOnLine = lineWords[i + 1]
              if (!nextWordOnLine || gestureX < nextWordOnLine.bounds!.xMin) {
                // Gesture is between this word and next (or after last word on line)
                const wordIndexInFull = wordsWithBounds.indexOf(word)
                splitIndex = wordIndexInFull + 1
                break
              }
            }
          }

          if (splitIndex !== -1) break
        }

        // Check if gesture is between this line and the next
        if (nextLine && !isOnThisLine) {
          const isBetweenLines = gestureY > currentLine.yMid && gestureY < nextLine.yMid

          if (isBetweenLines) {
            // Split after the last word of current line
            const lastWordOfLine = currentLine.words[currentLine.words.length - 1]
            const wordIndexInFull = wordsWithBounds.indexOf(lastWordOfLine)
            splitIndex = wordIndexInFull + 1
            break
          }
        }
      }

      if (splitIndex > 0 && splitIndex < wordsWithBounds.length) {
        // Split at the identified position
        const wordsBefore = wordsWithBounds.slice(0, splitIndex)
        const wordsAfter = wordsWithBounds.slice(splitIndex)

        // Get the bounds of words before and after
        const beforeWordBounds = wordsBefore.map(w => w.bounds!)
        const afterWordBounds = wordsAfter.map(w => w.bounds!)

        // Associate strokes with words
        const strokesBefore = strokeTextToSplit.strokes.filter(s =>
          beforeWordBounds.some(wb => s.bounds.overlaps(wb))
        )
        const strokesAfter = strokeTextToSplit.strokes.filter(s =>
          afterWordBounds.some(wb => s.bounds.overlaps(wb))
        )

        // Handle orphan strokes (not overlapping any word)
        const orphanStrokes = strokeTextToSplit.strokes.filter(s =>
          !strokesBefore.includes(s) && !strokesAfter.includes(s)
        )
        orphanStrokes.forEach(s => {
          if (s.bounds.xMid <= gestureX) {
            strokesBefore.push(s)
          } else {
            strokesAfter.push(s)
          }
        })

        replaced.oldSymbols.push(strokeTextToSplit)

        if (strokesBefore.length) {
          const strokeTextBefore = new IIRecognizedText(strokesBefore.map(s => s.clone()), strokeTextToSplit, strokeTextToSplit.style)
          strokeTextBefore.decorators = strokeTextToSplit.decorators.map(d => new IIDecorator(d.kind, d.style))
          replaced.newSymbols.push(strokeTextBefore)
        }

        if (strokesAfter.length) {
          const strokeTextAfter = new IIRecognizedText(strokesAfter.map(s => s.clone()), strokeTextToSplit, strokeTextToSplit.style)
          strokeTextAfter.decorators = strokeTextToSplit.decorators.map(d => new IIDecorator(d.kind, d.style))
          // Don't translate - keep the strokes at their original positions
          replaced.newSymbols.push(strokeTextAfter)
        }

        // No translation of other symbols needed - the split is within the recognized text
        return { translate, replaced }
      }
    }

    // Fallback to original X-only logic if words are not available or split point not found
    const strokesBefore = strokeTextToSplit.strokes.filter(s => s.bounds.xMid <= gestureX)
    const strokesAfter = strokeTextToSplit.strokes.filter(s => s.bounds.xMid > gestureX)

    replaced.oldSymbols.push(strokeTextToSplit)

    if (strokesBefore.length) {
      const strokeTextBefore = new IIRecognizedText(strokesBefore.map(s => s.clone()), strokeTextToSplit, strokeTextToSplit.style)
      strokeTextBefore.decorators = strokeTextToSplit.decorators.map(d => new IIDecorator(d.kind, d.style))
      replaced.newSymbols.push(strokeTextBefore)
    }

    if (strokesAfter.length) {
      const strokeTextAfter = new IIRecognizedText(strokesAfter.map(s => s.clone()), strokeTextToSplit, strokeTextToSplit.style)
      strokeTextAfter.decorators = strokeTextToSplit.decorators.map(d => new IIDecorator(d.kind, d.style))

      if (insertAction === InsertAction.LineBreak) {
        const minXBefore = strokesBefore.length ? Math.min(...strokesBefore.map(s => s.bounds.xMin)) : 0
        this.translator.applyToSymbol(strokeTextAfter, -strokeTextAfter.bounds.xMin + minXBefore, this.rowHeight)
      } else {
        this.translator.applyToSymbol(strokeTextAfter, this.strokeSpaceWidth, 0)
      }
      replaced.newSymbols.push(strokeTextAfter)
    }

    if (insertAction === InsertAction.LineBreak) {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== strokeTextToSplit.id), tx: 0, ty: this.rowHeight })
      }
      if (symbolsBelow.length) {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: this.rowHeight })
      }
    } else {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== strokeTextToSplit.id), tx: this.strokeSpaceWidth, ty: 0 })
      }
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
    const strokeTextToSplit = symbolsRow.find(s => isRecognizedText(s) && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as IIRecognizedText | undefined

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
    else if (strokeTextToSplit) {
      changes = this.computeChangesOnSplitStrokeText(gestureStroke, strokeTextToSplit, this.manager.insertAction)
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
