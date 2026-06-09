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

  #dependencies: Map<string, MathDependencies> = new Map()

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

    const deps = this.#dependencies.get(sourceBlockId)
    if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) {
      this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.logger.info("recalculateDependentBlocks", `Found ${deps.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of deps.dependentBlocks) {
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
    return this.#dependencies.get(blockId) ?? null
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

        const existing = this.#dependencies.get(jiixBlockId)
        if (existing?.variableSources && Object.keys(existing.variableSources).length > 0) {
          this.#dependencies.set(jiixBlockId, { ...existing, variableSources: {} })
        }
        return
      }

      this.logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}

      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          const sourceDeps = this.#dependencies.get(variable.sourceId) ?? {}
          const currentDependentBlocks = sourceDeps.dependentBlocks ?? []

          if (!currentDependentBlocks.includes(jiixBlockId)) {
            this.#dependencies.set(variable.sourceId, {
              ...sourceDeps,
              dependentBlocks: [...currentDependentBlocks, jiixBlockId]
            })
            this.logger.info("enrichMathDependencies", `Added "${blockLabel}" to dependentBlocks of source block ${variable.sourceId}`)
          }
        } else {
          this.logger.debug("enrichMathDependencies", `Variable "${variable.name}" sourceType "${variable.sourceType}", skipping`)
        }
      }

      const existing = this.#dependencies.get(jiixBlockId) ?? {}
      this.#dependencies.set(jiixBlockId, {
        ...existing,
        variableSources: newVariableSources
      })

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

    // Remove entries for blocks that no longer exist
    for (const [id] of this.#dependencies) {
      if (!existingJiixIds.has(id)) {
        this.#dependencies.delete(id)
      }
    }

    // Pass 1: remove references to deleted blocks
    for (const jiixBlockId of jiixBlockIds) {
      let needsUpdate = false
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps) continue

      let updatedDependentBlocks = deps.dependentBlocks
      let updatedVariableSources = deps.variableSources

      if (deps.dependentBlocks && deps.dependentBlocks.length > 0) {
        const filtered = deps.dependentBlocks.filter(id => existingJiixIds.has(id))
        const removedCount = deps.dependentBlocks.length - filtered.length
        if (removedCount > 0) {
          this.logger.info("cleanupMathDependencies", `Removed ${removedCount} deleted dependent(s) from block ${jiixBlockId}`)
          updatedDependentBlocks = filtered
          needsUpdate = true
        }
      }

      if (deps.variableSources && Object.keys(deps.variableSources).length > 0) {
        const stale = Object.entries(deps.variableSources)
          .filter(([, sourceId]) => !existingJiixIds.has(sourceId))
          .map(([varName]) => varName)
        if (stale.length > 0) {
          updatedVariableSources = { ...deps.variableSources }
          stale.forEach(varName => delete updatedVariableSources![varName])
          this.logger.info("cleanupMathDependencies", `Removed ${stale.length} stale variable source(s) from block ${jiixBlockId}`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.#dependencies.set(jiixBlockId, { ...deps, dependentBlocks: updatedDependentBlocks, variableSources: updatedVariableSources })
      }
    }

    // Pass 2: remove from dependentBlocks any block that no longer references this one as a source
    const blockToSources = new Map<string, Set<string>>()
    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      blockToSources.set(
        jiixBlockId,
        deps?.variableSources ? new Set(Object.values(deps.variableSources)) : new Set()
      )
    }

    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) continue

      const filtered = deps.dependentBlocks.filter(depId => {
        const sources = blockToSources.get(depId)
        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not in blockToSources, keeping`)
          return true
        }
        return sources.has(jiixBlockId)
      })

      const removedCount = deps.dependentBlocks.length - filtered.length
      if (removedCount > 0) {
        this.logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent(s) from block ${jiixBlockId}`)
        this.#dependencies.set(jiixBlockId, { ...deps, dependentBlocks: filtered })
      }
    }
  }

  clear(): void
  {
    this.#dependencies.clear()
  }

  protected onDestroy(): void
  {
    this.clear()
  }
}
