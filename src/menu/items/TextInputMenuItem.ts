import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuFieldHeading, TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a text field with a validation button
 */
export type TMenuTextInput = TMenuItemBase &
  TMenuFieldHeading & {
    type: "textinput"
    placeholder?: string
    buttonLabel?: string
    /** Value suggested in the field, asked again on each update until the user types */
    value?: (canvas: TInteractiveInkCanvas) => string | undefined | Promise<string | undefined>
    /** Runs on validation, with the trimmed text */
    action: (canvas: TInteractiveInkCanvas, value: string) => void | Promise<void>
  }

/**
 * @group Menu
 * @remarks Menu item for typing a text, suggested by default, and validating it
 */
export class TextInputMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuTextInput
  protected inputElement!: HTMLInputElement
  /** Set once the user typed: the suggestion no longer replaces the text until it is validated */
  protected edited = false

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({ id: this.config.id, className: "ms-menu-text-input ms-menu-column ms-gap-sm" })
    wrapper.append(...this.buildFieldHeading(this.config))
    this.inputElement = this.dom.textInput({
      id: `${this.config.id}-input`,
      placeholder: this.config.placeholder,
      fullWidth: true,
    })
    this.inputElement.addEventListener("input", () => (this.edited = true))
    wrapper.appendChild(this.inputElement)

    const button = this.dom.button({
      label: this.config.buttonLabel || this.config.label || "OK",
      variant: "primary",
      className: "full-width",
    })
    button.addEventListener("pointerup", async (e) => {
      e.preventDefault()
      e.stopPropagation()
      await this.config.action(this.canvas, this.inputElement.value.trim())
      this.edited = false
      wrapper.dispatchEvent(new CustomEvent("ms-menu-close", { bubbles: true }))
    })
    wrapper.appendChild(button)
    return wrapper
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
    void this.suggest()
  }

  protected async suggest(): Promise<void> {
    if (!this.config.value || this.edited) {
      return
    }
    const value = await this.config.value(this.canvas)
    // The user may have typed while the suggestion was computed
    if (!this.edited && this.inputElement) {
      this.inputElement.value = value ?? ""
    }
  }
}
