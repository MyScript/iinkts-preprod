import { EditorTool } from "../../Constants"
import { LoggerManager, LoggerCategory } from "../../logger"
import { IIModel } from "../../model"
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
  isRecognizedMathSymbol,
  isRecognizedTextSymbol,
} from "../../symbol"
import { RecognizerWebSocket } from "../../recognizer"
import { SVGRenderer } from "../../renderer"
import { IIHistoryManager, TIIHistoryChanges } from "../../history"
import { computeAverage, createUUID, isBetween, PartialDeep } from "../../utils"
import { IITranslateManager } from "."
import { IITextManager } from "."
import { InteractiveInkEditor } from "../../editor"

/**
 * @group Gesture
 * @summary List all authorized gestures
 */
export type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND"

/**
 * @group Gesture
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: { fullStrokeId: string, x: number[], y: number[] }[]
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum SurroundAction
{
  Select = "select",
  Surround = "surround",
  Highlight = "highlight"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum StrikeThroughAction
{
  Erase = "erase",
  Draw = "draw"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on underline detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum UnderlineAction
{
  Draw = "draw",
  Thicken = "thicken"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum InsertAction
{
  /**
   * @remarks Add line break on gesture place
   */
  LineBreak = "line-break",
  /**
   * @remarks Insert place in gesture place
   */
  Insert = "insert"
}

/**
 * @group Gesture
 * @source
 */
export type TGestureConfiguration = {
  surround: SurroundAction
  strikeThrough: StrikeThroughAction
  underline: UnderlineAction
  insert: InsertAction
}

/**
 * @group Gesture
 * @source
 */
export const DefaultGestureConfiguration: TGestureConfiguration = {
  surround: SurroundAction.Select,
  strikeThrough: StrikeThroughAction.Draw,
  underline: UnderlineAction.Draw,
  insert: InsertAction.LineBreak
}

/**
 * @group Gesture
 */
