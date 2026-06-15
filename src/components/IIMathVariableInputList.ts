import { BORDER_RADIUS, COLORS, SPACING, flexColumnStyle, gridContainerStyle } from "./styles"

/**
 * @group Components
 */
export type TVariableInputItem = {
  name: string
  initialValue?: number
  sourceType?: string
  disabled?: boolean
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  "UNDEFINED": COLORS.gray[500],
  "API": COLORS.blue[700],
  "API_GLOBAL": COLORS.purple,
  "BLOCK": COLORS.success,
  "PREDIFINED": COLORS.warning
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
    const row = document.createElement("div")
    row.style.cssText = `
      ${gridContainerStyle("120px 1fr 80px", SPACING.sm)}
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
    this.inputs.set(item.name, input)

    const sourceInfo = document.createElement("div")
    sourceInfo.style.cssText = `
      font-size: 11px;
      color: ${COLORS.gray[600]};
      text-align: right;
    `
    if (item.sourceType) {
      sourceInfo.style.color = SOURCE_TYPE_COLORS[item.sourceType] ?? COLORS.gray[600]
      sourceInfo.textContent = item.disabled ? "Definition" : item.sourceType
    }
    row.appendChild(sourceInfo)

    return row
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
