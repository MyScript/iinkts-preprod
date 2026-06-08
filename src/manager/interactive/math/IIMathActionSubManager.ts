import { IIAbstractManager } from "../IIAbstractManager"
import { TJIIXMathElement, TJIIXMathExpression } from "@/model"
import { TMathVariable, TMathEvaluable } from "@/recognizer"
import { IIStroke, isStroke } from "@/symbol"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { convertMillimeterToPixel } from "@/utils"
import { TStyle } from "@/style/Style"

/**
 * @group Manager
 * @remarks Manager for all math block actions (compute, evaluate, set variables, etc.)
 * Centralizes math operations and delegates data storage to IIMathComputationManager
 */
export class IIMathActionSubManager extends IIAbstractManager
{
  protected managerName = "IIMathActionSubManager"

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  /**
   * Clear solver output strokes for a specific math block
   * @param jiixBlockId - The JIIX block ID
   * @returns Promise that resolves when strokes are removed
   */
  async clearSolverOutputs(jiixBlockId: string): Promise<void>
  {
    this.logger.info("IIMathActionManager.clearSolverOutputs", { jiixBlockId })

    // Find all solver output strokes for this block
    const solverOutputStrokes = this.editor.model.symbols.filter(
      s => isStroke(s) && s.jiixBlockId === jiixBlockId && s.isSolverOutput
    )

    // Remove the strokes from the model
    if (solverOutputStrokes.length > 0) {
      this.editor.removeSymbols(solverOutputStrokes.map(s => s.id), false)
    }

    // Update the computation manager
    this.editor.math.computation.updateSolverOutputs(jiixBlockId, [])
  }

  /**
   * Compute numerical result for a math block
   * @param jiixBlockId - The JIIX block ID
   * @param drawStrokes - Whether to draw the result as strokes (default: true)
   * @returns Promise with the computation result, number of added strokes, and numeric value
   */
  async computeNumericalResult(
    jiixBlockId: string,
    drawStrokes: boolean = true
  ): Promise<{ result: TJIIXMathElement, addedStrokesCount: number, value?: number }>
  {
    this.logger.info("IIMathActionManager.computeNumericalResult", { jiixBlockId, drawStrokes })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    // Clear previous solver outputs
    await this.clearSolverOutputs(jiixBlockId)

    // Call backend to compute
    const result = await this.editor.recognizer.getNumericalComputation(jiixBlockId)
    this.logger.info("Numerical computation completed successfully", result)

    let addedStrokesCount = 0

    // Draw the result strokes if requested
    if (drawStrokes) {
      const firstStroke = this.editor.model.symbols.find(
        s => isStroke(s) && s.jiixBlockId === jiixBlockId
      ) as IIStroke | undefined

      if (firstStroke) {
        const addedStrokes = await this.addSolverOutputStrokes(result)
        addedStrokesCount = addedStrokes.length
        this.logger.info(`Added ${addedStrokesCount} solver output strokes`)

        // Update solver outputs in computation manager
        this.editor.math.computation.updateSolverOutputs(
          jiixBlockId,
          addedStrokes.map(s => s.id)
        )
      }
    }

    // Extract and store the computed value
    let value: number | undefined
    if (result.expressions && Array.isArray(result.expressions)) {
      const equalExpression = result.expressions.find((expr) =>
        expr.type === "=" && "value" in expr && typeof (expr as { value?: unknown }).value === "number"
      )
      if (equalExpression && "value" in equalExpression) {
        value = (equalExpression as { value: number }).value
        this.logger.info("Extracted numerical value", { value })

        // Store in computation manager
        this.editor.math.computation.updateComputationResult(jiixBlockId, value, undefined)
      }
    }

    return { result, addedStrokesCount, value }
  }

  /**
   * Extract solver output strokes from a JIIX math expression
   * Recursively searches for solver-output items and extracts their stroke data
   * @param expression - The JIIX math expression to search
   * @returns Array of stroke data with X, Y coordinates and optional F (force) and T (time)
   * @group Utilities
   */
  protected extractSolverOutputStrokesFromExpression(expression: TJIIXMathExpression): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>
  {
    const items: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

    // Check if this expression is a solver output number with items
    const exprRecord = expression as Record<string, unknown>
    if (expression.type === "number" && exprRecord["solver-output"] === true && exprRecord.items && Array.isArray(exprRecord.items)) {
      items.push(...exprRecord.items as Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>)
    }

    // Recursively search in operands if they exist
    if ("operands" in expression && expression.operands && Array.isArray(expression.operands)) {
      expression.operands.forEach((operand: TJIIXMathExpression) =>
      {
        items.push(...this.extractSolverOutputStrokesFromExpression(operand))
      })
    }
    return items
  }

