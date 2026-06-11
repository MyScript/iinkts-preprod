import { InteractiveInkEditor } from "@/editor"
import { Modal } from "./Modal"
import { TMathVariable } from "@/recognizer"
import { LoggerCategory, LoggerManager } from "@/logger"
import { BORDER_RADIUS, COLORS, SPACING, cardStyle, flexColumnStyle, gridContainerStyle } from "./styles"

/**
 * @group Components
 */
export interface SymbolVariables {
  jiixBlockId: string
  variables: TMathVariable[]
}

/**
 * @group Components
 * @remarks Component for editing variables of multiple math symbols
 */
export class IIVariableEditor {
  private editor: InteractiveInkEditor
  private jiixBlockIds: string[]
  private modal?: Modal
  private blockVariables: SymbolVariables[] = []
  private inputsMap: Map<string, Map<string, HTMLInputElement>> = new Map()
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(editor: InteractiveInkEditor, jiixBlockIds: string[]) {
    this.editor = editor
    this.jiixBlockIds = [...new Set(jiixBlockIds)]
  }

  /**
   * Show the variable editor modal
   */
  async show(): Promise<void> {
    // Fetch variables for all symbols
    this.blockVariables = []

    for (const jiixBlockId of this.jiixBlockIds) {
      if (!jiixBlockId) {
        this.logger.warn(`Invalid jiixBlockId`)
        continue
      }

      try {
        const variables = await this.editor.getMathVariables(jiixBlockId)
        if (variables.length > 0) {
          this.blockVariables.push({
            jiixBlockId,
            variables
          })
        }
      } catch (error) {
        const label = this.editor.jiix.getBlockLabel(jiixBlockId)
        this.logger.error(`Error fetching variables for JiixBlock ${label}:`, error)
      }
    }

    if (this.blockVariables.length === 0) {
      this.logger.warn("No variables found in the selected symbols")
      return
    }

    // Create modal content
    const container = this.createModalContent(this.blockVariables)

    // Create modal
    this.modal = new Modal({
      title: `Edit Variable${this.blockVariables.length > 1 ? "s" : ""} (${this.blockVariables.length} symbol${this.blockVariables.length > 1 ? "s" : ""})`,
      fields: [],
      customContent: container,
      buttons: [
        {
          label: "Apply",
          type: "primary",
          callback: async (): Promise<void> => this.applyChanges()
        },
      ]
    })

    this.modal.open()
  }

  /**
   * Create the modal content with variable inputs
   */
  private createModalContent(symbolVariables: SymbolVariables[]): HTMLDivElement {
    const container = document.createElement("div")
    container.style.cssText = `
      ${flexColumnStyle(SPACING.lg)}
      width: 100%;
      height: 100%;
      overflow-y: auto;
      padding: ${SPACING.md};
      box-sizing: border-box;
    `

    // Create a section for each symbol
    symbolVariables.forEach(symVar => {
      const symbolSection = this.createSymbolVariableSection(symVar)
      container.appendChild(symbolSection)
    })

    return container
  }

  /**
   * Create a variable section for a single symbol
   */
  private createSymbolVariableSection(symVar: SymbolVariables): HTMLDivElement {
    const section = document.createElement("div")
    section.style.cssText = cardStyle

    // Expression header
    const expressionDiv = document.createElement("div")
    expressionDiv.style.cssText = `
      font-size: 18px;
      margin-bottom: ${SPACING.lg};
      font-weight: 600;
      color: ${COLORS.primary};
      padding: ${SPACING.md};
      background: ${COLORS.blue[50]};
      border-radius: ${BORDER_RADIUS.sm};
    `
    const label = this.editor.jiix.getBlockLabel(symVar.jiixBlockId) || "N/A"
    expressionDiv.innerHTML = `<strong>Expression:</strong> ${label}`
    section.appendChild(expressionDiv)

    // Variables container
    const variablesContainer = document.createElement("div")
    variablesContainer.style.cssText = `
      ${flexColumnStyle(SPACING.md)}
    `

    // Create inputs map for this symbol
    const symbolInputsMap = new Map<string, HTMLInputElement>()
    this.inputsMap.set(symVar.jiixBlockId, symbolInputsMap)

    // Create input for each variable
    symVar.variables.forEach(variable => {
      const variableRow = this.createVariableInput(symVar.jiixBlockId, variable)
      variablesContainer.appendChild(variableRow)
    })

    section.appendChild(variablesContainer)

    return section
  }

