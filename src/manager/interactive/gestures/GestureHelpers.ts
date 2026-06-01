import { IIModel } from "../../../model"
import
{
  IIDecorator,
  IIStroke,
  SymbolType,
  IIText,
  DecoratorKind,
  TIISymbol,
  Box,
  TPoint,
  IIRecognizedText,
  RecognizedKind,
  isRecognizedTextSymbol,
} from "../../../symbol"
import { RecognizerWebSocket } from "../../../recognizer"
import { SVGRenderer } from "../../../renderer"
import { IIHistoryManager, TIIHistoryChanges } from "../../../history"
import { computeAverage, createUUID } from "../../../utils"
import { IITranslateManager } from "../IITranslateManager"
import { IITextManager } from "../IITextManager"
import type { InteractiveInkEditor } from "../../../editor"
import type { TGesture } from "../IIGestureManager"
import { InsertAction } from "../IIGestureManager"

/**
 * Helper class containing all shared utility methods for gesture handlers
 * Centralizes common functionality to avoid code duplication across handlers
 * @group Gesture/Helpers
 */
export class GestureHelpers
{
  constructor(private editor: InteractiveInkEditor)
  {
  }

  // ==================== ACCESSORS ====================

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  get translator(): IITranslateManager
  {
    return this.editor.translator
  }

