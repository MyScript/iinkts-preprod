import { InteractiveInkEditor } from "@/editor"
import { Modal } from "./Modal"
import { TMathVariableDefinitions } from "@/recognizer"
import { LoggerCategory, LoggerManager } from "@/logger"
import { BORDER_RADIUS, COLORS, SPACING, cardStyle, flexColumnStyle, gridContainerStyle } from "./styles"
import { IIMathVariableInputList, TVariableInputItem } from "./IIMathVariableInputList"

/**
 * @group Components
 * @remarks Modal editor for all variable definitions returned by get-variable-definitions.
 * BLOCK variables are shown read-only; API_GLOBAL variables are editable.
 * New global variables can be added via setVariableValue("", name, value).
 */
function isEditableSourceType(sourceType: string | undefined): boolean
{
  return sourceType === "API_GLOBAL" || sourceType === "API" || sourceType === "UNDEFINED"
}

export class IIMathVariableEditor
{
  private editor: InteractiveInkEditor
  private modal?: Modal
  private variableDefs: TMathVariableDefinitions[] = []
  private inputList?: IIMathVariableInputList
  private newRows: Array<{ nameInput: HTMLInputElement; valueInput: HTMLInputElement }> = []
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(editor: InteractiveInkEditor)
  {
    this.editor = editor
  }

  async show(): Promise<void>
  {
    this.variableDefs = []
    this.inputList = undefined
    this.newRows = []

    try {
      this.variableDefs = await this.editor.math.getVariableDefinitions()
    } catch (error) {
      this.logger.error("show", "Error fetching variable definitions:", error)
      return
    }

    const container = this.createModalContent()

    this.modal = new Modal({
      title: "Variable Definitions",
      fields: [],
      customContent: container,
      buttons: [{ label: "Apply", type: "primary", callback: async () => this.applyChanges() }]
    })

    this.modal.open()
  }

  private createModalContent(): HTMLDivElement
  {
    const container = document.createElement("div")
    container.style.cssText = `
      ${flexColumnStyle(SPACING.lg)}
      width: 100%;
      overflow-y: auto;
      padding: ${SPACING.md};
      box-sizing: border-box;
    `

    if (this.variableDefs.length > 0) {
      const section = document.createElement("div")
      section.style.cssText = cardStyle

      const items: TVariableInputItem[] = this.variableDefs.map(vd => {
        const editableDef = vd.definitions.find(d => isEditableSourceType(d.sourceType))
        const def = editableDef ?? vd.definitions[0]
        return {
          name: vd.name,
          initialValue: def?.value,
          sourceType: def?.sourceType,
          disabled: !editableDef
        }
      })

      this.inputList = new IIMathVariableInputList(items)
      section.appendChild(this.inputList.element)
      container.appendChild(section)
    }

    container.appendChild(this.createAddSection())
    return container
  }

  private createAddSection(): HTMLDivElement
  {
    const section = document.createElement("div")
    section.style.cssText = cardStyle

    const title = document.createElement("div")
    title.style.cssText = `font-size: 14px; font-weight: 600; color: ${COLORS.gray[700]}; margin-bottom: ${SPACING.sm};`
    title.textContent = "Add Global Variable"
    section.appendChild(title)

    const newVarsContainer = document.createElement("div")
    newVarsContainer.style.cssText = flexColumnStyle(SPACING.sm)
    section.appendChild(newVarsContainer)

    const addButton = document.createElement("button")
    addButton.textContent = "+ Add"
    addButton.style.cssText = `
      padding: ${SPACING.sm} ${SPACING.md};
      border: 1px dashed ${COLORS.primary};
      background: transparent;
      color: ${COLORS.primary};
      border-radius: ${BORDER_RADIUS.sm};
      cursor: pointer;
      font-size: 13px;
      margin-top: ${SPACING.sm};
    `
    addButton.addEventListener("click", () => {
      const { element, nameInput, valueInput } = this.createNewVariableRow()
      newVarsContainer.appendChild(element)
      this.newRows.push({ nameInput, valueInput })
      nameInput.focus()
    })
    section.appendChild(addButton)

    return section
  }

  private createNewVariableRow(): { element: HTMLDivElement; nameInput: HTMLInputElement; valueInput: HTMLInputElement }
  {
    const row = document.createElement("div")
    row.style.cssText = `
      ${gridContainerStyle("1fr 1fr", SPACING.sm)}
      align-items: center;
      padding: ${SPACING.sm};
      background: ${COLORS.blue[50]};
      border-radius: ${BORDER_RADIUS.sm};
      border: 1px solid ${COLORS.blue[100]};
    `

    const inputStyle = `
      padding: ${SPACING.sm} ${SPACING.md};
      border: 1px solid ${COLORS.gray[300]};
      border-radius: ${BORDER_RADIUS.sm};
      font-size: 14px;
      font-family: monospace;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    `

    const nameInput = document.createElement("input")
    nameInput.type = "text"
    nameInput.placeholder = "Variable name"
    nameInput.style.cssText = inputStyle
    nameInput.addEventListener("focus", () => nameInput.style.borderColor = COLORS.primary )
    nameInput.addEventListener("blur", () => nameInput.style.borderColor = COLORS.gray[300] )
    row.appendChild(nameInput)

    const valueInput = document.createElement("input")
    valueInput.type = "number"
    valueInput.step = "any"
    valueInput.placeholder = "Value"
    valueInput.style.cssText = inputStyle
    valueInput.addEventListener("focus", () => valueInput.style.borderColor = COLORS.primary )
    valueInput.addEventListener("blur", () => valueInput.style.borderColor = COLORS.gray[300] )
    row.appendChild(valueInput)

    return { element: row, nameInput, valueInput }
  }

  private async applyChanges(): Promise<void>
  {
    try {
      const updates: Promise<void>[] = []

      if (this.inputList) {
        const allValues = this.inputList.getValues()
        for (const [name, newValue] of allValues) {
          const editableDef = this.variableDefs
            .find(vd => vd.name === name)
            ?.definitions.find(d => isEditableSourceType(d.sourceType))
          if (!editableDef) continue
          if (editableDef.value !== newValue) {
            updates.push(this.editor.math.setVariableValue(editableDef.blockId, name, newValue))
          }
        }
      }

      for (const { nameInput, valueInput } of this.newRows) {
        const name = nameInput.value.trim()
        const value = parseFloat(valueInput.value)
        if (name && !isNaN(value)) {
          updates.push(this.editor.math.setVariableValue("", name, value))
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates)
        this.logger.info("applyChanges", `Updated ${updates.length} global variable(s)`)
      }
      this.close()
      this.editor.menu.context.update()
    } catch (error) {
      this.logger.error("applyChanges", "Error applying variable changes:", error)
    }
  }

  close(): void
  {
    this.modal?.destroy()
    this.modal = undefined
    this.variableDefs = []
    this.inputList = undefined
    this.newRows = []
  }
}
