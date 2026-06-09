import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { IIAbstractManager } from "./IIAbstractManager"
import {
  IIMathActionSubManager,
  IIMathComputationSubManager,
  IIMathDependencySubManager,
  IIMathInteractionSubManager,
  IIMathOverlaySubManager,
  TMathBlockComputation
} from "./math"
import { TJIIXMathElement } from "@/model"

/**
 * Main Math manager that orchestrates all math-related sub-managers
 *
 * This manager follows the Facade pattern to provide a unified interface
 * for all math operations while delegating to specialized sub-managers.
 *
 * Sub-managers:
 * - actions: Compute, evaluate, set variables
 * - computation: Store computation data and results
 * - dependencies: Track dependencies between math blocks
 * - interactions: Handle user interactions (click, hover)
 * - overlays: Render visual overlays for math blocks
 *
 * @example Basic usage via facade methods
 * ```typescript
 * const result = await editor.math.computeNumericalResult(blockId)
 * await editor.math.setVariableValues(blockId, { x: 5, y: 10 })
 * editor.math.refreshOverlays()
 * ```
 *
 * @example Direct sub-manager access
 * ```typescript
 * const variables = editor.math.actions.getStoredVariableValues(blockId)
 * const dependents = editor.math.dependencies.getMathDependencies(blockId)
 * ```
 *
 * @group Manager
 */
export class IIMathManager extends IIAbstractManager
{
  protected managerName = "IIMathManager"

  // Sub-managers
  #actions: IIMathActionSubManager
  #computation: IIMathComputationSubManager
  #dependencies: IIMathDependencySubManager
  #interactions: IIMathInteractionSubManager
  #overlays: IIMathOverlaySubManager

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)

    // Initialize all sub-managers
    this.#actions = new IIMathActionSubManager(editor)
    this.#computation = new IIMathComputationSubManager(editor)
    this.#dependencies = new IIMathDependencySubManager(editor)
    this.#interactions = new IIMathInteractionSubManager(editor)
    this.#overlays = new IIMathOverlaySubManager(editor)
  }

  // ==========================================
  // Sub-manager accessors
  // ==========================================

  get actions(): IIMathActionSubManager
  {
    return this.#actions
  }

  get computation(): IIMathComputationSubManager
  {
    return this.#computation
  }

  get dependencies(): IIMathDependencySubManager
  {
    return this.#dependencies
  }

  get interactions(): IIMathInteractionSubManager
  {
    return this.#interactions
  }

  get overlays(): IIMathOverlaySubManager
  {
    return this.#overlays
  }

  // ==========================================
  // Facade methods - Actions
  // ==========================================

  /**
   * Compute numerical result for a math block
   * Delegates to actions sub-manager
   */
  async computeNumericalResult(
    jiixBlockId: string,
    drawStrokes?: boolean
  ): Promise<{ result: TJIIXMathElement, addedStrokesCount: number, value?: number }>
  {
    return this.#actions.computeNumericalResult(jiixBlockId, drawStrokes)
  }

  /**
   * Set variable value for a specific math block
   * Delegates to actions sub-manager
   */
  async setVariableValue(
    jiixBlockId: string,
    variableName: string,
    value: number
  ): Promise<void>
  {
    return this.#actions.setVariableValue(jiixBlockId, variableName, value)
  }

  /**
   * Evaluate a math function
   * Delegates to actions sub-manager
   */
  async evaluateFunction(
    jiixBlockId: string,
    evaluation: {
      inputVariableName: string
      outputVariableName: string
      from: number
      to: number
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]>
  {
    return this.#actions.evaluateFunction(jiixBlockId, evaluation)
  }

  /**
   * Clear solver output strokes for a specific math block
   * Delegates to actions sub-manager
   */
  async clearSolverOutputs(jiixBlockId: string): Promise<void>
  {
    return this.#actions.clearSolverOutputs(jiixBlockId)
  }

  /**
   * Clear solver output strokes for all math blocks
   * Delegates to actions sub-manager
   */
  async clearAllSolverOutputs(): Promise<void>
  {
    return this.#actions.clearAllSolverOutputs()
  }

  // ==========================================
  // Facade methods - Computation
  // ==========================================

  /**
   * Get variable values for a math block
   * Delegates to computation sub-manager
   */
  getStoredVariableValues(jiixBlockId: string): Record<string, number> | undefined
  {
    return this.#actions.getStoredVariableValues(jiixBlockId)
  }

  /**
   * Get computation data for a math block
   * Delegates to computation sub-manager
   */
  getComputation(jiixBlockId: string): TMathBlockComputation | undefined
  {
    return this.#computation.getMathBlock(jiixBlockId)
  }

  // ==========================================
  // Facade methods - Dependencies
  // ==========================================

  /**
   * Recalculate blocks that depend on the given block
   * Delegates to dependencies sub-manager
   */
  async recalculateDependentBlocks(jiixBlockId: string): Promise<void>
  {
    return this.#dependencies.recalculateDependentBlocks(jiixBlockId)
  }

  // ==========================================
  // Facade methods - Overlays
  // ==========================================

  /**
   * Refresh all math overlays
   * Delegates to overlays sub-manager
   */
  refreshOverlays(): void
  {
    this.#overlays.refresh()
  }

  /**
   * Clear all math overlays
   * Delegates to overlays sub-manager
   */
  clearAllOverlays(): void
  {
    this.#overlays.clearAll()
  }

  /**
   * Update overlay for a specific math block
   * Delegates to overlays sub-manager
   */
  updateOverlaysForSymbol(mathBlock: TJIIXMathElement): void
  {
    this.#overlays.updateOverlaysForSymbol(mathBlock)
  }

  // ==========================================
  // Lifecycle
  // ==========================================

  protected onDestroy(): void
  {
    // Destroy all sub-managers
    this.#actions.destroy()
    this.#computation.destroy()
    this.#dependencies.destroy()
    this.#interactions.destroy()
    this.#overlays.destroy()
  }
}
