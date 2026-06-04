import { LoggerManager, LoggerCategory } from "@/logger"
import { IIRecognizedMath, isRecognizedMath } from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Manager responsible for managing math symbol dependencies
 * Handles variable tracking and dependent block recalculation
 * @group Manager
 */
export class IIMathDependencyManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.EDITOR)

  constructor(private editor: InteractiveInkEditor) {}

  /**
   * Find a math symbol by its JIIX ID
   * @param jiixId - JIIX ID to search for
   * @returns Math symbol if found, undefined otherwise
   */
  findMathSymbolByJiixId(jiixId: string): IIRecognizedMath | undefined
  {
    return this.editor.model.symbols.find(s =>
      isRecognizedMath(s) && s.jiixId === jiixId
    ) as IIRecognizedMath | undefined
  }

  /**
   * Recalculate all blocks that depend on a source block
   * @param sourceBlockId - ID of the source block whose value changed
   * @returns Promise that resolves when all dependents are recalculated
   */
  async recalculateDependentBlocks(sourceBlockId: string): Promise<void>
  {
    this.#logger.info("recalculateDependentBlocks", { sourceBlockId })

    const sourceMathSymbol = this.findMathSymbolByJiixId(sourceBlockId)

    if (!sourceMathSymbol) {
      this.#logger.warn("recalculateDependentBlocks", `Source block not found: ${sourceBlockId}`)
      return
    }

    if (!sourceMathSymbol.dependentBlocks || sourceMathSymbol.dependentBlocks.length === 0) {
      this.#logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.#logger.info("recalculateDependentBlocks", `Found ${sourceMathSymbol.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of sourceMathSymbol.dependentBlocks) {
      const dependentMathSymbol = this.findMathSymbolByJiixId(dependentBlockId)

      if (!dependentMathSymbol) {
        this.#logger.warn("recalculateDependentBlocks", `Dependent block not found: ${dependentBlockId}`)
        continue
      }

      try {
        this.#logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
        await this.editor.computeMathNumericalResult(dependentMathSymbol, this.editor.drawComputationResult)
      }
      catch (computeError) {
        this.#logger.error("recalculateDependentBlocks", `Error computing ${dependentBlockId}:`, computeError)
      }
    }

    this.#logger.info("recalculateDependentBlocks", "All dependent blocks recalculated")
    this.editor.event.emitChanged(this.editor.history.context)
  }

  /**
   * Get all dependencies for a math block
   * Returns information about which variables this block uses and from where,
   * and which other blocks depend on this block's variables
   * @param blockId - The JIIX ID of the math block
   * @returns Object containing variable sources and dependent blocks
   */
  getMathDependencies(blockId: string): MathDependencies | null
  {
    const mathSymbol = this.findMathSymbolByJiixId(blockId)

    if (!mathSymbol) {
      this.#logger.warn("getMathDependencies", `Math symbol not found for blockId: ${blockId}`)
      return null
    }

    return {
      variableSources: mathSymbol.variableSources,
      dependentBlocks: mathSymbol.dependentBlocks
    }
  }
}

/**
 * Type representing math symbol dependencies
 * @group Manager
 */
export type MathDependencies = {
  /**
   * Map of variable names to their source block IDs
   */
  variableSources?: { [variableName: string]: string }

  /**
   * Array of block IDs that depend on this block
   */
  dependentBlocks?: string[]
}
