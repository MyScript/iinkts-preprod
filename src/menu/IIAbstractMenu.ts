import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { BaseMenuItem, TMenuPosition } from "./items"

/**
 * @group Menu
 * @summary Where an item goes in a menu: its always-visible row, or the column behind its trigger
 */
export type TMenuZone = "bar" | "dropdown"

/**
 * @group Menu
 */
export type TMenuItemOptions = {
  /** Defaults to the menu's {@link IIAbstractMenu.defaultZone} */
  zone?: TMenuZone
}

/**
 * @group Menu
 * @summary What every menu shares: its items, their lifecycle, its zones and the dropdown mechanics
 * @remarks Every member is protected or public, never private: menus are replaced through `options.override.menu`.
 * A zone is built on its first item, so a menu shows no empty row nor an empty dropdown.
 */
export abstract class IIAbstractMenu<TConfig> {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLElement
  config: TConfig

  /** Where an item goes when {@link addItem} names no zone */
  abstract readonly defaultZone: TMenuZone

  /** The rendered items, by key: updated and destroyed with the menu */
  protected items: Map<string, BaseMenuItem> = new Map()
  /** The containers of the zones built so far */
  protected zones: Partial<Record<TMenuZone, HTMLElement>> = {}
  /** The wrapper {@link zones} were built in */
  protected zonesWrapper?: HTMLElement
  /** Closes the dropdown on a pointerdown outside it; set by {@link createDropdown} */
  protected documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(canvas: TInteractiveInkCanvas, id: string, config: TConfig) {
    this.canvas = canvas
    this.id = id
    this.config = config
    this.logger.info("constructor", { id })
  }

  abstract render(layer: HTMLElement): void

  /** Builds the container of `zone` and inserts it in `wrapper` */
  protected abstract createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement

  /** A sub-menu's config entry: `true` enables it with its defaults, an object configures it */
  protected subConfig<T>(config: boolean | T): T | undefined {
    return typeof config === "object" && config !== null ? config : undefined
  }

  /** The container of `zone`, built on first use */
  protected getZone(zone: TMenuZone): HTMLElement {
    if (!this.wrapper) {
      throw new Error(`${this.id}: items are added during render(), once wrapper is set`)
    }
    // A new wrapper is a new render: the zones built in the previous one belong to the old wrapper
    if (this.zonesWrapper !== this.wrapper) {
      this.zones = {}
      this.zonesWrapper = this.wrapper
    }
    const container = this.zones[zone] ?? this.createZone(zone, this.wrapper)
    this.zones[zone] = container
    return container
  }

  /** Inserts an item's element in its zone; a menu overrides it to keep its own elements in place */
  protected insertInZone(zone: TMenuZone, element: HTMLElement): void {
    this.getZone(zone).appendChild(element)
  }

  /** Keeps `item` with the menu's items and inserts its element in its zone */
  protected addItem(key: string, item: BaseMenuItem, options?: TMenuItemOptions): void {
    this.items.set(key, item)
    this.insertInZone(options?.zone ?? this.defaultZone, item.getElement())
  }

  /**
   * Builds a dropdown: `trigger` toggles `content`, a pointerdown anywhere outside closes it.
   * @returns the dropdown element to insert, and the element holding `content`
   */
  protected createDropdown(
    trigger: HTMLButtonElement,
    content: HTMLElement,
    position: TMenuPosition
  ): { element: HTMLDivElement; content: HTMLDivElement } {
    const element = DOMFactory.div({ className: "sub-menu" })
    element.appendChild(trigger)
    const contentWrapper = DOMFactory.div({ className: ["sub-menu-content", position] })
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
    this.zones = {}
    this.zonesWrapper = undefined
    this.wrapper?.remove()
    this.wrapper = undefined
  }
}