  /**
   * Create input row for a single variable
   */
  private createVariableInput(jiixBlockId: string, variable: TMathVariable): HTMLDivElement {
    const row = document.createElement("div")
    row.style.cssText = `
      ${gridContainerStyle("120px 1fr 80px", SPACING.sm)}
      align-items: center;
      padding: ${SPACING.sm};
      background: ${COLORS.gray[50]};
      border-radius: ${BORDER_RADIUS.sm};
      border: 1px solid ${COLORS.gray[200]};
    `

    // Variable name
    const nameLabel = document.createElement("div")
    nameLabel.style.cssText = `
      font-weight: 600;
      font-family: monospace;
      font-size: 16px;
      color: ${COLORS.gray[800]};
    `
    nameLabel.textContent = variable.name
    row.appendChild(nameLabel)

    // Input field
    const input = document.createElement("input")
    input.type = "number"
    input.step = "any"
    input.placeholder = "Enter value"
    input.style.cssText = `
      padding: ${SPACING.sm} ${SPACING.md};
      border: 1px solid ${COLORS.gray[300]};
      border-radius: ${BORDER_RADIUS.sm};
      font-size: 14px;
      font-family: monospace;
      outline: none;
      transition: border-color 0.2s;
    `
    input.addEventListener("focus", () => {
      input.style.borderColor = COLORS.primary
    })
    input.addEventListener("blur", () => {
      input.style.borderColor = COLORS.gray[300]
    })

    // Set default value - get from computation manager
    const storedValues = this.editor.math.getStoredVariableValues(jiixBlockId)
    const currentValue = storedValues?.[variable.name] ?? variable.value
    if (currentValue != null) {
      input.value = currentValue.toString()
    }

    row.appendChild(input)

    // Store input reference
    const symbolInputsMap = this.inputsMap.get(jiixBlockId)
    if (symbolInputsMap) {
      symbolInputsMap.set(variable.name, input)
    }

    // Source type info
    const sourceInfo = document.createElement("div")
    sourceInfo.style.cssText = `
      font-size: 11px;
      color: ${COLORS.gray[600]};
      text-align: right;
    `

    const sourceTypeColors: { [key: string]: string } = {
      "UNDEFINED": COLORS.gray[500],
      "API": COLORS.blue[700],
      "API_GLOBAL": COLORS.purple,
      "BLOCK": COLORS.success,
      "PREDIFINED": COLORS.warning
    }

    if (variable.sourceType) {
      sourceInfo.style.color = sourceTypeColors[variable.sourceType] || COLORS.gray[600]
      sourceInfo.textContent = variable.sourceType
    }

    row.appendChild(sourceInfo)

    return row
  }

  /**
   * Apply changes to all symbols
   */
  private async applyChanges(): Promise<void> {
    try {
      const updates: Promise<void>[] = []

      for (const symVar of this.blockVariables) {
        const symbolInputsMap = this.inputsMap.get(symVar.jiixBlockId)
        if (!symbolInputsMap) continue

        const variableValues: { [name: string]: number } = {}
        let hasChanges = false

        for (const variable of symVar.variables) {
          const input = symbolInputsMap.get(variable.name)
          if (input && input.value !== "") {
            const numValue = parseFloat(input.value)
            if (!isNaN(numValue)) {
              variableValues[variable.name] = numValue
              hasChanges = true
            }
          }
        }

        if (hasChanges) {
          updates.push(this.editor.setMathVariables(symVar.jiixBlockId, variableValues))
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates)
        this.logger.info(`Updated variables for ${updates.length} symbol(s)`)
        this.close()
      }
    } catch (error) {
      this.logger.error("Error applying variable changes:", error)
    }
  }

  /**
   * Close the modal
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
    this.blockVariables = []
    this.inputsMap.clear()
  }
}
