import { IIAbstractManager } from "../IIAbstractManager"
import { IIStroke, isStroke } from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"


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
   * Find a math symbol by its JIIX block ID
   */
  findMathSymbolByJiixId(jiixId: string): IIStroke | undefined
  {
    return this.editor.model.symbols.find(s =>
      isStroke(s) && s.jiixBlockId === jiixId && s.jiixBlockType === "Math"
    ) as IIStroke | undefined
  }

  /**
   * Recalculate all blocks that depend on a source block
   * @param sourceBlockId - JIIX block ID of the source block whose value changed
   */
  async recalculateDependentBlocks(sourceBlockId: string): Promise<void>
  {
    this.logger.info("recalculateDependentBlocks", { sourceBlockId })

    const computation = this.editor.math.computation.getMathBlock(sourceBlockId)
    if (!computation?.dependentBlocks || computation.dependentBlocks.length === 0) {
      this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.logger.info("recalculateDependentBlocks", `Found ${computation.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of computation.dependentBlocks) {
      try {
        this.logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
        await this.editor.computeMathNumericalResult(dependentBlockId, this.editor.drawComputationResult)
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
   * @param blockId - JIIX block ID
   */
  getMathDependencies(blockId: string): MathDependencies | null
  {
    const computation = this.editor.math.computation.getMathBlock(blockId)
    if (!computation) {
      this.logger.warn("getMathDependencies", `No computation data found for blockId: ${blockId}`)
      return null
    }

    return {
      variableSources: computation.variableSources,
      dependentBlocks: computation.dependentBlocks
    }
  }

  /**
   * Enrich dependency metadata for a single math block.
   * Takes a jiixBlockId — one call per block regardless of stroke count.
   * @param jiixBlockId - JIIX block ID of the math element
   */
  async enrichMathDependencies(jiixBlockId: string): Promise<void>
  {
    try {
      const blockLabel = this.editor.jiix.getBlockLabel(jiixBlockId) ?? jiixBlockId
      this.logger.info("enrichMathDependencies", `Starting enrichment for "${blockLabel}" (${jiixBlockId})`)

      const variables = await this.editor.getVariables(jiixBlockId)

      if (!variables || variables.length === 0) {
        this.logger.debug("enrichMathDependencies", `No variables in "${blockLabel}"`)

        const computation = this.editor.math.computation.getMathBlock(jiixBlockId)
        if (computation?.variableSources && Object.keys(computation.variableSources).length > 0) {
          this.editor.math.computation.updateDependencies(jiixBlockId, computation.dependentBlocks, {})
        }
        return
      }

      this.logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}

      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          const sourceComputation = this.editor.math.computation.getMathBlock(variable.sourceId)
          const currentDependentBlocks = sourceComputation?.dependentBlocks || []

          if (!currentDependentBlocks.includes(jiixBlockId)) {
            this.editor.math.computation.updateDependencies(
              variable.sourceId,
              [...currentDependentBlocks, jiixBlockId],
              sourceComputation?.variableSources
            )
            this.logger.info("enrichMathDependencies", `Added "${blockLabel}" to dependentBlocks of source block ${variable.sourceId}`)
          }
        } else {
          this.logger.debug("enrichMathDependencies", `Variable "${variable.name}" sourceType "${variable.sourceType}", skipping`)
        }
      }

      const computation = this.editor.math.computation.getMathBlock(jiixBlockId)
      this.editor.math.computation.updateDependencies(
        jiixBlockId,
        computation?.dependentBlocks,
        newVariableSources
      )

      this.logger.info("enrichMathDependencies", `Enriched "${blockLabel}" with variableSources:`, newVariableSources)
      this.editor.event.emitChanged(this.editor.history.context)
    }
    catch (error) {
      this.logger.error("enrichMathDependencies", { error })
    }
  }

  /**
   * Remove stale dependency references for blocks that no longer exist.
   * @param jiixBlockIds - Unique JIIX block IDs currently present in the model
   */
  cleanupMathDependencies(jiixBlockIds: string[]): void
  {
    const existingJiixIds = new Set(jiixBlockIds)

    // Pass 1: remove references to deleted blocks
    for (const jiixBlockId of jiixBlockIds) {
      let needsUpdate = false
      const computation = this.editor.math.computation.getMathBlock(jiixBlockId)
      if (!computation) continue

      let updatedDependentBlocks = computation.dependentBlocks
      let updatedVariableSources = computation.variableSources

      if (computation.dependentBlocks && computation.dependentBlocks.length > 0) {
        const filtered = computation.dependentBlocks.filter(id => existingJiixIds.has(id))
        const removedCount = computation.dependentBlocks.length - filtered.length
        if (removedCount > 0) {
          this.logger.info("cleanupMathDependencies", `Removed ${removedCount} deleted dependent(s) from block ${jiixBlockId}`)
          updatedDependentBlocks = filtered
          needsUpdate = true
        }
      }

      if (computation.variableSources && Object.keys(computation.variableSources).length > 0) {
        const stale = Object.entries(computation.variableSources)
          .filter(([, sourceId]) => !existingJiixIds.has(sourceId))
          .map(([varName]) => varName)
        if (stale.length > 0) {
          updatedVariableSources = { ...computation.variableSources }
          stale.forEach(varName => delete updatedVariableSources![varName])
          this.logger.info("cleanupMathDependencies", `Removed ${stale.length} stale variable source(s) from block ${jiixBlockId}`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.editor.math.computation.updateDependencies(jiixBlockId, updatedDependentBlocks, updatedVariableSources)
      }
    }

    // Pass 2: remove from dependentBlocks any block that no longer references this one as a source
    const blockToSources = new Map<string, Set<string>>()
    for (const jiixBlockId of jiixBlockIds) {
      const computation = this.editor.math.computation.getMathBlock(jiixBlockId)
      blockToSources.set(
        jiixBlockId,
        computation?.variableSources ? new Set(Object.values(computation.variableSources)) : new Set()
      )
    }

    for (const jiixBlockId of jiixBlockIds) {
      const computation = this.editor.math.computation.getMathBlock(jiixBlockId)
      if (!computation?.dependentBlocks || computation.dependentBlocks.length === 0) continue

      const filtered = computation.dependentBlocks.filter(depId => {
        const sources = blockToSources.get(depId)
        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not in blockToSources, keeping`)
          return true
        }
        return sources.has(jiixBlockId)
      })

      const removedCount = computation.dependentBlocks.length - filtered.length
      if (removedCount > 0) {
        this.logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent(s) from block ${jiixBlockId}`)
        this.editor.math.computation.updateDependencies(jiixBlockId, filtered, computation.variableSources)
      }
    }
  }
}
