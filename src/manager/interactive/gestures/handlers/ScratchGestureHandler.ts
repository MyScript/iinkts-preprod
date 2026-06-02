import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIStroke, isRecognizedMathSymbol, type TIISymbol } from "@/symbol"
import { TIIHistoryChanges } from "@/history"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture } from "@/manager/interactive/GestureTypes"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"

/**
 * Handler for SCRATCH gesture type
 * Erases or partially removes symbols by scratching over them
 * @group Gesture/Handler
 */
export class ScratchGestureHandler extends GestureHandler
{
  #logger: Logger
  readonly gestureType = "SCRATCH" as const

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
    this.#logger.debug("applyScratchGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply scratch because there are no strokes")
      return
    }

    const symbolsToUpdate: TIISymbol[] = []
    const symbolsToErase: TIISymbol[] = []
    const symbolsToReplace: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] } = { oldSymbols: [], newSymbols: [] }

    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && !symbolsToErase.some(s => s.id === sym.id) && !symbolsToReplace.oldSymbols.some(s => s.id === sym.id)) {
        const result = this.helpers.computeScratchOnSymbol(gestureStroke, gesture, sym)
        if (result.erased) symbolsToErase.push(sym)
        else if (result.replaced) {
          symbolsToReplace.newSymbols.push(...result.replaced)
          symbolsToReplace.oldSymbols.push(sym)
        }
      }
    })

    // Handle dependent math blocks
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
}
