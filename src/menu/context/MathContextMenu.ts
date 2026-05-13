import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { SymbolType, RecognizedKind, IIRecognizedMath } from "../../symbol"
import { Modal, ModalField } from "../../components"
import { Chart } from "../../components"
import { LoggerCategory, LoggerManager } from "../../logger"

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
  readonly idEvaluate: string

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const id = `${idPrefix}-math`
    const idEditVariables = `${id}-variables`
    const idNumericalComputation = `${id}-numerical-computation`
    const idEvaluate = `${id}-evaluate`
    const config: IMenuSubMenu = {
      id: id,
      type: "submenu",
      label: "Math",
      position: "right",
      items: [
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
              const mathSymbols = symbolsSelected.filter(s =>
                s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math
              ) as IIRecognizedMath[]
              
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
    this.idEvaluate = idEvaluate
  }

  setMenuVisibility(show: boolean, { canEditVariables, canCompute, canEvaluate }: { canEditVariables: boolean, canCompute: boolean, canEvaluate: boolean }): void {
    const mathMenu = this.getElement()
    if (show && (canEditVariables || canCompute || canEvaluate)) {
      mathMenu.style.removeProperty("display")
      const editVariablesButton = mathMenu.querySelector(`#${ this.idEditVariables }`) as HTMLButtonElement
      const numericalComputationButton = mathMenu.querySelector(`#${ this.idNumericalComputation }`) as HTMLButtonElement
      const evaluateButton = mathMenu.querySelector(`#${ this.idEvaluate }`) as HTMLButtonElement

      if (editVariablesButton) {
        editVariablesButton.style.setProperty("display", canEditVariables ? "inline-block" : "none")
      }
      if (numericalComputationButton) {
        numericalComputationButton.style.setProperty("display", canCompute ? "inline-block" : "none")
      }
      if (evaluateButton) {
        evaluateButton.style.setProperty("display", canEvaluate ? "inline-block" : "none")
      }

    } else {
      mathMenu.style.setProperty("display", "none")
    }
  }

}
