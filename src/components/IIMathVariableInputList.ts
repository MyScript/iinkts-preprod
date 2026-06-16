import { BORDER_RADIUS, COLORS, SPACING, flexColumnStyle, gridContainerStyle } from "./styles"

/**
 * @group Components
 */
export type TVariableInputItem = {
  id?: string
  name: string
  initialValue?: number
  sourceType?: string
  sourceLabel?: string   // human-readable label of the definition block (replaces raw sourceId)
  isDefinition?: boolean
  targetLabel?: string   // label of the block where this variable is used
  disabled?: boolean
  onDelete?: (name: string) => Promise<void>
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  "UNDEFINED": COLORS.gray[500],
  "API": COLORS.blue[700],
  "API_GLOBAL": COLORS.purple,
  "BLOCK": COLORS.success,
  "PREDEFINED": COLORS.warning
}

/**
 * @group Components
 * @remarks Pure UI component — renders a list of variable input rows.
 * Use getValues() to retrieve all valid (non-empty, non-NaN) inputs.
 */
export class IIMathVariableInputList
{
  readonly element: HTMLDivElement
  private inputs: Map<string, HTMLInputElement> = new Map()

  constructor(items: TVariableInputItem[])
  {
    this.element = document.createElement("div")
    this.element.style.cssText = flexColumnStyle(SPACING.md)
    items.forEach(item => this.element.appendChild(this.createRow(item)))
  }

  private createRow(item: TVariableInputItem): HTMLDivElement
  {
    const hasTarget = !!item.targetLabel
    const colDefs = hasTarget
      ? (item.onDelete ? "80px 90px 1fr 1fr 28px" : "80px 90px 1fr 1fr")
      : (item.onDelete ? "120px 1fr 80px 28px" : "120px 1fr 80px")

    const row = document.createElement("div")
    row.style.cssText = `
      ${gridContainerStyle(colDefs, SPACING.sm)}
      align-items: center;
      padding: ${SPACING.sm};
      background: ${COLORS.gray[50]};
      border-radius: ${BORDER_RADIUS.sm};
      border: 1px solid ${COLORS.gray[200]};
    `

    const nameLabel = document.createElement("div")
    nameLabel.style.cssText = `
      font-weight: 600;
      font-family: monospace;
      font-size: 16px;
      color: ${COLORS.gray[800]};
    `
    nameLabel.textContent = item.name
    row.appendChild(nameLabel)

    const input = document.createElement("input")
    input.type = "number"
    input.step = "any"
    input.placeholder = "Enter value"
    input.disabled = item.disabled ?? false
    if (item.initialValue != null) {
      input.value = item.initialValue.toString()
    }
    input.style.cssText = `
      padding: ${SPACING.sm} ${SPACING.md};
      border: 1px solid ${COLORS.gray[300]};
      border-radius: ${BORDER_RADIUS.sm};
      font-size: 14px;
      font-family: monospace;
      outline: none;
      transition: border-color 0.2s;
    `
    input.addEventListener("focus", () => input.style.borderColor = COLORS.primary )
    input.addEventListener("blur", () => input.style.borderColor = COLORS.gray[300] )
    row.appendChild(input)
    this.inputs.set(item.id ?? item.name, input)

    const sourceInfo = document.createElement("div")
    sourceInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      overflow: hidden;
    `
    if (item.sourceType) {
      const typeLabel = document.createElement("span")
      typeLabel.style.cssText = `
        font-size: 11px;
        color: ${SOURCE_TYPE_COLORS[item.sourceType] ?? COLORS.gray[600]};
        font-weight: 600;
      `
      typeLabel.textContent = item.isDefinition ? "Definition" : (item.sourceType ?? "")
      sourceInfo.appendChild(typeLabel)
    }
    if (item.sourceLabel) {
      const labelEl = document.createElement("span")
      labelEl.title = item.sourceLabel
      labelEl.style.cssText = `
        font-size: 10px;
        color: ${COLORS.gray[400]};
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100px;
      `
      labelEl.textContent = item.sourceLabel
      sourceInfo.appendChild(labelEl)
    }
    row.appendChild(sourceInfo)

    if (hasTarget) {
      const targetEl = document.createElement("div")
      targetEl.title = item.targetLabel!
      targetEl.style.cssText = `
        font-size: 11px;
        color: ${COLORS.gray[600]};
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 ${SPACING.sm};
      `
      targetEl.textContent = item.targetLabel!
      row.appendChild(targetEl)
    }

    if (item.onDelete) {
      const deleteBtn = document.createElement("button")
      deleteBtn.textContent = "✕"
      deleteBtn.title = "Delete variable"
      deleteBtn.style.cssText = `
        padding: 2px 6px;
        border: 1px solid ${COLORS.danger};
        background: transparent;
        color: ${COLORS.danger};
        border-radius: ${BORDER_RADIUS.sm};
        cursor: pointer;
        font-size: 12px;
        line-height: 1;
      `
      deleteBtn.addEventListener("click", async () => {
        await item.onDelete!(item.name)
        this.removeRow(item.id ?? item.name)
      })
      row.appendChild(deleteBtn)
    }

    return row
  }

  removeRow(name: string): void
  {
    const input = this.inputs.get(name)
    if (input) {
      input.parentElement?.remove()
      this.inputs.delete(name)
    }
  }

  getValues(): Map<string, number>
  {
    const result = new Map<string, number>()
    for (const [name, input] of this.inputs) {
      if (input.value === "") continue
      const value = parseFloat(input.value)
      if (!isNaN(value)) result.set(name, value)
    }
    return result
  }
}