  get texter(): IITextManager
  {
    return this.editor.texter
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get strokeSpaceWidth(): number
  {
    return this.editor.configuration.rendering.guides.gap * 2
  }

  // ==================== DECORATOR HELPERS ====================

  /**
   * Check if a symbol can have decorators applied to it
   * @param symbol - The symbol to check
   * @returns true if symbol is Stroke, Text, or RecognizedText
   */
  isDecorable(symbol: TIISymbol): boolean
  {
    return symbol.type === SymbolType.Stroke ||
           symbol.type === SymbolType.Text ||
           isRecognizedTextSymbol(symbol)
  }

  /**
   * Apply decorator on words that intersect with gesture stroke
   * Handles different detection logic based on decorator kind:
   * - Underline: gesture stroke is below the word
   * - Strikethrough: gesture stroke crosses through the middle
   * - Highlight/Surround: gesture stroke overlaps with word
   *
   * @param symbol - The symbol to apply decorator on (IIText or IIRecognizedText)
   * @param gestureStroke - The gesture stroke
   * @param decoratorKind - The kind of decorator to apply
   * @returns true if at least one word was modified, false otherwise
   */
  applyDecoratorOnWords(
    symbol: IIText | IIRecognizedText,
    gestureStroke: IIStroke,
    decoratorKind: DecoratorKind
  ): boolean
  {
    // For IIRecognizedText with words
    if (isRecognizedTextSymbol(symbol)) {
      const recognizedText = symbol

      if (!recognizedText.words || !recognizedText.words.length) {
        // Fallback to text-level decorator if no words
        const decorator = new IIDecorator(decoratorKind, this.editor.penStyle)
        const index = recognizedText.decorators.findIndex(d => d.kind === decoratorKind)
        const added = index === -1
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        added ? recognizedText.decorators.push(decorator) : recognizedText.decorators.splice(index, 1)
        return added
      }

      let modified = false
      recognizedText.words.forEach(word =>
      {
        if (!word.bounds) return

        // Different detection logic based on decorator kind
        let shouldApplyDecorator: boolean
        if (decoratorKind === DecoratorKind.Underline) {
          // For underline: gesture stroke is below the word
          const horizontalOverlap = gestureStroke.bounds.xMax >= word.bounds.xMin &&
                                   gestureStroke.bounds.xMin <= word.bounds.xMax
          const isBelow = gestureStroke.bounds.yMid >= word.bounds.yMin &&
                         gestureStroke.bounds.yMid <= word.bounds.yMax + word.bounds.height * 0.5
          shouldApplyDecorator = horizontalOverlap && isBelow
        } else if (decoratorKind === DecoratorKind.Strikethrough) {
          // For strikethrough: gesture stroke crosses through the middle of the word
          const horizontalOverlap = gestureStroke.bounds.xMax >= word.bounds.xMin &&
                                   gestureStroke.bounds.xMin <= word.bounds.xMax
          const crossesMiddle = gestureStroke.bounds.yMid >= word.bounds.yMin + word.bounds.height * 0.25 &&
                               gestureStroke.bounds.yMid <= word.bounds.yMax - word.bounds.height * 0.25
          shouldApplyDecorator = horizontalOverlap && crossesMiddle
        } else {
          // For highlight, surround: gesture stroke overlaps with word bounds
          shouldApplyDecorator = gestureStroke.bounds.overlaps(word.bounds)
        }

        if (shouldApplyDecorator) {
          if (!word.decorators) {
            word.decorators = []
          }
          const index = word.decorators.findIndex(d => d.kind === decoratorKind)
          const added = index === -1
          if (added) {
            word.decorators.push(new IIDecorator(decoratorKind, this.editor.penStyle))
          } else {
            word.decorators.splice(index, 1)
          }
          modified = true
        }
      })
      return modified
    } else {
      // For IIText or other decorable symbols, apply at symbol level
      const decorator = new IIDecorator(decoratorKind, this.editor.penStyle)
      const index = symbol.decorators.findIndex(d => d.kind === decoratorKind)
      const added = index === -1
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      added ? symbol.decorators.push(decorator) : symbol.decorators.splice(index, 1)
      return added
    }
  }

  // ==================== SCRATCH HELPERS ====================

  /**
   * Compute scratch on strokes by subtracting the gesture stroke
   * @param gesture - The gesture information with subStrokes
   * @param stroke - The stroke to scratch
   * @returns Array of resulting strokes (before/after the scratch)
   */
  computeScratchOnStrokes(gesture: TGesture, stroke: IIStroke): IIStroke[]
  {
    const newStrokes: IIStroke[] = []
    const partPointersToRemove = gesture.subStrokes?.find(ss => ss.fullStrokeId === stroke.id)
    if (partPointersToRemove) {
      const strokePartToErase = new IIStroke()
      partPointersToRemove.x.forEach((x, i) => strokePartToErase.addPointer({ x, y: partPointersToRemove.y[i], p: 1, t: 1 }))
      const subStrokes = IIStroke.substract(stroke, strokePartToErase)
      if (subStrokes.before && subStrokes.before.pointers.length > 1) newStrokes.push(subStrokes.before)
      if (subStrokes.after && subStrokes.after.pointers.length > 1) newStrokes.push(subStrokes.after)
    }
    return newStrokes
  }

  /**
   * Compute scratch on text symbol by removing overlapping characters
   * @param gestureStroke - The gesture stroke
   * @param textSymbol - The text symbol to scratch
   * @returns Updated text symbol, or undefined if all characters removed
   */
  computeScratchOnText(gestureStroke: IIStroke, textSymbol: IIText): IIText | undefined
  {
    const charsToRemove = textSymbol.getCharsOverlaps(gestureStroke.pointers)
    if (textSymbol.chars.length == charsToRemove.length) {
      return
    }
    else {
      charsToRemove.forEach(c =>
      {
        const cIndex = textSymbol.chars.findIndex(c1 => c1.id === c.id)
        textSymbol.chars.splice(cIndex, 1)
      })
      this.texter.updateBounds(textSymbol)
      return textSymbol
    }
  }

  /**
   * Compute scratch on any symbol type
   * Handles different logic for each symbol type:
   * - Stroke: Uses computeScratchOnStrokes
   * - RecognizedText: Scratches child strokes, preserves decorators
   * - RecognizedMath/Diagram: Scratches child strokes, cleans solver outputs
   * - Text: Uses computeScratchOnText
   * - Math/Shape/Edge: Complete erasure
   *
   * @param gestureStroke - The gesture stroke
   * @param gesture - The gesture information
   * @param symbol - The symbol to scratch
   * @returns Object with 'erased' flag or 'replaced' array of new symbols
   */
  computeScratchOnSymbol(
    gestureStroke: IIStroke,
    gesture: TGesture,
    symbol: TIISymbol
  ): { erased?: boolean, replaced?: TIISymbol[] }
  {
    switch (symbol.type) {
      case SymbolType.Stroke: {
        const strokesScratchedResult = this.computeScratchOnStrokes(gesture, symbol)
        if (strokesScratchedResult.length) {
          return {
            replaced: strokesScratchedResult
          }
        }
        else {
          return { erased: true }
        }
      }
      case SymbolType.Recognized: {
        if (symbol.kind === RecognizedKind.Text) {
          const childrenNotTouch = symbol.strokes.filter(s => !gestureStroke.bounds.overlaps(s.bounds))
          const childrenTouch = symbol.strokes.filter(s => gestureStroke.bounds.overlaps(s.bounds))
          const results = childrenTouch.map(s =>
          {
            return {
              symbol: s,
              result: this.computeScratchOnStrokes(gesture, s)
            }
          })
          if (childrenNotTouch.length === 0 && results.every(r => r.result.length === 0)) {
            return { erased: true }
          }
          else {
            const strokesToConserve: IIStroke[] = childrenNotTouch.concat(...results.flatMap(r => r.result))
            const strokeText = new IIRecognizedText(strokesToConserve, { baseline: symbol.baseline, xHeight: symbol.xHeight }, symbol.style)
            strokeText.decorators = symbol.decorators
            // Reset jiixId as strokes have changed and need re-recognition
            strokeText.jiixId = undefined
            return {
              replaced: [strokeText]
            }
          }
        } else {
          const childrenNotTouch = symbol.strokes.filter(s => !gestureStroke.bounds.overlaps(s.bounds))
          const childrenTouch = symbol.strokes.filter(s => gestureStroke.bounds.overlaps(s.bounds))
          const results = childrenTouch.map(s =>
          {
            return {
              symbol: s,
              result: this.computeScratchOnStrokes(gesture, s)
            }
          })
          if (childrenNotTouch.length === 0 && results.every(r => r.result.length === 0)) {
            return { erased: true }
          }
          else {
            const strokesToConserve: IIStroke[] = childrenNotTouch.concat(...results.flatMap(r => r.result))
            const newSym = symbol.clone()
            newSym.id = `${ newSym.type }-${ createUUID() }`
            newSym.strokes = strokesToConserve
            newSym.jiixId = undefined
            if (newSym.kind === RecognizedKind.Math) {
              newSym.computedResult = undefined
              newSym.variableValues = undefined
              // Clean up solverOutputStrokeIds by removing deleted stroke IDs
              if (newSym.solverOutputStrokeIds && newSym.solverOutputStrokeIds.length > 0) {
                const conservedIds = new Set(strokesToConserve.map(s => s.id))
                const updatedSolverIds = newSym.solverOutputStrokeIds.filter(id => conservedIds.has(id))
                newSym.solverOutputStrokeIds = updatedSolverIds.length > 0 ? updatedSolverIds : undefined
              }
            }
            return {
              replaced: [newSym]
            }
          }
        }
      }
      case SymbolType.Text: {
        const textScratchedResult = this.computeScratchOnText(gestureStroke, symbol)
        if (textScratchedResult) {
          return {
            replaced: [textScratchedResult]
          }
        }
        else {
          return {
            erased: true
          }
        }
      }
      case SymbolType.Math: {
        // Math symbols should be erased entirely when scratched
        return {
          erased: true
        }
      }
      case SymbolType.Shape:
      case SymbolType.Edge: {
        return {
          erased: true
        }
      }
    }
  }

  // ==================== SPLIT/JOIN HELPERS ====================

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
}
