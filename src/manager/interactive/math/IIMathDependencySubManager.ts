import { IIAbstractManager } from "../IIAbstractManager"
import { IIStroke, isStroke } from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Manager responsible for managing math symbol dependencies
 * Handles variable tracking and dependent block recalculation
 * @group Manager
 */
export class IIMathDependencySubManager extends IIAbstractManager
{
  protected managerName = "IIMathDependencySubManager"

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  /**
   * Find a math symbol by its JIIX ID
   * @param jiixId - JIIX ID to search for
   * @returns Math symbol if found, undefined otherwise
   */
  findMathSymbolByJiixId(jiixId: string): IIStroke | undefined
  {
    return this.editor.model.symbols.find(s =>
      isStroke(s) && s.jiixBlockId === jiixId && s.jiixBlockType === "Math"
    ) as IIStroke | undefined
  }

  /**
   * Recalculate all blocks that depend on a source block
   * @param sourceBlockId - ID of the source block whose value changed
   * @returns Promise that resolves when all dependents are recalculated
   */
  async recalculateDependentBlocks(sourceBlockId: string): Promise<void>
  {
    this.logger.info("recalculateDependentBlocks", { sourceBlockId })

    const sourceMathSymbol = this.findMathSymbolByJiixId(sourceBlockId)

    if (!sourceMathSymbol || !sourceMathSymbol.jiixBlockId) {
      this.logger.warn("recalculateDependentBlocks", `Source block not found: ${sourceBlockId}`)
      return
    }

    // Get dependent blocks from computation manager
    const computation = this.editor.math.computation.getMathBlock(sourceMathSymbol.jiixBlockId)
    if (!computation?.dependentBlocks || computation.dependentBlocks.length === 0) {
      this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.logger.info("recalculateDependentBlocks", `Found ${computation.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of computation.dependentBlocks) {
      const dependentMathSymbol = this.findMathSymbolByJiixId(dependentBlockId)

      if (!dependentMathSymbol) {
        this.logger.warn("recalculateDependentBlocks", `Dependent block not found: ${dependentBlockId}`)
        continue
      }

      try {
        this.logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
        await this.editor.computeMathNumericalResult({ id: dependentMathSymbol.jiixBlockId!, label: this.editor.blockMetadata.getLabel(dependentMathSymbol.id)! }, this.editor.drawComputationResult)
      }
      catch (computeError) {
        this.logger.error("recalculateDependentBlocks", `Error computing ${dependentBlockId}:`, computeError)
      }
    }

    this.logger.info("recalculateDependentBlocks", "All dependent blocks recalculated")
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

    if (!mathSymbol || !mathSymbol.jiixBlockId) {
      this.logger.warn("getMathDependencies", `Math symbol not found for blockId: ${blockId}`)
      return null
    }

    // Get dependencies from computation manager
    const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)

    return {
      variableSources: computation?.variableSources,
      dependentBlocks: computation?.dependentBlocks
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
