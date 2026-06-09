import { IIAbstractManager } from "../IIAbstractManager"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Computation data for a math block
 * @group Manager
 */
export type TMathBlockComputation = {
  /** Computed result from the solver */
  computedResult?: unknown
  /** IDs of strokes that are solver outputs */
  solverOutputStrokeIds?: string[]
  /** Last computation timestamp */
  lastComputedAt?: number
}

/**
 * Sub-manager responsible for tracking math block computations
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
   * Update computation result for a math block.
   * Creates the entry if it does not exist yet.
   * @param jiixBlockId - JIIX ID of the math block
   * @param result - Computation result
   */
  updateComputationResult(jiixBlockId: string, result: unknown): void
  {
    this.logger.debug("updateComputationResult", { jiixBlockId, result })

    const computation = this.#computations.get(jiixBlockId) ?? {}
    this.#computations.set(jiixBlockId, {
      ...computation,
      computedResult: result,
      lastComputedAt: Date.now()
    })
  }

  /**
   * Update solver output strokes for a math block.
   * Creates the entry if it does not exist yet.
   * @param jiixBlockId - JIIX ID of the math block
   * @param solverOutputStrokeIds - IDs of strokes that are solver outputs
   */
  updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputs", { jiixBlockId, count: solverOutputStrokeIds.length })

    const computation = this.#computations.get(jiixBlockId) ?? {}
    this.#computations.set(jiixBlockId, { ...computation, solverOutputStrokeIds })
  }

  /**
   * Update solver output strokes for all math blocks
   * @param solverOutputStrokeIds - IDs of strokes that are solver outputs
   */
  updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputsForAll", { count: solverOutputStrokeIds.length })

    for (const [id, computation] of this.#computations) {
      this.#computations.set(id, { ...computation, solverOutputStrokeIds })
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
   * Get all math blocks that have computation results
   * @returns Array of math blocks with results
   */
  getComputedBlocks(): TMathBlockComputation[]
  {
    return Array.from(this.#computations.values()).filter(c => c.computedResult !== undefined)
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
   * Get statistics about current computations
   * @returns Object with computation statistics
   */
  getStats(): {
    totalBlocks: number
    computedBlocks: number
    blocksWithSolverOutputs: number
  }
  {
    const computations = Array.from(this.#computations.values())

    return {
      totalBlocks: computations.length,
      computedBlocks: computations.filter(c => c.computedResult !== undefined).length,
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
