import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { IIRecognizedMath, isRecognizedMathSymbol } from "../../symbol"
import { Modal, ModalField } from "../../components"
import { Chart } from "../../components"
import { LoggerCategory, LoggerManager } from "../../logger"
import { getMathDiagnosticMessage } from "../../constants/MathDiagnosticMessages"

/**
 * @group Menu
 * @remarks Menu contextuel Math - Opérations mathématiques sur les symboles
 */
export class MathContextMenu extends SubMenuItem
{
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)

  readonly id: string
  readonly idEditVariables: string
  readonly idNumericalComputation: string
  readonly idCheckDiagnostic: string
  readonly idEvaluate: string

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const id = `${idPrefix}-math`
    const idEditVariables = `${id}-variables`
    const idNumericalComputation = `${id}-numerical-computation`
    const idCheckDiagnostic = `${id}-check-diagnostic`
    const idEvaluate = `${id}-evaluate`
    const config: IMenuSubMenu = {
      id: id,
      type: "submenu",
      label: "Math",
      position: "right",
      items: [
        {
          id: idCheckDiagnostic,
          type: "button",
          label: "Check diagnostic",
          action: async () => {
            this.logger.info("Check diagnostic clicked")

            try {
              const symbolsSelected = editor.model.symbolsSelected
              const mathSymbols = symbolsSelected.filter(isRecognizedMathSymbol)

              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }

              const mathSymbol = mathSymbols[0]

              if (!mathSymbol.jiixId) {
                this.logger.warn("Selected math symbol does not have jiixId")
                return
              }

              // Check diagnostic for both tasks
              const computeDiagnostic = await editor.getDiagnostic(mathSymbol.jiixId, "numerical-computation")
              const evaluationDiagnostic = await editor.getDiagnostic(mathSymbol.jiixId, "evaluation")

              this.logger.info("Numerical computation diagnostic:", computeDiagnostic)
              this.logger.info("Evaluation diagnostic:", evaluationDiagnostic)

              const computeInfo = getMathDiagnosticMessage(computeDiagnostic)
              const evalInfo = getMathDiagnosticMessage(evaluationDiagnostic)

              // Severity colors configuration
              const severityColors = {
                success: { bg: "#e8f5e9", color: "#2e7d32", icon: "✓" },
                warning: { bg: "#fff3e0", color: "#f57c00", icon: "⚠" },
                error: { bg: "#ffebee", color: "#c62828", icon: "✗" },
                info: { bg: "#e3f2fd", color: "#1976d2", icon: "ℹ" }
              }

              // Helper function to create diagnostic section
              const createDiagnosticSection = (
                taskName: string,
                diagnosticCode: string,
                diagnosticInfo: { title: string, message: string, severity: "success" | "warning" | "error" | "info" }
              ) => {
                const section = document.createElement("div")
                section.style.marginBottom = "20px"
                section.style.padding = "16px"
                section.style.background = "#fafafa"
                section.style.borderRadius = "6px"
                section.style.border = "1px solid #e0e0e0"

                // Task title
                const taskTitle = document.createElement("div")
                taskTitle.style.fontSize = "15px"
                taskTitle.style.fontWeight = "600"
                taskTitle.style.marginBottom = "12px"
                taskTitle.style.color = "#424242"
                taskTitle.textContent = taskName
                section.appendChild(taskTitle)

                // Diagnostic code
                const codeDiv = document.createElement("div")
                codeDiv.style.fontSize = "13px"
                codeDiv.style.marginBottom = "12px"
                codeDiv.style.padding = "8px 10px"
                codeDiv.style.background = "#f5f5f5"
                codeDiv.style.borderRadius = "4px"
                codeDiv.style.fontFamily = "monospace"
                codeDiv.style.border = "1px solid #e0e0e0"
                codeDiv.innerHTML = `<strong>Code:</strong> ${diagnosticCode}`
                section.appendChild(codeDiv)

                // Status indicator
                const statusDiv = document.createElement("div")
                statusDiv.style.fontSize = "16px"
                statusDiv.style.marginBottom = "10px"
                statusDiv.style.padding = "10px 12px"
                statusDiv.style.borderRadius = "4px"
                statusDiv.style.fontWeight = "bold"

                const colors = severityColors[diagnosticInfo.severity]
                statusDiv.style.background = colors.bg
                statusDiv.style.color = colors.color
                statusDiv.innerHTML = `${colors.icon} ${diagnosticInfo.title}`
                section.appendChild(statusDiv)

                // Message
                const messageDiv = document.createElement("div")
                messageDiv.style.fontSize = "14px"
                messageDiv.style.lineHeight = "1.5"
                messageDiv.style.color = "#555"
                messageDiv.textContent = diagnosticInfo.message
                section.appendChild(messageDiv)

                return section
              }

              // Create modal content
              const content = document.createElement("div")
              content.style.padding = "16px"
              content.style.maxWidth = "600px"

              // Expression header
              const expressionDiv = document.createElement("div")
              expressionDiv.style.fontSize = "18px"
              expressionDiv.style.marginBottom = "20px"
              expressionDiv.style.fontWeight = "600"
              expressionDiv.style.color = "#1976d2"
              expressionDiv.style.padding = "12px"
              expressionDiv.style.background = "#e3f2fd"
              expressionDiv.style.borderRadius = "4px"
              expressionDiv.innerHTML = `<strong>Expression:</strong> ${mathSymbol.label || "N/A"}`
              content.appendChild(expressionDiv)

              // Numerical computation diagnostic
              content.appendChild(createDiagnosticSection(
                "🔢 Numerical Computation",
                computeDiagnostic,
                computeInfo
              ))

              // Evaluation diagnostic
              content.appendChild(createDiagnosticSection(
                "📊 Function Evaluation",
                evaluationDiagnostic,
                evalInfo
              ))

              const modal: Modal = new Modal({
                title: "Math Diagnostic",
                fields: [],
                customContent: content,
                buttons: [
                  {
                    label: "Close",
                    type: "primary",
                    callback: (): void => modal.destroy()
                  }
                ]
              })
              modal.open()

            } catch (error) {
              this.logger.error("Error checking diagnostic:", error)
            }
          }
        },
        {
          id: idEditVariables,
          type: "button",
          label: "Edit variables",
          action: async () => {
            this.logger.info("Edit variables clicked")
            
            try {
              const symbolsSelected = editor.model.symbolsSelected
              const mathSymbol = symbolsSelected[0] as IIRecognizedMath
              
              if (!mathSymbol.jiixId) {
                this.logger.warn("Selected math symbol does not have jiixId")
                return
              }

              const variables = await editor.getVariables(mathSymbol.jiixId)
              this.logger.info("Variables extracted:", variables)

              if (variables.length === 0) {
                alert("No variables found in the expression")
                return
              }

              // Create modal fields from variables
              const fields: ModalField[] = variables.map(variable => ({
                id: `var-${variable.name}`,
                label: `${variable.name}:`,
                type: "number" as const,
                defaultValue: mathSymbol.variableValues?.[variable.name] ?? variable.value,
                placeholder: "Value"
              }))

              const modal: Modal = new Modal({
                title: "Variables",
                fields,
                buttons: [
                  {
                    label: "Set",
                    type: "primary",
                    callback: async (values): Promise<void> => {
                      try {
                        const variableValues: { [name: string]: number } = {}

                        for (const variable of variables) {
                          const value = values[`var-${variable.name}`]
                          if (value && value !== "") {
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue)) {
                              variableValues[variable.name] = numValue
                            }
                          }
                        }

                        await editor.setMathVariables(mathSymbol, variableValues)
                        modal.destroy()
                      } catch (error) {
                        this.logger.error("Error setting variable values:", error)
                      }
                    }
                  },
                  {
                    label: "Close",
                    type: "secondary",
                    callback: (): void => modal.destroy()
                  }
                ]
              })

              modal.open()
            } catch (error) {
              this.logger.error("Error getting variables:", error)
            }
          }
        },
        {
          id: idNumericalComputation,
          type: "button",
          label: "Compute numerical result",
          action: async () => {
            this.logger.info("Compute numerical result clicked")
            
            try {
              const symbolsSelected = editor.model.symbolsSelected
              const mathSymbols = symbolsSelected.filter(isRecognizedMathSymbol)
              
              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }
              
              const mathSymbol = mathSymbols[0]
              
              const result = await editor.computeMathNumericalResult(mathSymbol, editor.mathComputationMode)

              // If not drawing strokes, show modal with result
              if (!editor.mathComputationMode && result.value !== undefined) {
                const content = document.createElement("div")
                content.style.padding = "16px"
                content.style.textAlign = "center"

                const equation = document.createElement("div")
                equation.style.fontSize = "18px"
                equation.style.marginBottom = "12px"
                equation.style.fontWeight = "500"
                equation.textContent = mathSymbol.label || "Expression"
                content.appendChild(equation)

                const resultDiv = document.createElement("div")
                resultDiv.style.fontSize = "32px"
                resultDiv.style.fontWeight = "bold"
                resultDiv.style.color = "#4caf50"
                resultDiv.textContent = result.value?.toString() || "N/A"
                content.appendChild(resultDiv)

                const modal: Modal = new Modal({
                  title: "Numerical Result",
                  fields: [],
                  customContent: content,
                  buttons: [
                    {
                      label: "Close",
                      type: "primary",
                      callback: (): void => modal.destroy()
                    }
                  ]
                })
                modal.open()
              }

            } catch (error) {
              this.logger.error("Error computing numerical result:", error)
            }
          }
        },
        {
          id: idEvaluate,
          type: "button",
          label: "Evaluate function",
          action: async () => {
            this.logger.info("Evaluate function clicked")
            
            try {
              const symbolsSelected = editor.model.symbolsSelected
              const mathSymbol = symbolsSelected[0] as IIRecognizedMath
              
              if (!mathSymbol.jiixId) {
                this.logger.warn("Selected math symbol does not have jiixId")
                return
              }

              const evaluables = await editor.getEvaluables(mathSymbol.jiixId)
              if (evaluables.length === 0) {
                alert("No evaluable functions found")
                return
              }

              this.logger.info("Evaluables found:", evaluables)

              const fields: ModalField[] = []
              if (evaluables.length > 1) {
                fields.push({
                  id: "evaluableIndex",
                  label: "Function to evaluate:",
                  type: "select",
                  defaultValue: "0",
                  options: evaluables.map((ev, index) => ({
                    value: String(index),
                    label: `${ev.outputName} = f(${ev.inputName})`
                  }))
                })
              }

              fields.push(
                {
                  id: "from",
                  label: "From:",
                  type: "number",
                  defaultValue: -10,
                  placeholder: "Start value"
                },
                {
                  id: "to",
                  label: "To:",
                  type: "number",
                  defaultValue: 10,
                  placeholder: "End value"
                },
                {
                  id: "pointCount",
                  label: "Number of points:",
                  type: "number",
                  defaultValue: 21,
                  placeholder: "Point count"
                },
                {
                  id: "step",
                  label: "Step:",
                  type: "number",
                  defaultValue: parseFloat(((10 - (-10)) / (21 - 1)).toFixed(6)),
                  placeholder: "Step size"
                }
              )

              const modal: Modal = new Modal({
                title: `Evaluate function`,
                fields,
                buttons: [
                  {
                    label: "Evaluate",
                    type: "primary",
                    callback: async (values): Promise<void> => {
                      try {
                        // Get selected evaluable
                        let evaluable = evaluables[0]
                        if (evaluables.length > 1 && values.evaluableIndex) {
                          const selectedIndex = parseInt(values.evaluableIndex)
                          if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < evaluables.length) {
                            evaluable = evaluables[selectedIndex]
                          }
                        }

                        const from = parseFloat(values.from)
                        const to = parseFloat(values.to)
                        const pointCount = parseInt(values.pointCount)

                        if (isNaN(from) || isNaN(to) || isNaN(pointCount)) {
                          alert("Invalid input")
                          return
                        }

                        const points = await editor.evaluateMathFunction(mathSymbol, {
                          inputVariableName: evaluable.inputName,
                          outputVariableName: evaluable.outputName,
                          from,
                          to,
                          pointCount
                        })

                        this.logger.info("Function evaluated:", points)

                        const yLabel = evaluable.outputName || "?"

                        // Create chart to display results
                        const chart = new Chart({
                          width: Math.max(600, window.innerWidth * 0.8),
                          height: Math.max(350, window.innerHeight * 0.5),
                          title: evaluable.inputName
                            ? `${evaluable.outputName || "?"} = f(${evaluable.inputName})`
                            : `${evaluable.outputName || "?"} = ${points[0]?.[0]?.[yLabel] ?? "?"}`,
                          xLabel: evaluable.inputName || "x",
                          yLabel: evaluable.outputName || "?",
                          lineColor: "#2196F3",
                          showGrid: true,
                          showPoints: true
                        })
                        chart.setData(points)

                        const chartContainer = document.createElement("div")
                        chartContainer.style.cssText = "margin: 16px 0; text-align: center; overflow: hidden;"
                        chartContainer.appendChild(chart.getElement())

                        const resultModal: Modal = new Modal({
                          title: "Evaluation Result",
                          fields: [],
                          customContent: chartContainer,
                          buttons: [
                            {
                              label: "Close",
                              type: "secondary",
                              callback: (): void => resultModal.destroy()
                            }
                          ]
                        })

                        modal.destroy()
                        resultModal.open()
                      } catch (error) {
                        this.logger.error("Error evaluating:", error)
                      }
                    }
                  },
                  {
                    label: "Cancel",
                    type: "secondary",
                    callback: (): void => modal.destroy()
                  }
                ]
              })

              modal.open()

              const fromInput = document.querySelector("#from") as HTMLInputElement
              const toInput = document.querySelector("#to") as HTMLInputElement
              const pointCountInput = document.querySelector("#pointCount") as HTMLInputElement
              const stepInput = document.querySelector("#step") as HTMLInputElement

              let isUpdatingStep = false
              let isUpdatingPointCount = false
              let lastModified: "step" | "pointCount" = "pointCount" // Track which field was last manually modified

              const updateStep = () => {
                if (isUpdatingStep) return
                isUpdatingPointCount = true

                const from = parseFloat(fromInput.value)
                const to = parseFloat(toInput.value)
                const pointCount = parseInt(pointCountInput.value)

                if (!isNaN(from) && !isNaN(to) && !isNaN(pointCount) && pointCount > 1) {
                  const step = (to - from) / (pointCount - 1)
                  stepInput.value = step.toFixed(6)
                }

                isUpdatingPointCount = false
              }

              const updatePointCount = () => {
                if (isUpdatingPointCount) return
                isUpdatingStep = true

                const from = parseFloat(fromInput.value)
                const to = parseFloat(toInput.value)
                const step = parseFloat(stepInput.value)

                if (!isNaN(from) && !isNaN(to) && !isNaN(step) && step > 0) {
                  const pointCount = Math.floor((to - from) / step) + 1
                  pointCountInput.value = String(Math.max(2, pointCount))
                }

                isUpdatingStep = false
              }

              const updateBasedOnLastModified = () => {
                if (lastModified === "pointCount") {
                  updateStep()
                } else {
                  updatePointCount()
                }
              }

              fromInput.addEventListener("input", () => {
                updateBasedOnLastModified()
              })
              toInput.addEventListener("input", () => {
                updateBasedOnLastModified()
              })
              pointCountInput.addEventListener("input", () => {
                lastModified = "pointCount"
                updateStep()
              })
              stepInput.addEventListener("input", () => {
                lastModified = "step"
                updatePointCount()
              })
            } catch (error) {
              this.logger.error("Error evaluating function:", error)
            }
          }
        }
      ]
    }

    super(config, editor)
    this.id = id
    this.idEditVariables = idEditVariables
    this.idNumericalComputation = idNumericalComputation
    this.idCheckDiagnostic = idCheckDiagnostic
    this.idEvaluate = idEvaluate
  }

  setMenuVisibility(show: boolean, { canEditVariables, canCompute, canEvaluate }: { canEditVariables: boolean, canCompute: boolean, canEvaluate: boolean }): void {
    const mathMenu = this.getElement()
    if (show && (canEditVariables || canCompute || canEvaluate)) {
      mathMenu.style.removeProperty("display")
      const editVariablesButton = mathMenu.querySelector(`#${ this.idEditVariables }`) as HTMLButtonElement
      const numericalComputationButton = mathMenu.querySelector(`#${ this.idNumericalComputation }`) as HTMLButtonElement
      const checkDiagnosticButton = mathMenu.querySelector(`#${ this.idCheckDiagnostic }`) as HTMLButtonElement
      const evaluateButton = mathMenu.querySelector(`#${ this.idEvaluate }`) as HTMLButtonElement

      if (editVariablesButton) {
        editVariablesButton.style.setProperty("display", canEditVariables ? "inline-block" : "none")
      }
      if (numericalComputationButton) {
        numericalComputationButton.style.setProperty("display", canCompute ? "inline-block" : "none")
      }
      if (checkDiagnosticButton) {
        // Diagnostic is always available when a math symbol is selected
        checkDiagnosticButton.style.setProperty("display", "inline-block")
      }
      if (evaluateButton) {
        evaluateButton.style.setProperty("display", canEvaluate ? "inline-block" : "none")
      }

    } else {
      mathMenu.style.setProperty("display", "none")
    }
  }

}
