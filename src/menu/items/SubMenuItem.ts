import ArrowDown from "../../assets/svg/nav-arrow-down.svg"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"
import { createMenuItemInstance } from "./MenuItemFactory"
import { IMenuButton } from "./ButtonMenuItem"
import { IMenuCheckbox } from "./CheckboxMenuItem"
import { IMenuSelect } from "./SelectMenuItem"
import { IMenuButtonList } from "./ButtonListMenuItem"
import { IMenuFileInput } from "./FileInputMenuItem"

/**
 * @group Menu
 * @remarks Submenu position type
 */
export type TMenuPosition = "top" | "left" | "right" | "right-top" | "bottom" | "bottom-left" | "bottom-right"

/**
 * @group Menu
 * @remarks Union type for submenu items (without recursive submenu to avoid circularity)
 */
export type TSubMenuItems = IMenuButton | IMenuCheckbox | IMenuSelect | IMenuButtonList | IMenuFileInput

/**
 * @group Menu
 * @remarks Submenu configuration
 */
export interface IMenuSubMenu extends IMenuItemBase {
  type: "submenu"
  icon?: string
  position?: TMenuPosition
  menuTitle?: string
  items: (TSubMenuItems | IMenuSubMenu)[]
}

/**
 * @group Menu
 * @remarks Class for submenu items
 */
export class SubMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuSubMenu
  protected subMenuWrapper?: HTMLElement
  protected subMenuContent?: HTMLDivElement
  protected trigger?: HTMLButtonElement
  protected arrowSpan?: HTMLSpanElement
  protected subMenuItems: Map<string, BaseMenuItem> = new Map()
  protected closedRotation: number = 0
  protected openedRotation: number = 180

  protected getArrowRotationForPosition(position: TMenuPosition): number {
    if (position.includes("bottom")) {
      return 180
    } else if (position.includes("left")) {
      return 90
    } else if (position.includes("right")) {
      return -90
    } else {
      return 0
    }
  }

  createElement(): HTMLDivElement {
    // Wrapper principal
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("sub-menu")

    // Bouton trigger
    this.trigger = document.createElement("button")
    this.trigger.classList.add("ms-menu-button")
    const position = this.config.position || "right-top"

    this.closedRotation = this.getArrowRotationForPosition(position)
    this.openedRotation = this.closedRotation + 180

    this.arrowSpan = document.createElement("span")
    this.arrowSpan.innerHTML = ArrowDown
    this.arrowSpan.style.transition = "transform 0.2s ease"
    this.arrowSpan.style.transform = `rotate(${this.closedRotation}deg)`

    if (this.config.icon && this.config.label) {
      const labelSpan = document.createElement("span")
      labelSpan.textContent = this.config.label
      this.trigger.appendChild(labelSpan)
      const iconSpan = document.createElement("span")
      iconSpan.style.setProperty("width", "32px")
      iconSpan.innerHTML = this.config.icon
      this.trigger.appendChild(iconSpan)
    } else if (this.config.icon) {
      const iconSpan = document.createElement("span")
      iconSpan.style.setProperty("width", "32px")
      iconSpan.innerHTML = this.config.icon
      this.trigger.appendChild(iconSpan)
    } else if (this.config.label) {
      this.trigger.textContent = this.config.label
    }

    if (position.includes("left")) {
      this.trigger.prepend(this.arrowSpan)
    } else {
      this.trigger.appendChild(this.arrowSpan)
    }

    wrapper.appendChild(this.trigger)

    this.subMenuContent = document.createElement("div")
    this.subMenuContent.classList.add("sub-menu-content", position)

    if (this.config.menuTitle) {
      const menuTitleElement = document.createElement("h3")
      menuTitleElement.classList.add("ms-menu-title")
      menuTitleElement.textContent = this.config.menuTitle
      this.subMenuContent.appendChild(menuTitleElement)
    }

    this.subMenuWrapper = document.createElement("div")
    this.subMenuWrapper.classList.add("ms-menu-column")

    this.config.items.forEach(item => {
      const menuItem = createMenuItemInstance(item, this.editor)
      const element = menuItem.getElement()
      if (element) {
        this.subMenuWrapper!.appendChild(element)
        this.subMenuItems.set(item.id, menuItem)
      }
    })

    this.subMenuContent.appendChild(this.subMenuWrapper)
    wrapper.appendChild(this.subMenuContent)

    this.trigger.addEventListener("pointerdown", () => this.toggle())
    document.addEventListener("pointerdown", (e) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        this.close()
      }
    })

    return wrapper
  }

  /**
   * Opens the submenu
   */
  open(): void {
    this.subMenuContent?.classList.add("open")
    if (this.arrowSpan) {
      this.arrowSpan.style.transform = `rotate(${this.openedRotation}deg)`
    }
  }

  /**
   * Closes the submenu
   */
  close(): void {
    this.subMenuContent?.classList.remove("open")
    if (this.arrowSpan) {
      this.arrowSpan.style.transform = `rotate(${this.closedRotation}deg)`
    }
  }

  /**
   * Toggles the submenu state
   */
  toggle(): void {
    this.subMenuContent?.classList.toggle("open")
    if (this.arrowSpan) {
      const isOpen = this.subMenuContent?.classList.contains("open")
      this.arrowSpan.style.transform = `rotate(${isOpen ? this.openedRotation : this.closedRotation}deg)`
    }
  }

  /**
   * Unwraps the submenu (mobile mode)
   */
  unwrap(): void {
    if (this.subMenuContent && this.element) {
      this.subMenuContent.classList.remove("sub-menu-content")
      this.element.insertAdjacentElement("beforebegin", this.subMenuContent)
      this.element.style.display = "none"
    }
  }

  /**
   * Wraps the submenu (desktop mode)
   */
  wrap(): void {
    if (this.subMenuContent && this.element) {
      this.subMenuContent.classList.add("sub-menu-content")
      this.element.appendChild(this.subMenuContent)
      this.element.style.display = "block"
    }
  }

  update(): void {
    this.subMenuItems.forEach(menuItem => {
      menuItem.update()
    })

    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    this.subMenuItems.forEach(menuItem => {
      menuItem.destroy()
    })
    this.subMenuItems.clear()

    super.destroy()
  }
}