  /**
   * Extract solver output strokes from a JIIX math element
   * Recursively searches for solver-output items and extracts their stroke data
   * @param mathElement - The JIIX math element to search
   * @returns Array of stroke data with X, Y coordinates and optional F (force) and T (time)
   * @group Utilities
   */
  protected extractSolverOutputStrokes(mathElement: TJIIXMathElement): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>
  {
    this.logger.debug("extractSolverOutputStrokes", "Extracting solver output strokes from math element", mathElement.id)
    const strokes: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

    // Search in all expressions of the math element
    if (mathElement.expressions && Array.isArray(mathElement.expressions)) {
      mathElement.expressions.forEach((expression: TJIIXMathExpression) =>
      {
        strokes.push(...this.extractSolverOutputStrokesFromExpression(expression))
      })
    }

    this.logger.debug("extractSolverOutputStrokes", `Found ${strokes.length} solver output stroke(s)`)
    // strokes.forEach(s => s.
    return strokes
  }

  /**
   * Add solver output strokes to a math symbol
   * @param result - JIIX math result containing solver output
   * @param mathSymbol - Math symbol to add strokes to
   * @param style - Optional style for the strokes
   * @returns Promise resolving to array of added strokes
   * @group Utilities
   */
  async addSolverOutputStrokes(result: TJIIXMathElement, style?: TStyle): Promise<IIStroke[]>
  {
    this.logger.info("addSolverOutputStrokes", { result })

    const solverStrokes = this.extractSolverOutputStrokes(result)
    this.logger.debug("addSolverOutputStrokes", `Found ${ solverStrokes.length } solver output strokes`)

    const addedStrokes: IIStroke[] = []
    const defaultStyle = style || { color: "#4caf50", width: 5 } // Green color for solver output

    for (const strokeData of solverStrokes) {
      if (!strokeData.X || !strokeData.Y) {
        this.logger.warn("addSolverOutputStrokes", "Stroke data missing X or Y coordinates")
        continue
      }

      const pointers = strokeData.X.map((x: number, i: number) => ({
        x: convertMillimeterToPixel(x),
        y: convertMillimeterToPixel(strokeData.Y[i]),
        p: strokeData.F?.[i] || 1,
        t: strokeData.T?.[i] || i
      }))

      const stroke = IIStroke.create({
        pointers,
        style: defaultStyle,
        isSolverOutput: true,
      })

      await this.editor.addSymbol(stroke)
      addedStrokes.push(stroke)
      this.logger.debug("addSolverOutputStrokes", "Added solver output stroke:", stroke.id)
    }
    return addedStrokes
  }

  /**
   * Set a single variable value for a math block
   * @param jiixBlockId - The JIIX block ID
   * @param variableName - Name of the variable to set
   * @param variableValue - Value to assign to the variable
   * @returns Promise that resolves when the variable is set
   */
  async setVariableValue(
    jiixBlockId: string,
    variableName: string,
    variableValue: number
  ): Promise<void>
  {
    this.logger.info("IIMathActionManager.setVariableValue", {
      jiixBlockId,
      variableName,
      variableValue
    })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    // Clear previous solver outputs
    await this.clearSolverOutputs(jiixBlockId)

    // Call backend to set variable
    await this.editor.recognizer.setVariableValue(jiixBlockId, variableName, variableValue)

    // Update computation manager with new variable value
    const existingBlock = this.editor.math.computation.getMathBlock(jiixBlockId)
    const updatedVariableValues = {
      ...(existingBlock?.variableValues || {}),
      [variableName]: variableValue
    }
    this.editor.math.computation.updateComputationResult(jiixBlockId, undefined, updatedVariableValues)

    // Recalculate dependent blocks
    this.logger.info("Variable value changed, recalculating dependent blocks", { jiixBlockId })
    await this.editor.math.dependencies.recalculateDependentBlocks(jiixBlockId)
  }

