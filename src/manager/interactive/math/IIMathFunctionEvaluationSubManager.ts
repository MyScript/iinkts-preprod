import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TMathEvaluable } from "@/recognizer"

import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Sub-manager responsible for math function evaluation
 * @group Manager
 */
export class IIMathFunctionEvaluationSubManager extends IIAbstractManager {
  protected managerName = "IIMathFunctionEvaluationSubManager"

  constructor(editor: TInteractiveInkEditor) {
    super(editor, LoggerCategory.MATH)
  }

  async evaluateFunction(
    jiixBlockId: string,
    evaluation: {
      inputVariableName: string
      outputVariableName: string
      from: number
      to: number
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]> {
    this.logger.info("evaluateFunction", {
      jiixBlockId,
      evaluation,
    })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    const series = await this.editor.recognizer.evaluate(jiixBlockId, evaluation)
    this.logger.info("evaluateFunction", {
      seriesCount: series.length,
      totalPoints: series.reduce((sum, s) => sum + s.length, 0),
    })

    return series
  }

  async getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]> {
    this.logger.info("getEvaluables", {
      jiixBlockId,
    })
    return this.editor.recognizer.getEvaluables(jiixBlockId)
  }
}
