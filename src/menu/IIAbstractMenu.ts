import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { BaseMenuItem } from "./items"

/**
 * @group Menu
 * @summary Where a dropdown's content opens, relative to its trigger
 */
export type TMenuDropdownPlacement = "bottom-left" | "bottom-right"

/**
 * @group Menu
 * @summary What every menu shares: its items, their lifecycle and the dropdown mechanics
 * @remarks Every member is protected or public, never private: menus are replaced through `options.override.menu`.
 */
export abstract class IIAbstractMenu<TConfig> {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLElement
  config: TConfig

  /** The rendered items, by key: updated and destroyed with the menu */
  protected items: Map<string, BaseMenuItem> = new Map()
  /** Closes the dropdown on a pointerdown outside it; set by {@link createDropdown} */
  protected documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(canvas: TInteractiveInkCanvas, id: string, config: TConfig) {
    this.canvas = canvas
    this.id = id
    this.config = config
    this.logger.info("constructor", { id })
  }

  abstract render(layer: HTMLElement): void

  /** A sub-menu's config entry: `true` enables it with its defaults, an object configures it */
  protected subConfig<T>(config: boolean | T): T | undefined {
    return typeof config === "object" && config !== null ? config : undefined
  }

  /** Keeps `item` with the menu's items and appends its element to `container` */
  protected addItem(key: string, item: BaseMenuItem, container: HTMLElement): void {
    this.items.set(key, item)
    container.appendChild(item.getElement())
  }

  /**
   * Builds a dropdown: `trigger` toggles `content`, a pointerdown anywhere outside closes it.
   * @returns the dropdown element to insert, and the element holding `content`
   */
  protected createDropdown(
    trigger: HTMLButtonElement,
    content: HTMLElement,
    placement: TMenuDropdownPlacement
  ): { element: HTMLDivElement; content: HTMLDivElement } {
    const element = DOMFactory.div({ className: "sub-menu" })
    element.appendChild(trigger)
    const contentWrapper = DOMFactory.div({ className: ["sub-menu-content", placement] })
    contentWrapper.appendChild(content)
    element.appendChild(contentWrapper)

    trigger.addEventListener("pointerdown", () => contentWrapper.classList.toggle("open"))
    this.documentPointerdownHandler = (e: PointerEvent) => {
      if (!(e.target instanceof Node && element.contains(e.target))) {
        contentWrapper.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.documentPointerdownHandler)
    return { element, content: contentWrapper }
  }

  update(): void {
    this.items.forEach((item) => item.update())
  }

  show(): void {
    if (this.wrapper) {
      this.wrapper.style.visibility = "visible"
    }
  }

  hide(): void {
    if (this.wrapper) {
      this.wrapper.style.visibility = "hidden"
    }
  }

  destroy(): void {
    if (this.documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.documentPointerdownHandler)
      this.documentPointerdownHandler = undefined
    }
    this.items.forEach((item) => item.destroy())
    this.items.clear()
    this.wrapper?.remove()
    this.wrapper = undefined
  }
}