  /**
   * Set multiple variable values for a math block
   * @param jiixBlockId - The JIIX block ID
   * @param variableValues - Object with variable names as keys and their values
   * @returns Promise that resolves when all variables are set
   */
  async setVariables(
    jiixBlockId: string,
    variableValues: Record<string, number>
  ): Promise<void>
  {
    this.logger.info("IIMathActionManager.setVariables", { jiixBlockId, variableValues })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    // Set each variable one by one
    for (const [variableName, variableValue] of Object.entries(variableValues)) {
      await this.setVariableValue(jiixBlockId, variableName, variableValue)
    }
  }

  /**
   * Evaluate a math function for a range of input values
   * @param jiixBlockId - The JIIX block ID
   * @param evaluation - Evaluation parameters (input/output variables, range, point count)
   * @returns Promise with array of arrays containing evaluation points
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
    this.logger.info("IIMathActionManager.evaluateFunction", { jiixBlockId, evaluation })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    // Call backend to evaluate
    const series = await this.editor.recognizer.evaluate(jiixBlockId, evaluation)
    this.logger.info("Function evaluated successfully", {
      seriesCount: series.length,
      totalPoints: series.reduce((sum, s) => sum + s.length, 0)
    })

    return series
  }

  /**
   * Get available variables for a math block
   * @param jiixBlockId - The JIIX block ID
   * @returns Promise with array of variables
   */
  async getVariables(jiixBlockId: string): Promise<TMathVariable[]>
  {
    if (!jiixBlockId) {
      this.logger.warn("IIMathActionManager.getVariables", "jiixBlockId is empty, returning empty array")
      return []
    }

    this.logger.info("IIMathActionManager.getVariables", { jiixBlockId })
    return await this.editor.recognizer.getVariables(jiixBlockId)
  }

  /**
   * Get a single variable value from a math block
   * @param jiixBlockId - The JIIX block ID
   * @param variableName - Name of the variable
   * @returns Promise with the variable value
   */
  async getVariableValue(jiixBlockId: string, variableName: string): Promise<number>
  {
    this.logger.info("IIMathActionManager.getVariableValue", { jiixBlockId, variableName })
    return await this.editor.recognizer.getVariableValue(jiixBlockId, variableName)
  }

  /**
   * Get available evaluables (functions) for a math block
   * @param jiixBlockId - The JIIX block ID
   * @returns Promise with array of evaluables
   */
  async getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]>
  {
    this.logger.info("IIMathActionManager.getEvaluables", { jiixBlockId })
    return await this.editor.recognizer.getEvaluables(jiixBlockId)
  }

  /**
   * Get available actions for a math block
   * @param jiixBlockId - The JIIX block ID
   * @returns Promise with array of available action names
   */
  async getAvailableActions(jiixBlockId: string): Promise<string[]>
  {
    this.logger.info("IIMathActionManager.getAvailableActions", { jiixBlockId })
    return await this.editor.recognizer.getAvailableActions(jiixBlockId)
  }

  /**
   * Get diagnostic result for a specific math task
   * @param jiixBlockId - The JIIX block ID
   * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
   * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
   */
  async getDiagnostic(jiixBlockId: string, task: string): Promise<string>
  {
    this.logger.info("IIMathActionManager.getDiagnostic", { jiixBlockId, task })
    return await this.editor.recognizer.getDiagnostic(jiixBlockId, task)
  }

  /**
   * Get stored variable values for a math block from computation manager
   * @param jiixBlockId - The JIIX block ID
   * @returns Variable values or undefined if not found
   */
  getStoredVariableValues(jiixBlockId: string): Record<string, number> | undefined
  {
    const block = this.editor.math.computation.getMathBlock(jiixBlockId)
    return block?.variableValues
  }

  /**
   * Get stored computed result for a math block from computation manager
   * @param jiixBlockId - The JIIX block ID
   * @returns Computed result or undefined if not found
   */
  getStoredComputedResult(jiixBlockId: string): unknown
  {
    const block = this.editor.math.computation.getMathBlock(jiixBlockId)
    return block?.computedResult
  }

  /**
   * Get stored solver output stroke IDs for a math block from computation manager
   * @param jiixBlockId - The JIIX block ID
   * @returns Array of solver output stroke IDs or undefined if not found
   */
  getStoredSolverOutputs(jiixBlockId: string): string[] | undefined
  {
    const block = this.editor.math.computation.getMathBlock(jiixBlockId)
    return block?.solverOutputStrokeIds
  }
}
