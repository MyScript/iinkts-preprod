import { IIAbstractManager } from "../IIAbstractManager"
import { IIStroke } from "@/symbol"
import { TJIIXMathElement } from "@/model"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Computation data for a math block
 * @group Manager
 */
export type TMathBlockComputation = {
  /** JIIX math element data */
  jiixElement: TJIIXMathElement
  /** Strokes that compose this math block */
  strokes: IIStroke[]
  /** Variable values (e.g., { x: 5, y: 10 }) */
  variableValues?: Record<string, number>
  /** Computed result from the solver */
  computedResult?: unknown
  /** IDs of strokes that are solver outputs */
  solverOutputStrokeIds?: string[]
  /** Blocks that depend on this block */
  dependentBlocks?: string[]
  /** Sources of variables used in this block */
  variableSources?: Record<string, string>
  /** Last computation timestamp */
  lastComputedAt?: number
}

/**
 * Sub-manager responsible for tracking math block computations
 * Maintains a map of JIIX math blocks with their associated strokes and computation results
 * @group Manager
 */
export class IIMathComputationSubManager extends IIAbstractManager
{
  protected managerName = "IIMathComputationSubManager"

  #computations = new Map<string, TMathBlockComputation>()

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  /**
   * Get the internal computations map
   */
  get computations(): ReadonlyMap<string, TMathBlockComputation>
  {
    return this.#computations
  }

  /**
   * Update or create computation data for a math block
   * @param jiixBlockId - JIIX ID of the math block
   * @param jiixElement - JIIX math element data
   * @param strokes - Strokes composing this block
   */
  updateMathBlock(jiixBlockId: string, jiixElement: TJIIXMathElement, strokes: IIStroke[]): void
  {
    this.logger.debug("updateMathBlock", { jiixBlockId, strokeCount: strokes.length })

    const existing = this.#computations.get(jiixBlockId)

    // Preserve existing computation data when updating the block
    const computation: TMathBlockComputation = {
      jiixElement,
      strokes,
      variableValues: existing?.variableValues,
      computedResult: existing?.computedResult,
      solverOutputStrokeIds: existing?.solverOutputStrokeIds,
      dependentBlocks: existing?.dependentBlocks,
      variableSources: existing?.variableSources,
      lastComputedAt: existing?.lastComputedAt
    }

    this.#computations.set(jiixBlockId, computation)
  }

  /**
   * Update computation result for a math block
   * @param jiixBlockId - JIIX ID of the math block
   * @param result - Computation result
   * @param variableValues - Variable values used in computation
   */
  updateComputationResult(jiixBlockId: string, result: unknown, variableValues?: Record<string, number>): void
  {
    this.logger.debug("updateComputationResult", { jiixBlockId, result })

    const computation = this.#computations.get(jiixBlockId)
    if (!computation) {
      this.logger.warn("updateComputationResult", `Math block not found: ${jiixBlockId}`)
      return
    }

    computation.computedResult = result
    computation.lastComputedAt = Date.now()

    if (variableValues) {
      computation.variableValues = variableValues
    }
  }

  /**
   * Update solver output strokes for a math block
   * @param jiixBlockId - JIIX ID of the math block
   * @param solverOutputStrokeIds - IDs of strokes that are solver outputs
   */
  updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputs", { jiixBlockId, count: solverOutputStrokeIds.length })

    const computation = this.#computations.get(jiixBlockId)
    if (!computation) {
      this.logger.warn("updateSolverOutputs", `Math block not found: ${jiixBlockId}`)
      return
    }

