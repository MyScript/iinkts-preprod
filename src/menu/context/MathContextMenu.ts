import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import ArrowDown from "../../assets/svg/nav-arrow-down.svg"
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

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: IMenuSubMenu = {
      id: `${idPrefix}-math`,
      type: "submenu",
      label: "Math",
      icon: ArrowDown,
      position: "right",
      items: [
        {
          id: `${idPrefix}-math-get-variable`,
          type: "button",
          label: "Get variables",
          action: async () => {
            this.logger.info("Get variables clicked")
            
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
                        // Initialize variableValues if not present
                        if (!mathSymbol.variableValues) {
                          mathSymbol.variableValues = {}
                        }

                        for (const variable of variables) {
                          const value = values[`var-${variable.name}`]
                          if (value && value !== "") {
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue)) {
                              await editor.setVariableValue(mathSymbol.jiixId!, variable.name, numValue)
                              // Store the value in the symbol
                              mathSymbol.variableValues[variable.name] = numValue
                              this.logger.info(`Set ${variable.name} = ${numValue}`)
                            }
                          }
                        }

                        // Persist the changes
                        await editor.model.updateSymbol(mathSymbol)
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
          id: `${idPrefix}-numerical-computation`,
          type: "button",
          label: "Solve",
          action: async () => {
            this.logger.info("Solve clicked")
            
            try {
              const symbolsSelected = editor.model.symbolsSelected
              const mathSymbols = symbolsSelected.filter(s =>
                s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math
              ) as IIRecognizedMath[]
              
              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }
              
              const blocId = mathSymbols[0].jiixId
              if (!blocId) {
                this.logger.warn("Selected math symbol does not have jiixId")
                return
              }
              
              const result = await editor.getNumericalComputation(blocId)
              this.logger.info("Math solved successfully", result)

              // Add solver output strokes to canvas
              const addedStrokes = await editor.addSolverOutputStrokes(result)
              this.logger.info(`Added ${addedStrokes.length} solver output strokes`)

              if (addedStrokes.length === 0) {
                alert("No solver output to display")
              } else {
                // Redraw selection as the symbol has changed
                editor.selector.resetSelectedGroup(symbolsSelected)
              }
            } catch (error) {
              this.logger.error("Error solving math:", error)
            }
          }
        },
        {
          id: `${idPrefix}-math-evaluate`,
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

              // Get evaluables
              const evaluables = await editor.getEvaluables(mathSymbol.jiixId)
              if (evaluables.length === 0) {
                alert("No evaluable functions found")
                return
              }

              this.logger.info("Evaluables found:", evaluables)

              // Create modal fields
              const fields: ModalField[] = []

              // Add evaluable selection if multiple evaluables exist
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
                  defaultValue: 20,
                  placeholder: "Point count"
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

                        if (!mathSymbol.jiixId) {
                          this.logger.error("Math symbol has no jiixId")
                          return
                        }

                        const points = await editor.evaluate(mathSymbol.jiixId, {
                          inputVariableName: evaluable.inputName,
                          outputVariableName: evaluable.outputName,
                          from,
                          to,
                          pointCount
                        })

                        this.logger.info("Function evaluated:", points)

                        // Create chart to display results
                        const chart = new Chart({
                          width: 500,
                          height: 350,
                          title: `${evaluable.outputName} = f(${evaluable.inputName})`,
                          xLabel: evaluable.inputName,
                          yLabel: evaluable.outputName,
                          lineColor: "#2196F3",
                          showGrid: true,
                          showPoints: true
                        })
                        chart.setData(points)

                        // Prepare chart container
                        const chartContainer = document.createElement("div")
                        chartContainer.style.cssText = "margin: 16px 0; text-align: center; overflow: hidden;"
                        chartContainer.appendChild(chart.getElement())

                        // Create a new modal to display the chart
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
            } catch (error) {
              this.logger.error("Error evaluating function:", error)
            }
          }
        }
      ]
    }

    super(config, editor)
  }
}
