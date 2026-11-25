import type { TInteractiveInkCanvas } from "@/canvas"
import type { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { TMenuPosition } from "./SubMenuItem"

/**
 * @group Menu
 * @remarks Base type for menu items
 */
export type TMenuItemBase = {
  id: string
  label?: string
  disabled?: boolean | ((canvas: TInteractiveInkCanvas) => boolean)
  visible?: boolean | ((canvas: TInteractiveInkCanvas) => boolean)
}

/**
 * @group Menu
 * @remarks Heading of a field item: an icon and a title, then a hint saying what it does
 */
export type TMenuFieldHeading = {
  /** SVG markup shown before the title */
  icon?: string
  title?: string
  hint?: string
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
  protected canvas: TInteractiveInkCanvas
  protected element?: T
  /**
   * Where this item opens its sub-menu, set by its menu from the menu's slot before the element is built;
   * an item that opens one reads it before its own default
   */
  openPosition?: TMenuPosition

  /** @hidden */
  protected get dom(): typeof DOMFactory {
    return this.canvas.dom
  }

  constructor(config: TGenericMenuItem, canvas: TInteractiveInkCanvas) {
    this.config = config
    this.canvas = canvas
  }

  /**
   * Creates the HTML element
   */
  abstract createElement(): T

  /**
   * Updates the element (for reactivity)
   */
  abstract update(): void

  /** The title and hint a field item shows above its field; none without them */
  protected buildFieldHeading({ icon, title, hint }: TMenuFieldHeading): HTMLElement[] {
    const heading: HTMLElement[] = []
    if (title) {
      const titleElement = this.dom.div({ className: "ms-menu-field-title", html: icon })
      titleElement.append(title)
      heading.push(titleElement)
    }
    if (hint) {
      heading.push(this.dom.div({ className: "ms-menu-field-hint", text: hint }))
    }
    return heading
  }

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
      const isDisabled = this.config.disabled(this.canvas)
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
      this.element.style.display = this.config.visible(this.canvas) ? "" : "none"
    } else {
      this.element.style.display = this.config.visible === false ? "none" : ""
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