    computation.solverOutputStrokeIds = solverOutputStrokeIds
  }

  /**
   * Update solver output strokes for all math blocks
   * @param solverOutputStrokeIds - IDs of strokes that are solver outputs
   */
  updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputsForAll", { count: solverOutputStrokeIds.length })

    for (const computation of this.#computations.values()) {
      computation.solverOutputStrokeIds = solverOutputStrokeIds
    }
  }

  /**
   * Update dependencies for a math block
   * @param jiixBlockId - JIIX ID of the math block
   * @param dependentBlocks - IDs of blocks that depend on this one
   * @param variableSources - Sources of variables used in this block
   */
  updateDependencies(jiixBlockId: string, dependentBlocks?: string[], variableSources?: Record<string, string>): void
  {
    this.logger.debug("updateDependencies", { jiixBlockId, dependentBlocks, variableSources })

    const computation = this.#computations.get(jiixBlockId)
    if (!computation) {
      this.logger.warn("updateDependencies", `Math block not found: ${jiixBlockId}`)
      return
    }

    if (dependentBlocks !== undefined) {
      computation.dependentBlocks = dependentBlocks
    }
    if (variableSources !== undefined) {
      computation.variableSources = variableSources
    }
  }

  /**
   * Get computation data for a specific math block
   * @param jiixBlockId - JIIX ID of the math block
   * @returns Computation data or undefined if not found
   */
  getMathBlock(jiixBlockId: string): TMathBlockComputation | undefined
  {
    return this.#computations.get(jiixBlockId)
  }

  /**
   * Get variable values for a specific math block
   * @param jiixBlockId - JIIX ID of the math block
   * @returns Variable values or undefined
   */
  getVariableValues(jiixBlockId: string): Record<string, number> | undefined
  {
    return this.#computations.get(jiixBlockId)?.variableValues
  }

  /**
   * Get all math blocks that have computation results
   * @returns Array of math blocks with results
   */
  getComputedBlocks(): TMathBlockComputation[]
  {
    return Array.from(this.#computations.values()).filter(c => c.computedResult !== undefined)
  }

  /**
   * Get all math blocks that have dependencies
   * @returns Array of math blocks with dependencies
   */
  getBlocksWithDependencies(): TMathBlockComputation[]
  {
    return Array.from(this.#computations.values()).filter(
      c => (c.dependentBlocks && c.dependentBlocks.length > 0) ||
           (c.variableSources && Object.keys(c.variableSources).length > 0)
    )
  }

  /**
   * Remove a math block from the computation map
   * @param jiixBlockId - JIIX ID of the math block to remove
   */
  removeMathBlock(jiixBlockId: string): void
  {
    this.logger.debug("removeMathBlock", { jiixBlockId })
    this.#computations.delete(jiixBlockId)
  }

  /**
   * Clear all computation data
   */
  clear(): void
  {
    this.logger.info("clear", "Clearing all math computations")
    this.#computations.clear()
  }

  /**
   * Synchronize computation map with current model state
   * Updates the map based on JIIX export and current symbols
   */
  syncWithModel(): void
  {
    this.logger.info("syncWithModel", "Synchronizing with model")

    // Get all math blocks from JIIX export
    const mathBlocks = this.model.getMathBlocks()

    // Track which blocks are still present
    const presentBlockIds = new Set<string>()

    // Update or add math blocks
    mathBlocks.forEach(jiixElement => {
      presentBlockIds.add(jiixElement.id)

      // Find all strokes for this block
      const strokes = this.model.symbols.filter(
        s => s instanceof IIStroke && s.jiixBlockId === jiixElement.id
      ) as IIStroke[]

      this.updateMathBlock(jiixElement.id, jiixElement, strokes)
    })

    // Remove blocks that are no longer in the export
    const blockIdsToRemove: string[] = []
    this.#computations.forEach((_, jiixBlockId) => {
      if (!presentBlockIds.has(jiixBlockId)) {
        blockIdsToRemove.push(jiixBlockId)
      }
    })

    blockIdsToRemove.forEach(id => this.removeMathBlock(id))

    this.logger.info("syncWithModel", `Synchronized ${presentBlockIds.size} blocks, removed ${blockIdsToRemove.length} blocks`)
  }

  /**
   * Get statistics about current computations
   * @returns Object with computation statistics
   */
  getStats(): {
    totalBlocks: number
    computedBlocks: number
    blocksWithDependencies: number
    blocksWithSolverOutputs: number
  }
  {
    const computations = Array.from(this.#computations.values())

    return {
      totalBlocks: computations.length,
      computedBlocks: computations.filter(c => c.computedResult !== undefined).length,
      blocksWithDependencies: computations.filter(c =>
        (c.dependentBlocks && c.dependentBlocks.length > 0) ||
        (c.variableSources && Object.keys(c.variableSources).length > 0)
      ).length,
      blocksWithSolverOutputs: computations.filter(c =>
        c.solverOutputStrokeIds && c.solverOutputStrokeIds.length > 0
      ).length
    }
  }

  protected onDestroy(): void
  {
    this.clear()
  }
}
