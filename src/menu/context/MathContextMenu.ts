import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import { IIStroke, isRecognizedMath } from "@/symbol"
import { Modal, ModalField, IIFunctionEvaluator, IIDiagnosticChecker, IINumericalComputationResult } from "@/components"
import { LoggerCategory, LoggerManager } from "@/logger"

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
              const mathSymbols = symbolsSelected.filter(isRecognizedMath)

              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }

              const jiixBlockIds = mathSymbols.map(s => s.jiixBlockId!).filter(Boolean)

              const checker = new IIDiagnosticChecker(editor, jiixBlockIds)
              await checker.show()

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
              const mathSymbol = symbolsSelected[0] as IIStroke
              
              if (!mathSymbol.jiixBlockId) {
                this.logger.warn("Selected math symbol does not have jiixId")
                return
              }

              const variables = await editor.getVariables(mathSymbol.jiixBlockId)
              this.logger.info("Variables extracted:", variables)

              if (variables.length === 0) {
                alert("No variables found in the expression")
                return
              }

              // Create modal fields from variables
              const fields: ModalField[] = variables.map(variable => {
                // Get current value from computation manager
                const storedValues = editor.math.actions.getStoredVariableValues(mathSymbol.jiixBlockId!)
                return {
                  id: `var-${variable.name}`,
                  label: `${variable.name}:`,
                  type: "number" as const,
                  defaultValue: storedValues?.[variable.name] ?? variable.value,
                  placeholder: "Value"
                }
              })

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

                        await editor.setMathVariables(mathSymbol.jiixBlockId!, variableValues)
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
              const mathSymbols = symbolsSelected.filter(isRecognizedMath)
              
              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }
              
              // Use IINumericalComputationResult component
              const jiixBlockIds = mathSymbols.map(s => s.jiixBlockId!).filter(Boolean)
              const computer = new IINumericalComputationResult(editor, jiixBlockIds)
              await computer.show()

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
              const mathSymbols = symbolsSelected.filter(isRecognizedMath)
              
              if (mathSymbols.length === 0) {
                this.logger.warn("No math symbol selected")
                return
              }
              const jiixBlockIds = mathSymbols.map(s => s.jiixBlockId!).filter(Boolean)
              const evaluator = new IIFunctionEvaluator(editor, jiixBlockIds)
              await evaluator.show()

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
    if (show) {
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
