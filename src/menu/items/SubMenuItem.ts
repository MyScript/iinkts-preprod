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
  private subMenuWrapper?: HTMLElement
  private subMenuContent?: HTMLDivElement
  private trigger?: HTMLButtonElement
  private subMenuItems: Map<string, BaseMenuItem> = new Map()

  createElement(): HTMLDivElement {
    // Wrapper principal
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("sub-menu")

    // Bouton trigger
    this.trigger = document.createElement("button")
    this.trigger.classList.add("ms-menu-button")
    if (this.config.icon && this.config.label) {
      const labelSpan = document.createElement("span")
      labelSpan.textContent = this.config.label
      this.trigger.appendChild(labelSpan)
      const iconSpan = document.createElement("span")
      iconSpan.style.setProperty("width", "32px")
      // iconSpan.style.setProperty("transform", "rotate(270deg)")
      iconSpan.innerHTML = this.config.icon
      this.trigger.appendChild(iconSpan)
    } else if (this.config.icon) {
      this.trigger.classList.add("square")
      this.trigger.innerHTML = this.config.icon
    } else if (this.config.label) {
      this.trigger.textContent = this.config.label
    }
    wrapper.appendChild(this.trigger)

    this.subMenuContent = document.createElement("div")
    this.subMenuContent.classList.add("sub-menu-content", this.config.position || "right-top")

    if (this.config.menuTitle) {
      const menuTitleElement = document.createElement("h3")
      menuTitleElement.classList.add("ms-menu-title")
      menuTitleElement.textContent = this.config.menuTitle
      this.subMenuContent.appendChild(menuTitleElement)
    }

    this.subMenuWrapper = document.createElement("div")
    this.subMenuWrapper.classList.add("ms-menu-colmun")

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
  }

  /**
   * Closes the submenu
   */
  close(): void {
    this.subMenuContent?.classList.remove("open")
  }

  /**
   * Toggles the submenu state
   */
  toggle(): void {
    this.subMenuContent?.classList.toggle("open")
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
