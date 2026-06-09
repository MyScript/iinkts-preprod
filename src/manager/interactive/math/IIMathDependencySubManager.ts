import { IIAbstractManager } from "../IIAbstractManager"
import { IIStroke, isStroke, isRecognizedMath } from "@/symbol"
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
        await this.editor.computeMathNumericalResult(dependentMathSymbol.jiixBlockId!, this.editor.drawComputationResult)
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

    const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)

    return {
      variableSources: computation?.variableSources,
      dependentBlocks: computation?.dependentBlocks
    }
  }

  async enrichMathDependencies(mathSymbol: IIStroke): Promise<void>
  {
    try {
      if (!mathSymbol.jiixBlockId) {
        this.logger.warn("enrichMathDependencies", "Math symbol has no jiixBlockId")
        return
      }

      const originalJiixId = mathSymbol.jiixBlockId

      const symbolExists = this.editor.model.symbols.some(s => s.id === mathSymbol.id)
      if (!symbolExists) {
        this.logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} (${originalJiixId}) no longer exists in model, skipping enrichment`)
        return
      }

      if (!mathSymbol.jiixBlockId || mathSymbol.jiixBlockId !== originalJiixId) {
        this.logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} jiixBlockId changed from ${originalJiixId} to ${mathSymbol.jiixBlockId}, skipping enrichment`)
        return
      }

      this.logger.info("enrichMathDependencies", `Starting enrichment for ${this.editor.jiix.getLabelForStroke(mathSymbol.id)} (${originalJiixId})`)

      const variables = await this.editor.getVariables(originalJiixId)

      const currentSymbol = this.editor.model.symbols.find(s =>
        isRecognizedMath(s) && s.jiixBlockId === originalJiixId
      ) as IIStroke | undefined

      if (!currentSymbol) {
        this.logger.debug("enrichMathDependencies", `Symbol with jiixBlockId ${originalJiixId} no longer exists in model after getVariables, aborting enrichment`)
        return
      }

      mathSymbol = currentSymbol

      if (!variables || variables.length === 0) {
        this.logger.debug("enrichMathDependencies", `No variables found in ${this.editor.jiix.getLabelForStroke(mathSymbol.id)}`)

        const computation = this.editor.math.computation.getMathBlock(originalJiixId)
        if (computation?.variableSources && Object.keys(computation.variableSources).length > 0) {
          this.editor.math.computation.updateDependencies(originalJiixId, computation.dependentBlocks, {})
        }
        return
      }

      this.logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}
      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          this.logger.info("enrichMathDependencies", `Variable "${variable.name}" in "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" sources from block "${variable.sourceId}"`)
          const sourceMathSymbol = this.editor.findMathSymbolByJiixId(variable.sourceId!)

          if (sourceMathSymbol && sourceMathSymbol.jiixBlockId) {
            const sourceComputation = this.editor.math.computation.getMathBlock(sourceMathSymbol.jiixBlockId)
            const currentDependentBlocks = sourceComputation?.dependentBlocks || []

            if (!currentDependentBlocks.includes(mathSymbol.jiixBlockId!)) {
              const updatedDependentBlocks = [...currentDependentBlocks, mathSymbol.jiixBlockId!]
              this.editor.math.computation.updateDependencies(
                sourceMathSymbol.jiixBlockId,
                updatedDependentBlocks,
                sourceComputation?.variableSources
              )
              this.logger.info("enrichMathDependencies", `Added "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" (${mathSymbol.jiixBlockId}) to dependentBlocks of "${this.editor.jiix.getLabelForStroke(sourceMathSymbol.id)}" (${sourceMathSymbol.jiixBlockId})`)
            } else {
              this.logger.debug("enrichMathDependencies", `"${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" already in dependentBlocks of "${this.editor.jiix.getLabelForStroke(sourceMathSymbol.id)}"`)
            }
          } else {
            this.logger.warn("enrichMathDependencies", `Source block "${variable.sourceId}" not found`)
          }
        } else {
          this.logger.debug("enrichMathDependencies", `Variable "${variable.name}" has sourceType "${variable.sourceType}", skipping`)
        }
      }

      const computation = this.editor.math.computation.getMathBlock(originalJiixId)
      this.editor.math.computation.updateDependencies(
        originalJiixId,
        computation?.dependentBlocks,
        newVariableSources
      )

      await this.editor.model.updateSymbol(mathSymbol)

      this.logger.info("enrichMathDependencies", `Enriched "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" with variableSources:`, newVariableSources)

      this.editor.event.emitChanged(this.editor.history.context)
    }
    catch (error) {
      this.logger.error("enrichMathDependencies", { error })
    }
  }

  cleanupMathDependencies(mathSymbols: IIStroke[]): void
  {
    const existingJiixIds = new Set(mathSymbols.map(s => s.jiixBlockId).filter(Boolean))

    mathSymbols.forEach(mathSymbol =>
    {
      if (!mathSymbol.jiixBlockId) return

      let needsUpdate = false
      const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)

      if (!computation) return

      let updatedDependentBlocks = computation.dependentBlocks
      let updatedVariableSources = computation.variableSources

      if (computation.dependentBlocks && computation.dependentBlocks.length > 0) {
        const originalLength = computation.dependentBlocks.length
        updatedDependentBlocks = computation.dependentBlocks.filter(id => existingJiixIds.has(id))
        const removedCount = originalLength - updatedDependentBlocks.length
        if (removedCount > 0) {
          this.logger.info("cleanupMathDependencies", `Cleaned up ${removedCount} invalid dependent block(s) from "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)
          needsUpdate = true
        }
      }

      if (computation.variableSources && Object.keys(computation.variableSources).length > 0) {
        const invalidVariables: string[] = []
        Object.entries(computation.variableSources).forEach(([varName, sourceId]) => {
          if (!existingJiixIds.has(sourceId)) {
            invalidVariables.push(varName)
          }
        })
        if (invalidVariables.length > 0) {
          updatedVariableSources = { ...computation.variableSources }
          invalidVariables.forEach(varName => {
            delete updatedVariableSources![varName]
          })
          this.logger.info("cleanupMathDependencies", `Cleaned up ${invalidVariables.length} invalid variable source(s) from "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.editor.math.computation.updateDependencies(
          mathSymbol.jiixBlockId,
          updatedDependentBlocks,
          updatedVariableSources
        )
      }
    })

    const blockToSources = new Map<string, Set<string>>()
    mathSymbols.forEach(mathSymbol => {
      if (mathSymbol.jiixBlockId) {
        const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
        const sources = computation?.variableSources
          ? new Set(Object.values(computation.variableSources))
          : new Set<string>()
        blockToSources.set(mathSymbol.jiixBlockId, sources)
      }
    })

    mathSymbols.forEach(mathSymbol => {
      if (!mathSymbol.jiixBlockId) return

      const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
      if (!computation?.dependentBlocks || computation.dependentBlocks.length === 0) return

      const originalLength = computation.dependentBlocks.length

      const updatedDependentBlocks = computation.dependentBlocks.filter(depId => {
        const sources = blockToSources.get(depId)
        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not found in blockToSources map, keeping it in dependentBlocks`)
          return true
        }
        const hasReference = sources.has(mathSymbol.jiixBlockId!)
        if (!hasReference) {
          this.logger.info("cleanupMathDependencies", `Removing "${depId}" from dependentBlocks of "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" (${mathSymbol.jiixBlockId}) - block doesn't reference it as a source`)
        }
        return hasReference
      })

      const removedCount = originalLength - updatedDependentBlocks.length
      if (removedCount > 0) {
        this.logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent block(s) from "${this.editor.jiix.getLabelForStroke(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)
        this.editor.math.computation.updateDependencies(
          mathSymbol.jiixBlockId,
          updatedDependentBlocks,
          computation.variableSources
        )
      }
    })
  }
}
