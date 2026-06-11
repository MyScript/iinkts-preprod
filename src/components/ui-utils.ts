/**
 * Reusable UI component utilities
 */

import { colorDotStyle, buttonStyle, SPACING, BORDER_RADIUS, flexColumnStyle } from "./styles"

/**
 * Create a color dot element
 * @group Utilities
 */
export function createColorDot(color: string, size: string = "12px"): HTMLSpanElement {
  const dot = document.createElement("span")
  dot.style.cssText = colorDotStyle(color, size)
  return dot
}

/**
 * Create a button with consistent styling
 * @group Utilities
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
 * Create a number input field
 * @group Utilities
 */
export function createNumberInput(config: {
  id: string
  defaultValue?: number
  step?: string | number
  min?: number
  max?: number
  placeholder?: string
  fullWidth?: boolean
}): HTMLInputElement {
  const input = document.createElement("input")
  input.type = "number"
  input.id = config.id
  input.value = String(config.defaultValue ?? "")
  input.step = config.step !== undefined ? String(config.step) : "any"
  input.placeholder = config.placeholder || ""
  input.style.cssText = `
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: ${BORDER_RADIUS.sm};
    font-size: 14px;
    ${config.fullWidth ? "width: 100%;" : ""}
  `

  if (config.min !== undefined) input.min = String(config.min)
  if (config.max !== undefined) input.max = String(config.max)

  return input
}

/**
 * Create a labeled input field
 * @group Utilities
 */
export function createLabeledInput(config: {
  id: string
  label: string
  type?: string
  defaultValue?: string | number
  placeholder?: string
  min?: number
  max?: number
  step?: string | number
  labelSize?: string
  gap?: string
}): { wrapper: HTMLDivElement; input: HTMLInputElement; label: HTMLLabelElement } {
  const wrapper = document.createElement("div")
  wrapper.style.cssText = flexColumnStyle(config.gap || SPACING.xs)

  const labelElement = document.createElement("label")
  labelElement.htmlFor = config.id
  labelElement.textContent = config.label
  labelElement.style.cssText = `
    font-size: ${config.labelSize || "13px"};
    font-weight: 500;
    color: #424242;
  `

  const input = document.createElement("input")
  input.type = config.type || "number"
  input.id = config.id
  input.value = String(config.defaultValue ?? "")
  input.placeholder = config.placeholder || ""
  input.step = config.step !== undefined ? String(config.step) : (config.type === "number" ? "any" : "")
  input.style.cssText = `
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: ${BORDER_RADIUS.sm};
    font-size: 14px;
    width: 100%;
  `

  if (config.min !== undefined) input.min = String(config.min)
  if (config.max !== undefined) input.max = String(config.max)

  wrapper.appendChild(labelElement)
  wrapper.appendChild(input)

  return { wrapper, input, label: labelElement }
}

/**
 * Create a select dropdown with options
 * @group Utilities
 */
export function createSelect(config: {
  id: string
  options: Array<{ value: string; label: string; selected?: boolean }>
  onChange?: (value: string) => void
  customStyle?: string
  className?: string
  defaultValue?: string
}): HTMLSelectElement {
  const select = document.createElement("select")
  select.id = config.id

  if (config.customStyle) {
    select.style.cssText = config.customStyle
  } else {
    select.style.cssText = `
      padding: ${SPACING.xs} ${SPACING.sm};
      border: 1px solid #ccc;
      border-radius: ${BORDER_RADIUS.sm};
      font-size: 12px;
      background: white;
      cursor: pointer;
    `
  }

  if (config.className) {
    select.classList.add(config.className)
  }

  config.options.forEach(opt => {
    const option = document.createElement("option")
    option.value = opt.value
    option.textContent = opt.label
    if (opt.selected) option.selected = true
    select.appendChild(option)
  })

  if (config.defaultValue !== undefined) {
    select.value = config.defaultValue
  }

  if (config.onChange) {
    select.addEventListener("change", () => config.onChange!(select.value))
  }

  return select
}

/**
 * Create a status badge (✓ or ✗)
 * @group Utilities
 */
export function createStatusBadge(available: boolean): HTMLSpanElement {
  const badge = document.createElement("span")
  badge.textContent = available ? "✓" : "✗"
  badge.style.cssText = available
    ? "color: #4CAF50; font-weight: bold; font-size: 16px;"
    : "color: #f44336; font-weight: bold; font-size: 16px;"
  return badge
}