export class IIGestureManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.GESTURE)

  static readonly #TEXT_STROKE_GROUP_TYPES = new Set([SymbolType.Text, SymbolType.Stroke, SymbolType.Group])
  static readonly #SURROUND_SELECT_TYPES = new Set([SymbolType.Group, SymbolType.Stroke, SymbolType.Text, SymbolType.Recognized])
  static readonly #ERASE_OVERLAY_TYPES = new Set([SymbolType.Stroke, SymbolType.Text, SymbolType.Group])
  static readonly #ERASE_CONTAIN_TYPES = new Set([SymbolType.Shape, SymbolType.Edge])

  insertAction: InsertAction = InsertAction.LineBreak
  surroundAction: SurroundAction = SurroundAction.Select
  strikeThroughAction: StrikeThroughAction = StrikeThroughAction.Draw
  underlineAction: UnderlineAction = UnderlineAction.Draw
  editor: InteractiveInkEditor

  constructor(editor: InteractiveInkEditor, gestureAction?: PartialDeep<TGestureConfiguration>)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.surroundAction = gestureAction?.surround || DefaultGestureConfiguration.surround
    this.strikeThroughAction = gestureAction?.strikeThrough || DefaultGestureConfiguration.strikeThrough
    this.underlineAction = gestureAction?.underline || DefaultGestureConfiguration.underline
    this.insertAction = gestureAction?.insert || DefaultGestureConfiguration.insert
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
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

  get model(): IIModel
  {
    return this.editor.model
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get strokeSpaceWidth(): number
  {
    return this.editor.configuration.rendering.guides.gap * 2
  }

  protected isDecorable(symbol: TIISymbol): boolean
  {
    return symbol.type === SymbolType.Stroke || symbol.type === SymbolType.Text || isRecognizedTextSymbol(symbol)
  }

  /**
   * Helper function to apply decorator on words that intersect with gesture stroke
   * @param symbol - The symbol to apply decorator on (can be IIText or IIRecognizedText)
   * @param gestureStroke - The gesture stroke
   * @param decoratorKind - The kind of decorator to apply
   * @returns true if at least one word was modified, false otherwise
   */
  protected applyDecoratorOnWords(
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
          // Check horizontal overlap and vertical proximity (stroke below word)
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

  async applySurroundGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.info("applySurroundGesture", { gestureStroke, gesture })
    const changes: TIIHistoryChanges = {}
    const ids = this.model.symbols.filter(s => gestureStroke.bounds.contains(s.bounds)).map(s => s.id)
    switch (this.surroundAction) {
      case SurroundAction.Select: {
        if (ids.length) {
          this.editor.tool = EditorTool.Select
          this.editor.select(ids)
        }
        break
      }
      case SurroundAction.Highlight: {
        const symbolIdSet = new Set<string>()
        changes.decorator = []
        ids.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && this.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
            const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

            // Apply decorator on words for IIRecognizedText, or on symbol level for others
            if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
              const modified = this.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Highlight)
              if (modified) {
                this.model.updateSymbol(symWithDec)
                this.renderer.drawSymbol(symWithDec)
                symbolIdSet.add(symWithDec.id)
                const highlight = new IIDecorator(DecoratorKind.Highlight, this.editor.penStyle)
                changes.decorator!.push({ symbol: symWithDec, decorator: highlight, added: true })
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
              changes.decorator!.push({ symbol: symWithDec, decorator: highlight, added })
            }
          }
        })
        if (changes.decorator.length) {
          this.history.push(this.model, changes)
        }
        break
      }
      case SurroundAction.Surround: {
        const symbolIdSet = new Set<string>()
        changes.decorator = []
        ids.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && this.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
            const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

            // Apply decorator on words for IIRecognizedText, or on symbol level for others
            if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
              const modified = this.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Surround)
              if (modified) {
                this.model.updateSymbol(symWithDec)
                this.renderer.drawSymbol(symWithDec)
                symbolIdSet.add(symWithDec.id)
                const surround = new IIDecorator(DecoratorKind.Surround, this.editor.penStyle)
                changes.decorator!.push({ symbol: symWithDec, decorator: surround, added: true })
              }
            } else {
              const surround = new IIDecorator(DecoratorKind.Surround, this.editor.penStyle)
              const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Surround)
              const added = index === -1
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              added ? symWithDec.decorators.push(surround) : symWithDec.decorators.splice(index, 1)
              this.model.updateSymbol(symWithDec)
              this.renderer.drawSymbol(symWithDec)
              changes.decorator!.push({ symbol: symWithDec, decorator: surround, added })
              symbolIdSet.add(symWithDec.id)
            }
          }
        })
        this.history.push(this.model, changes)
        break
      }
      default:
        this.#logger.error("applySurroundGesture", `Unknown surroundAction: ${ this.surroundAction }, values allowed are: ${ SurroundAction.Highlight }, ${ SurroundAction.Select }, ${ SurroundAction.Surround }`)
        break
    }
    return
  }

  protected computeScratchOnStrokes(gesture: TGesture, stroke: IIStroke): IIStroke[]
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

  protected computeScratchOnText(gestureStroke: IIStroke, textSymbol: IIText): IIText | undefined
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

  protected computeScratchOnSymbol(gestureStroke: IIStroke, gesture: TGesture, symbol: TIISymbol): { erased?: boolean, replaced?: TIISymbol[] }
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

  async applyScratch(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyScratchGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUpdate: TIISymbol[] = []
    const symbolsToErase: TIISymbol[] = []
    const symbolsToReplace: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && !symbolsToErase.some(s => s.id === sym.id) && !symbolsToReplace.oldSymbols.some(s => s.id === sym.id)) {
        const result = this.computeScratchOnSymbol(gestureStroke, gesture, sym)
        if (result.erased) symbolsToErase.push(sym)
        else if (result.replaced) {
          symbolsToReplace.newSymbols.push(...result.replaced)
          symbolsToReplace.oldSymbols.push(sym)
        }
      }
    })

    const affectedMathSymbols = [
      ...symbolsToErase.filter(isRecognizedMathSymbol),
      ...symbolsToReplace.oldSymbols.filter(isRecognizedMathSymbol)
    ]

    const dependentBlocksToClean = new Set<string>()
    affectedMathSymbols.forEach(mathSymbol => {
      if (mathSymbol.dependentBlocks && mathSymbol.dependentBlocks.length > 0) {
        this.#logger.info("applyScratch", `Math symbol ${mathSymbol.jiixId} has ${mathSymbol.dependentBlocks.length} dependent blocks, clearing their solver outputs`)
        mathSymbol.dependentBlocks.forEach(blockId => dependentBlocksToClean.add(blockId))
      }
    })

    for (const blockId of dependentBlocksToClean) {
      const dependentMathSymbol = this.editor.findMathSymbolByJiixId(blockId)
      if (dependentMathSymbol) {
        await this.editor.clearSolverOutputStrokes(dependentMathSymbol)
        this.#logger.info("applyScratch", `Cleared solver outputs from dependent block ${blockId}`)
      }
    }

    const promises: Promise<void | TIISymbol[]>[] = []
    const changes: TIIHistoryChanges = {}
    if (symbolsToUpdate.length) {
      promises.push(this.editor.updateSymbols(symbolsToUpdate, false))
      changes.updated = symbolsToUpdate
    }

    if (symbolsToErase.length) {
      promises.push(this.editor.removeSymbols(symbolsToErase.map(s => s.id), false))
      changes.erased = symbolsToErase
    }

    if (symbolsToReplace.newSymbols.length) {
      changes.replaced = symbolsToReplace
      promises.push(this.editor.replaceSymbols(symbolsToReplace.oldSymbols, symbolsToReplace.newSymbols, false))
    }

    this.history.push(this.model, changes)
    await Promise.all(promises)
  }

  async applyJoinGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
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
          childAfter.forEach(c => this.translator.applyToSymbol(c, tx, 0))
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
      this.translator.applyToSymbol(firstSymbolAfterClone, translateX, 0)

      if (lastSymbBefore.type === SymbolType.Text && firstSymbolAfter.type === SymbolType.Text) {
        const texts = [lastSymbBeforeClone as IIText, firstSymbolAfterClone as IIText]
        const text = new IIText(texts.flatMap(s => s.chars), texts[0].point, Box.createFromBoxes(texts.map(t => t.bounds)))
        this.texter.setBounds(text)
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
        if (this.model.roundToLineGuide(lastSymbolBeforeGesture.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.rowHeight)) {
          const symbolInNextRow = symbolsBelow.filter(s => this.model.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX = lastSymbolBeforeGesture.bounds.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
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
        if (this.model.roundToLineGuide(lastSymbolAbove.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.rowHeight)) {
          const translateX = lastSymbolAbove.bounds.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
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
      this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (translate.length) {
      changes.translate = translate
      Promise.all(translate.map(tr => this.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
    }
    this.history.push(this.model, changes)
  }

  protected createStrokesFromGestureSubStroke(strokeOrigin: IIStroke, subStrokes: { x: number[], y: number[] }[]): IIStroke[]
  {
    const strokes: IIStroke[] = []
    if (subStrokes[0]) {
      const subStroke = new IIStroke(strokeOrigin.style)
      subStrokes![0].x.forEach((x, i) =>
      {
        subStroke.pointers.push({
          x,
          y: subStrokes![0].y[i],
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
          y: subStrokes![1].y[i],
          p: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.p || 1,
          t: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.t || Math.max(...subStroke.pointers.map(p => p.t + 20))
        })
      })
      strokes.push(subStroke)
    }
    return strokes
  }

  protected computeSplitStroke(strokeOrigin: IIStroke, subStrokes: { x: number[], y: number[] }[]): { before?: IIStroke, after?: IIStroke }
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

  protected computeChangesOnSplitStroke(gestureStroke: IIStroke, strokeIdToSplit: string, subStrokes: { fullStrokeId: string, x: number[], y: number[] }[]): TIIHistoryChanges
  {
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s) && gestureStroke.bounds.xMid < s.bounds.xMin)

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

  protected computeChangesOnSplitStrokeText(gestureStroke: IIStroke, strokeTextToSplit: IIRecognizedText): TIIHistoryChanges
  {
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s) && gestureStroke.bounds.xMid < s.bounds.xMin)
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

      if (this.insertAction === InsertAction.LineBreak) {
        const minXBefore = strokesBefore.length ? Math.min(...strokesBefore.map(s => s.bounds.xMin)) : 0
        this.translator.applyToSymbol(strokeTextAfter, -strokeTextAfter.bounds.xMin + minXBefore, this.rowHeight)
      } else {
        this.translator.applyToSymbol(strokeTextAfter, this.strokeSpaceWidth, 0)
      }
      replaced.newSymbols.push(strokeTextAfter)
    }

    if (this.insertAction === InsertAction.LineBreak) {
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

  protected computeChangesOnSplitText(gestureStroke: IIStroke, textToSplit: IIText): TIIHistoryChanges
  {
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s) && gestureStroke.bounds.xMid < s.bounds.xMin)
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const charsBefore = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 <= gestureStroke.bounds.xMid)
    const charsAfter = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 > gestureStroke.bounds.xMid)
    const newTexts: IIText[] = []
    if (charsBefore.length && charsAfter.length) {
      const textBefore = new IIText(charsBefore, textToSplit.point, Box.createFromBoxes(charsBefore.map(c => c.bounds)))
      this.texter.setBounds(textBefore)
      newTexts.push(textBefore)

      let pointAfter: TPoint
      if (this.insertAction === InsertAction.LineBreak) {
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
    if (this.insertAction === InsertAction.LineBreak) {
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

  async applyInsertGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
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
      changes = this.computeChangesOnSplitStroke(gestureStroke, gesture.strokeIds[0], gesture.subStrokes)
    }
    else if (textToSplit) {
      changes = this.computeChangesOnSplitText(gestureStroke, textToSplit)
    }
    else if (strokeTextToSplit) {
      changes = this.computeChangesOnSplitStrokeText(gestureStroke, strokeTextToSplit)
    }
    else if (symbolsAfterGestureInRow.length) {
      const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        translateX = Math.min(...symbolsBeforeGestureInRow.map(s => s.bounds.xMin)) - Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
      }

      switch (this.insertAction) {
        case InsertAction.LineBreak:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: this.rowHeight })
          if (symbolsBelow.length) {
            translate.push({ symbols: symbolsBelow, tx: 0, ty: this.rowHeight })
          }
          break
        case InsertAction.Insert:
          translate.push({ symbols: symbolsAfterGestureInRow, tx: this.strokeSpaceWidth * 2, ty: 0 })
          break
      }
      changes = { translate }
    }
    else if (symbolsBeforeGestureInRow.length && symbolsBelow.length && this.insertAction === InsertAction.LineBreak) {
      changes = { translate: [{ symbols: symbolsBelow, tx: 0, ty: this.rowHeight }] }
    }

    if (changes) {
      this.history.push(this.model, changes)
      const promises: Promise<void>[] = []
      if (changes.translate?.length) {
        promises.push(...changes.translate.map(tr => this.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
      }
      if (changes.replaced?.newSymbols.length) {
        promises.push(this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false))
      }
      await Promise.all(promises)
    }
  }

  async applyUnderlineGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }

    switch (this.underlineAction) {
      case UnderlineAction.Draw: {
        const changes: TIIHistoryChanges = { decorator: [] }
        const symbolIdSet = new Set<string>()
        gesture.strokeIds.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && this.isDecorable(sym) && !symbolIdSet.has(sym.id)) {
            const symWithDec = sym as (IIText | IIStroke | IIRecognizedText)

            // Apply decorator on words for IIRecognizedText, or on symbol level for others
            if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
              const modified = this.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Underline)
              if (modified) {
                this.model.updateSymbol(symWithDec)
                this.renderer.drawSymbol(symWithDec)
                symbolIdSet.add(symWithDec.id)
                const underline = new IIDecorator(DecoratorKind.Underline, this.editor.penStyle)
                changes.decorator?.push({ symbol: symWithDec, decorator: underline, added: true })
              }
            } else {
              const underline = new IIDecorator(DecoratorKind.Underline, this.editor.penStyle)
              const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Underline)
              const added = index === -1
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              added ? symWithDec.decorators.push(underline) : symWithDec.decorators.splice(index, 1)
              this.model.updateSymbol(symWithDec)
              this.renderer.drawSymbol(symWithDec)
              changes.decorator?.push({ symbol: symWithDec, decorator: underline, added })
              symbolIdSet.add(symWithDec.id)
            }
          }
        })
        if (changes.decorator?.length) {
          this.history.push(this.model, changes)
        }
        break
      }
      case UnderlineAction.Thicken: {
        const symbolsToThicken: TIISymbol[] = []
        gesture.strokeIds.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && !symbolsToThicken.some(s => s.id === sym.id)) {
            const currentWidth = sym.style.width || 1
            const newWidth = currentWidth * 2
            this.editor.updateSymbolsStyle([sym.id], { width: newWidth }, false)
            symbolsToThicken.push(sym)
          }
        })
        if (symbolsToThicken.length) {
          const changes: TIIHistoryChanges = {
            style: { symbols: symbolsToThicken }
          }
          this.history.push(this.model, changes)
        }
        break
      }
      default:
        this.#logger.warn("applyUnderlineGesture", `Unknown underlineAction: ${ this.underlineAction }, values allowed are: ${ UnderlineAction.Draw }, ${ UnderlineAction.Thicken }`)
        break
    }
  }

  async applyStrikeThroughGesture(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>
  {
    this.#logger.debug("applyStrikeThroughGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }
    switch (this.strikeThroughAction) {
      case StrikeThroughAction.Draw: {
        const changes: TIIHistoryChanges = { decorator: [] }
        const symbolIds: string[] = []
        gesture.strokeIds.forEach(id =>
        {
          const symbol = this.model.getRootSymbol(id)
          if (symbol && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text, SymbolType.Recognized].includes(symbol.type) && !symbolIds.includes(symbol.id)) {
            const symWithDec = symbol as (IIText | IIStroke | IIRecognizedText)

            // Apply decorator on words for IIRecognizedText, or on symbol level for others
            if ((symWithDec.type === SymbolType.Recognized && symWithDec.kind === RecognizedKind.Text) || symWithDec.type === SymbolType.Text) {
              const modified = this.applyDecoratorOnWords(symWithDec as (IIText | IIRecognizedText), gestureStroke, DecoratorKind.Strikethrough)
              if (modified) {
                this.model.updateSymbol(symWithDec)
                this.renderer.drawSymbol(symWithDec)
                symbolIds.push(symWithDec.id)
                const strikethrough = new IIDecorator(DecoratorKind.Strikethrough, this.editor.penStyle)
                changes.decorator?.push({ symbol: symWithDec, decorator: strikethrough, added: true })
              }
            } else {
              const strikethrough = new IIDecorator(DecoratorKind.Strikethrough, this.editor.penStyle)
              const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Strikethrough)
              const added = index === -1
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              added ? symWithDec.decorators.push(strikethrough) : symWithDec.decorators.splice(index, 1)
              this.model.updateSymbol(symWithDec)
              this.renderer.drawSymbol(symWithDec)
              changes.decorator?.push({ symbol: symWithDec, decorator: strikethrough, added })
              symbolIds.push(symWithDec.id)
            }
          }
        })
        if (changes.decorator?.length) {
          this.history.push(this.model, changes)
        }
        break
      }
      case StrikeThroughAction.Erase: {
        return this.editor.removeSymbols(gesture.strokeIds)
      }
      default:
        this.#logger.warn("#applyStrikeThroughGesture", `Unknown OnStrikeThrough: ${ this.strikeThroughAction }, values allowed are: ${ StrikeThroughAction.Draw }, ${ StrikeThroughAction.Erase }`)
        break
    }
  }

  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.info("apply", { gestureStroke, gesture })
    this.editor.updateSymbolsStyle([gestureStroke.id], { opacity: (gestureStroke.style.opacity || 1) / 2 }, false)
    await this.editor.removeSymbol(gestureStroke.id, false)
    await this.editor.synchronizeStrokesWithJIIX()
    switch (gesture.gestureType) {
      case "UNDERLINE":
        await this.applyUnderlineGesture(gestureStroke, gesture)
        break
      case "SCRATCH":
        await this.applyScratch(gestureStroke, gesture)
        break
      case "JOIN":
        await this.applyJoinGesture(gestureStroke, gesture)
        break
      case "INSERT":
        await this.applyInsertGesture(gestureStroke, gesture)
        break
      case "STRIKETHROUGH":
        await this.applyStrikeThroughGesture(gestureStroke, gesture)
        break
      case "SURROUND":
        await this.applySurroundGesture(gestureStroke, gesture)
        break
      default:
        this.#logger.warn("apply", `Gesture unknown: ${ gesture.gestureType }`)
        break
    }
    this.editor.event.emitGestured({ gestureType: gesture.gestureType, stroke: gestureStroke })
    this.editor.svgDebugger.apply()
    return Promise.resolve()
  }

  async getGestureFromContextLess(gestureStroke: IIStroke): Promise<TGesture | undefined>
  {
    const gesture = await this.recognizer.recognizeGesture(gestureStroke)
    if (!gesture) return
    switch (gesture.gestureType) {
      case "surround": {
        const hasSymbolsToSurrond = this.model.symbols.some(s =>
        {
          if (s.id !== gestureStroke.id && gestureStroke.bounds.contains(s.bounds)) {
            return this.surroundAction === SurroundAction.Select || IIGestureManager.#SURROUND_SELECT_TYPES.has(s.type)
          }
          return false
        })
        if (hasSymbolsToSurrond) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "left-right":
      case "right-left": {
        const symbolsToUnderline = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id && IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height * 3 / 4, s.bounds.y + s.bounds.height * 5 / 4)
        })
        if (symbolsToUnderline.length) {
          return {
            gestureType: "UNDERLINE",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToUnderline.map(s => s.id),
          }
        }
        const symbolsToStrikeThrough = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id && IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height / 4, s.bounds.y + s.bounds.height * 3 / 4)
        })
        if (symbolsToStrikeThrough.length) {
          return {
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToStrikeThrough.map(s => s.id),
          }
        }
        return
      }
      case "scratch": {
        const symbolsToErase = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id &&
            (
              gestureStroke.bounds.overlaps(s.bounds) && IIGestureManager.#ERASE_OVERLAY_TYPES.has(s.type) ||
              gestureStroke.bounds.contains(s.bounds) && IIGestureManager.#ERASE_CONTAIN_TYPES.has(s.type)
            )
        })

        if (symbolsToErase.length) {
          return {
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToErase.map(s => s.id),
          }
        }
        return
      }
      case "bottom-top": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          s.id !== gestureStroke.id &&
          IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "top-bottom": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          s.id !== gestureStroke.id &&
          IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "INSERT",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "none":
      default:
        return
    }
  }
}
