/**
 * Reusable UI component utilities
 */

import { colorDotStyle, buttonStyle, flexContainerStyle, SPACING, BORDER_RADIUS } from "./styles"

/**
 * Create a color dot element
 */
export function createColorDot(color: string, size: string = "12px"): HTMLSpanElement {
  const dot = document.createElement("span")
  dot.style.cssText = colorDotStyle(color, size)
  return dot
}

/**
 * Create a button with consistent styling
 */
export function createButton(config: {
  label: string
  backgroundColor?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}): HTMLButtonElement {
  const button = document.createElement("button")
  button.textContent = config.label
  button.className = config.className || "ms-menu-button"
  button.disabled = config.disabled || false
  button.style.cssText = buttonStyle(config.backgroundColor)

  if (config.disabled) {
    button.style.opacity = "0.5"
  }

  if (config.onClick) {
    button.addEventListener("click", config.onClick)
  }

  return button
}

/**
 * Create a button group container
 */
export function createButtonGroup(buttons: HTMLButtonElement[], gap: string = SPACING.sm): HTMLDivElement {
  const container = document.createElement("div")
  container.style.cssText = `
    ${flexContainerStyle(gap)}
    flex-wrap: wrap;
  `
  buttons.forEach(btn => container.appendChild(btn))
  return container
}

/**
 * Create a labeled input field
 */
export function createLabeledInput(config: {
  id: string
  label: string
  type?: string
  defaultValue?: string | number
  placeholder?: string
  min?: number
  max?: number
  step?: number
}): { wrapper: HTMLDivElement; input: HTMLInputElement; label: HTMLLabelElement } {
  const wrapper = document.createElement("div")
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.xs};
  `

  const labelElement = document.createElement("label")
  labelElement.htmlFor = config.id
  labelElement.textContent = config.label
  labelElement.style.cssText = `
    font-size: 12px;
    font-weight: 500;
    color: #424242;
  `

  const input = document.createElement("input")
  input.type = config.type || "number"
  input.id = config.id
  input.value = String(config.defaultValue ?? "")
  input.placeholder = config.placeholder || ""
  input.style.cssText = `
    padding: ${SPACING.sm} ${SPACING.md};
    border: 1px solid #ccc;
    border-radius: ${BORDER_RADIUS.sm};
    font-size: 14px;
  `

  if (config.min !== undefined) input.min = String(config.min)
  if (config.max !== undefined) input.max = String(config.max)
  if (config.step !== undefined) input.step = String(config.step)

  wrapper.appendChild(labelElement)
  wrapper.appendChild(input)

  return { wrapper, input, label: labelElement }
}

/**
 * Create a select dropdown with options
 */
export function createSelect(config: {
  id: string
  options: Array<{ value: string; label: string; selected?: boolean }>
  onChange?: (value: string) => void
}): HTMLSelectElement {
  const select = document.createElement("select")
  select.id = config.id
  select.style.cssText = `
    padding: ${SPACING.xs} ${SPACING.sm};
    border: 1px solid #ccc;
    border-radius: ${BORDER_RADIUS.sm};
    font-size: 12px;
    background: white;
    cursor: pointer;
  `

  config.options.forEach(opt => {
    const option = document.createElement("option")
    option.value = opt.value
    option.textContent = opt.label
    if (opt.selected) option.selected = true
    select.appendChild(option)
  })

  if (config.onChange) {
    select.addEventListener("change", () => config.onChange!(select.value))
  }

  return select
}

/**
 * Create a flex row container
 */
export function createFlexRow(config: {
  gap?: string
  alignItems?: string
  justifyContent?: string
  children?: HTMLElement[]
}): HTMLDivElement {
  const container = document.createElement("div")
  container.style.cssText = `
    display: flex;
    gap: ${config.gap || SPACING.sm};
    align-items: ${config.alignItems || "center"};
    justify-content: ${config.justifyContent || "flex-start"};
  `

  if (config.children) {
    config.children.forEach(child => container.appendChild(child))
  }

  return container
}

/**
 * Create a section title
 */
export function createSectionTitle(text: string, level: "h2" | "h3" = "h2"): HTMLDivElement {
  const title = document.createElement("div")
  title.style.cssText = `
    font-weight: 600;
    font-size: ${level === "h2" ? "16px" : "14px"};
    margin-bottom: ${SPACING.md};
    color: #424242;
  `
  title.textContent = text
  return title
}

/**
 * Create a monospace text element
 */
export function createMonoText(text: string, color?: string): HTMLSpanElement {
  const span = document.createElement("span")
  span.textContent = text
  span.style.cssText = `
    font-family: monospace;
    ${color ? `color: ${color};` : ""}
  `
  return span
}

/**
 * Create a status badge (✓ or ✗)
 */
export function createStatusBadge(available: boolean): HTMLSpanElement {
  const badge = document.createElement("span")
  badge.textContent = available ? "✓" : "✗"
  badge.style.cssText = available
    ? "color: #4CAF50; font-weight: bold; font-size: 16px;"
    : "color: #f44336; font-weight: bold; font-size: 16px;"
  return badge
}
