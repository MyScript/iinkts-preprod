import { InteractiveInkEditor } from "@/editor"
import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Menu
 * @remarks Base type for menu items
 */
export interface IMenuItemBase {
  id: string
  label?: string
  disabled?: boolean | ((editor: InteractiveInkEditor) => boolean)
  visible?: boolean | ((editor: InteractiveInkEditor) => boolean)
}

/**
 * @group Menu
 * @remarks Union type for all menu types
 */
export type TGenericMenuItem = IMenuItemBase & { type: string }

/**
 * @group Menu
 * @remarks Base class for all menu items
 */
export abstract class BaseMenuItem<T extends HTMLElement = HTMLElement>
{
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  protected config: TGenericMenuItem
  protected editor: InteractiveInkEditor
  protected element?: T

  constructor(config: TGenericMenuItem, editor: InteractiveInkEditor) {
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
    if (!this.element) return

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
    if (!this.element) return

    if (typeof this.config.visible === "function") {
      this.element.style.display = this.config.visible(this.editor) ? "" : "none"
    }
  }

  /**
   * Destroys the element and cleans up resources
   */
  destroy(): void {
    if (this.element) {
      this.element.replaceWith(this.element.cloneNode(false))
      this.element.remove()
      this.element = undefined
    }
  }
}
