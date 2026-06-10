import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { IIAbstractManager } from "./IIAbstractManager"
import {
  IIMathComputationSubManager,
  IIMathFunctionEvaluationSubManager,
  IIMathOverlaySubManager,
  IIMathVariableSubManager,
  MathDependencies,
  TMathBlockComputation,
  TMathInteractionConfig,
  TMathOverlayConfig,
} from "./math"
import { TJIIXMathElement } from "@/model"
import { TMathEvaluable, TMathVariable } from "@/recognizer/RecognizerWebSocketMessage"

/**
 * Main Math manager that orchestrates all math-related sub-managers.
 *
 * Sub-managers:
 * - computation: Computation cache, solver I/O, numerical result ops
 * - variables: Variable state, dependency tracking, visual interactions (hover/select)
 * - evaluation: Function evaluation
 * - overlays: Render visual overlays for math blocks
 *
 * @group Manager
 */
export class IIMathManager extends IIAbstractManager
{
  protected managerName = "IIMathManager"

  // Sub-managers
  #computation: IIMathComputationSubManager
  #variables: IIMathVariableSubManager
  #evaluation: IIMathFunctionEvaluationSubManager
  #overlays: IIMathOverlaySubManager

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)

    this.#computation = new IIMathComputationSubManager(editor)
    this.#variables = new IIMathVariableSubManager(editor)
    this.#evaluation = new IIMathFunctionEvaluationSubManager(editor)
    this.#overlays = new IIMathOverlaySubManager(editor)
  }

  /**
   * @internal — used only by math sub-managers (variables)
   */
  get overlays(): IIMathOverlaySubManager
  {
    return this.#overlays
  }

  // ==========================================
  // Computation facades
  // ==========================================

  async computeNumericalResult(
    jiixBlockId: string,
    drawStrokes?: boolean
  ): Promise<{ result: TJIIXMathElement, addedStrokesCount: number, value?: number }>
  {
    return this.#computation.computeNumericalResult(jiixBlockId, drawStrokes)
  }

  async computeAllNumericalResults(): Promise<void>
  {
    return this.#computation.computeAllNumericalResults()
  }

  async clearSolverOutputs(jiixBlockId: string): Promise<void>
  {
    return this.#computation.clearSolverOutputs(jiixBlockId)
  }

  async clearAllSolverOutputs(): Promise<void>
  {
    return this.#computation.clearAllSolverOutputs()
  }

  getComputation(jiixBlockId: string): TMathBlockComputation | undefined
  {
    return this.#computation.getMathBlock(jiixBlockId)
  }

  getStoredSolverOutputs(jiixBlockId: string): string[] | undefined
  {
    return this.#computation.getStoredSolverOutputs(jiixBlockId)
  }

  // ==========================================
  // Variable facades
  // ==========================================

  async setVariableValue(
    jiixBlockId: string,
    variableName: string,
    value: number
  ): Promise<void>
  {
    this.logger.info("setVariableValue", { jiixBlockId, variableName, value })
    await this.#computation.clearSolverOutputs(jiixBlockId)
    await this.#variables.setVariableValue(jiixBlockId, variableName, value)
    await this.recalculateDependentBlocks(jiixBlockId)
  }

  async getVariables(jiixBlockId: string): Promise<TMathVariable[]>
  {
    return this.#variables.getVariables(jiixBlockId)
  }

  async setVariables(
    jiixBlockId: string,
    variableValues: Record<string, number>
  ): Promise<void>
  {
    this.logger.info("setVariables", { jiixBlockId, variableValues })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    for (const [variableName, variableValue] of Object.entries(variableValues)) {
      await this.setVariableValue(jiixBlockId, variableName, variableValue)
    }
  }

  async getVariableValue(jiixBlockId: string, variableName: string): Promise<number>
  {
    return this.#variables.getVariableValue(jiixBlockId, variableName)
  }

  getStoredVariableValues(jiixBlockId: string): Record<string, number> | undefined
  {
    return this.#variables.getStoredVariableValues(jiixBlockId)
  }

  getDependencies(jiixBlockId: string): MathDependencies | null
  {
    return this.#variables.getDependencies(jiixBlockId)
  }

  async enrichMathDependencies(jiixBlockId: string): Promise<void>
  {
    return this.#variables.enrichMathDependencies(jiixBlockId)
  }

  cleanupMathDependencies(jiixBlockIds: string[]): void
  {
    this.#variables.cleanupMathDependencies(jiixBlockIds)
  }

  async recalculateDependentBlocks(sourceBlockId: string): Promise<void>
  {
    this.logger.info("recalculateDependentBlocks", { sourceBlockId })

    const deps = this.#variables.getDependencies(sourceBlockId)
    if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) {
      this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.logger.info("recalculateDependentBlocks", `Found ${deps.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of deps.dependentBlocks) {
      try {
        this.logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
        await this.#computation.computeNumericalResult(dependentBlockId, this.editor.drawComputationResult)
      }
      catch (computeError) {
        this.logger.error("recalculateDependentBlocks", `Error computing ${dependentBlockId}:`, computeError)
      }
    }

    this.logger.info("recalculateDependentBlocks", "All dependent blocks recalculated")
    this.editor.event.emitChanged(this.editor.history.context)
  }

  selectBlock(jiixBlockId: string): void
  {
    this.#variables.selectBlock(jiixBlockId)
  }

  clearBlockSelection(): void
  {
    this.#variables.clearBlockSelection()
  }

  onSymbolHover(jiixBlockId: string | null): void
  {
    this.#variables.onSymbolHover(jiixBlockId)
  }

  getVariablesConfig(): TMathInteractionConfig
  {
    return this.#variables.getConfig()
  }

  updateVariablesConfig(config: Partial<TMathInteractionConfig>): void
  {
    this.#variables.updateConfig(config)
  }

  clearVariableInteractions(): void
  {
    this.#variables.clearAll()
  }

  // ==========================================
  // Evaluation facades
  // ==========================================

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
    return this.#evaluation.evaluateFunction(jiixBlockId, evaluation)
  }

  async getEvaluables(blockId: string): Promise<TMathEvaluable[]>
  {
    return this.#evaluation.getEvaluables(blockId)
  }

  // ==========================================
  // Diagnostic facades
  // ==========================================

  async getDiagnostic(jiixBlockId: string, task: string): Promise<string>
  {
    this.logger.info("getDiagnostic", { jiixBlockId, task })
    return await this.editor.recognizer.getDiagnostic(jiixBlockId, task)
  }

  async getAvailableActions(jiixBlockId: string): Promise<string[]>
  {
    this.logger.info("getAvailableActions", { jiixBlockId })
    return await this.editor.recognizer.getAvailableActions(jiixBlockId)
  }

  // ==========================================
  // Overlay facades
  // ==========================================

  refreshOverlays(): void
  {
    this.#overlays.refresh()
  }

  clearAllOverlays(): void
  {
    this.#overlays.clearAll()
  }

  getOverlaysConfig(): TMathOverlayConfig
  {
    return this.#overlays.getConfig()
  }

  updateOverlaysConfig(config: Partial<TMathOverlayConfig>): void
  {
    this.#overlays.updateConfig(config)
  }

  toggleBlockOverlays(show: boolean): void
  {
    this.#overlays.toggleBlockOverlays(show)
  }

  protected onDestroy(): void
  {
    this.#computation.destroy()
    this.#variables.destroy()
    this.#evaluation.destroy()
    this.#overlays.destroy()
  }
}
