import { IIAbstractManager } from "../IIAbstractManager"
import { TJIIXMathElement, TJIIXMathExpression } from "@/model"
import { IIStroke, isStroke } from "@/symbol"
import { convertMillimeterToPixel } from "@/utils"
import { TStyle } from "@/style/Style"
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
 * Sub-manager responsible for tracking math block computations and running numerical solver operations
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

  // ==========================================
  // Computation cache accessors
  // ==========================================

  get computations(): ReadonlyMap<string, TMathBlockComputation>
  {
    return this.#computations
  }

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

  updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputs", { jiixBlockId, count: solverOutputStrokeIds.length })

    const computation = this.#computations.get(jiixBlockId) ?? {}
    this.#computations.set(jiixBlockId, { ...computation, solverOutputStrokeIds })
  }

  updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void
  {
    this.logger.debug("updateSolverOutputsForAll", { count: solverOutputStrokeIds.length })

    for (const [id, computation] of this.#computations) {
      this.#computations.set(id, { ...computation, solverOutputStrokeIds })
    }
  }

  getMathBlock(jiixBlockId: string): TMathBlockComputation | undefined
  {
    return this.#computations.get(jiixBlockId)
  }

  getComputedBlocks(): TMathBlockComputation[]
  {
    return Array.from(this.#computations.values()).filter(c => c.computedResult !== undefined)
  }

  removeMathBlock(jiixBlockId: string): void
  {
    this.logger.debug("removeMathBlock", { jiixBlockId })
    this.#computations.delete(jiixBlockId)
  }

  getStoredComputedResult(jiixBlockId: string): unknown
  {
    return this.#computations.get(jiixBlockId)?.computedResult
  }

  getStoredSolverOutputs(jiixBlockId: string): string[] | undefined
  {
    return this.#computations.get(jiixBlockId)?.solverOutputStrokeIds
  }

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

  // ==========================================
  // Solver output stroke management
  // ==========================================

  async clearSolverOutputs(jiixBlockId: string): Promise<void>
  {
    this.logger.info("clearSolverOutputs", { jiixBlockId })

    const solverOutputStrokes = this.editor.model.symbols.filter(
      s => isStroke(s) && s.jiixBlockId === jiixBlockId && s.isSolverOutput
    )

    if (solverOutputStrokes.length > 0) {
      this.editor.removeSymbols(solverOutputStrokes.map(s => s.id), false)
    }

    this.updateSolverOutputs(jiixBlockId, [])
  }

  async clearAllSolverOutputs(): Promise<void>
  {
    this.logger.info("clearAllSolverOutputs")

    const solverOutputStrokes = this.editor.model.symbols.filter(
      s => isStroke(s) && s.isSolverOutput
    )

    if (solverOutputStrokes.length > 0) {
      this.editor.removeSymbols(solverOutputStrokes.map(s => s.id), false)
    }

    this.updateSolverOutputsForAll([])
  }

  // ==========================================
  // Numerical computation
  // ==========================================

  async computeNumericalResult(
    jiixBlockId: string,
    drawStrokes: boolean = true
  ): Promise<{ result: TJIIXMathElement, addedStrokesCount: number, value?: number }>
  {
    this.logger.info("computeNumericalResult", { jiixBlockId, drawStrokes })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    await this.clearSolverOutputs(jiixBlockId)

    const result = await this.editor.recognizer.getNumericalComputation(jiixBlockId)
    this.logger.info("computeNumericalResult", "Numerical computation completed successfully", result)

    let addedStrokesCount = 0

    if (drawStrokes) {
      const firstStroke = this.editor.model.symbols.find(
        s => isStroke(s) && s.jiixBlockId === jiixBlockId
      ) as IIStroke | undefined

      if (firstStroke) {
        const addedStrokes = await this.addSolverOutputStrokes(result)
        addedStrokesCount = addedStrokes.length
        this.logger.info("computeNumericalResult", `Added ${addedStrokesCount} solver output strokes`)

        this.updateSolverOutputs(jiixBlockId, addedStrokes.map(s => s.id))
      }
    }

    let value: number | undefined
    if (result.expressions && Array.isArray(result.expressions)) {
      const equalExpression = result.expressions.find((expr) =>
        expr.type === "=" && "value" in expr && typeof (expr as { value?: unknown }).value === "number"
      )
      if (equalExpression && "value" in equalExpression) {
        value = (equalExpression as { value: number }).value
        this.logger.info("computeNumericalResult", "Extracted numerical value", { value })
        this.updateComputationResult(jiixBlockId, value)
      }
    }

    return { result, addedStrokesCount, value }
  }

  async computeAllNumericalResults(): Promise<void>
  {
    this.logger.info("computeAllNumericalResults")

    const jiixBlocks = this.editor.model.getMathBlocks()

    for (const mathSymbol of jiixBlocks) {
      try {
        await this.computeNumericalResult(mathSymbol.id, true)
      }
      catch (error) {
        this.logger.error("computeAllNumericalResults", `Error computing numerical result for block ${mathSymbol.id}:`, error)
      }
    }
  }

  // ==========================================
  // Solver output stroke helpers
  // ==========================================

  protected extractSolverOutputStrokesFromExpression(expression: TJIIXMathExpression): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>
  {
    const items: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

    const exprRecord = expression as Record<string, unknown>
    if (expression.type === "number" && exprRecord["solver-output"] === true && exprRecord.items && Array.isArray(exprRecord.items)) {
      items.push(...exprRecord.items as Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>)
    }

    if ("operands" in expression && expression.operands && Array.isArray(expression.operands)) {
      expression.operands.forEach((operand: TJIIXMathExpression) =>
      {
        items.push(...this.extractSolverOutputStrokesFromExpression(operand))
      })
    }
    return items
  }

  protected extractSolverOutputStrokes(mathElement: TJIIXMathElement): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>
  {
    this.logger.debug("extractSolverOutputStrokes", "Extracting solver output strokes from math element", mathElement.id)
    const strokes: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

    if (mathElement.expressions && Array.isArray(mathElement.expressions)) {
      mathElement.expressions.forEach((expression: TJIIXMathExpression) =>
      {
        strokes.push(...this.extractSolverOutputStrokesFromExpression(expression))
      })
    }

    this.logger.debug("extractSolverOutputStrokes", `Found ${strokes.length} solver output stroke(s)`)
    return strokes
  }

  async addSolverOutputStrokes(result: TJIIXMathElement, style?: TStyle): Promise<IIStroke[]>
  {
    this.logger.info("addSolverOutputStrokes", { result })

    const solverStrokes = this.extractSolverOutputStrokes(result)
    this.logger.debug("addSolverOutputStrokes", `Found ${ solverStrokes.length } solver output strokes`)

    const addedStrokes: IIStroke[] = []
    const defaultStyle = style || { color: "#4caf50", width: 5 }

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

  // ==========================================
  // Lifecycle
  // ==========================================

  clear(): void
  {
    this.logger.info("clear", "Clearing all math computations")
    this.#computations.clear()
  }

  protected onDestroy(): void
  {
    this.clear()
  }
}
