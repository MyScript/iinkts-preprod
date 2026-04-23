import { InteractiveInkEditor } from "../../editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a color list menu item
 */
export interface IMenuColorList extends IMenuItemBase {
  type: "colorlist"
  colors: string[]
  fill: boolean
  initValue?: string
  onChange: (color: string, editor: InteractiveInkEditor) => void
}

/**
 * @group Menu
 * @remarks Class for color list menu items
 */
export class ColorListMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuColorList
  private currentValue: string

  constructor(config: IMenuColorList, editor: InteractiveInkEditor) {
    super(config, editor)
    this.currentValue = config.initValue || config.colors[0] || "#000000"
  }

  createElement(): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-row", "color-list")

    this.config.colors.forEach((color) => {
      const btn = document.createElement("button")
      const colorId = color.replace("#", "")
      btn.id = `${this.config.id}-${colorId}`
      btn.classList.add("ms-menu-button", "square")

      const colorEl = document.createElement("div")
      colorEl.classList.add("color")

      if (this.config.fill) {
        colorEl.style.setProperty("background-color", color)
        colorEl.style.setProperty("border", "1px solid lightgrey")
      } else {
        colorEl.style.setProperty("background-color", "transparent")
        colorEl.style.setProperty("border", `3px solid ${color}`)
      }

      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }

      if (color === "transparent") {
        colorEl.style.setProperty("background-image", "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)")
      }

      if (this.currentValue === color) {
        btn.classList.add("active")
      }

      btn.appendChild(colorEl)
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.currentValue = color
        this.config.onChange(color, this.editor)
        wrapper.querySelectorAll("button").forEach(b => b.classList.remove("active"))
        btn.classList.add("active")
      })

      wrapper.appendChild(btn)
    })

    return wrapper
  }

  getValue(): string {
    return this.currentValue
  }

  setValue(color: string): void {
    if (!this.element) return

    this.currentValue = color
    const buttons = this.element.querySelectorAll("button")
    buttons.forEach(btn => {
      const colorId = color.replace("#", "")
      if (btn.id === `${this.config.id}-${colorId}`) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
