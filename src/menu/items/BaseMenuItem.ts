import type { DOMFactory } from "@/components/dom"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Menu
 * @remarks Base type for menu items
 */
export type TMenuItemBase = {
  id: string
  label?: string
  disabled?: boolean | ((editor: TInteractiveInkEditor) => boolean)
  visible?: boolean | ((editor: TInteractiveInkEditor) => boolean)
}

/**
 * @group Menu
 * @remarks Union type for all menu types
 */
export type TGenericMenuItem = TMenuItemBase & {
  type: string
}

/**
 * @group Menu
 * @remarks Base class for all menu items
 */
export abstract class BaseMenuItem<T extends HTMLElement = HTMLElement> {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  protected config: TGenericMenuItem
  protected editor: TInteractiveInkEditor
  protected element?: T

  protected get dom(): typeof DOMFactory {
    return this.editor.dom
  }

  constructor(config: TGenericMenuItem, editor: TInteractiveInkEditor) {
    this.config = config
    this.editor = editor
  }

  /**
   * Creates the HTML element
   */
  abstract createElement(): T

  /**
   * Updates the element (for reactivity)
   */
  abstract update(): void

  /**
   * Returns the HTML element
   */
  getElement(): T {
    if (!this.element) {
      this.element = this.createElement()
    }
    return this.element
  }

  /**
   * Updates the disabled state
   */
  protected updateDisabled(): void {
    if (!this.element) {
      return
    }

    if (typeof this.config.disabled === "function") {
      const isDisabled = this.config.disabled(this.editor)
      if (this.element instanceof HTMLButtonElement) {
        this.element.disabled = isDisabled
      } else {
        const input = this.element.querySelector("input, select") as HTMLInputElement | HTMLSelectElement
        if (input) {
          input.disabled = isDisabled
        }
      }
    }
  }

  /**
   * Updates the visible state
   */
  protected updateVisible(): void {
    if (!this.element) {
      return
    }

    if (typeof this.config.visible === "function") {
      this.element.style.display = this.config.visible(this.editor) ? "" : "none"
    }
  }

  /**
   * Destroys the element and cleans up resources
   */
  destroy(): void {
    if (this.element) {
      this.element.remove()
      this.element = undefined
    }
  }
}
