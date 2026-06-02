import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a button list (S, M, L, XL)
 */
export interface IMenuButtonList extends IMenuItemBase {
  type: "buttonlist"
  buttonType?: "square" | "round"
  options: Array<{ label: string, value: string }>
  getValue: (editor: InteractiveInkEditor) => string
  setValue: (editor: InteractiveInkEditor, value: string) => void
}

/**
 * @group Menu
 * @remarks Class for button lists
 */
export class ButtonListMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuButtonList

  createElement(): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-item", "list")

    if (this.config.label) {
      const label = document.createElement("span")
      label.textContent = this.config.label
      wrapper.appendChild(label)
    }

    const currentValue = this.config.getValue(this.editor)

    this.config.options.forEach(option => {
      const button = document.createElement("button")
      button.id = `${this.config.id}-${option.value}`
      button.textContent = option.label

      if (option.value === currentValue) {
        button.classList.add("active")
      }
      if (this.config.buttonType) {
        button.classList.add(this.config.buttonType)
      }

      button.addEventListener("pointerup", () => {
        this.logger.info(`${this.config.id}.change`, { value: option.value })
        this.config.setValue(this.editor, option.value)

        wrapper.querySelectorAll("button").forEach(btn => btn.classList.remove("active"))
        button.classList.add("active")
      })

      wrapper.appendChild(button)
    })

    if (typeof this.config.disabled === "function") {
      const isDisabled = this.config.disabled(this.editor)
      wrapper.querySelectorAll("button").forEach(btn => {
        (btn as HTMLButtonElement).disabled = isDisabled
      })
    } else if (this.config.disabled) {
      wrapper.querySelectorAll("button").forEach(btn => {
        (btn as HTMLButtonElement).disabled = true
      })
    }

    return wrapper
  }

  update(): void {
    if (!this.element) return

    const currentValue = this.config.getValue(this.editor)
    this.element.querySelectorAll("button").forEach(btn => {
      const value = btn.id.replace(`${this.config.id}-`, "")
      if (value === currentValue) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

    this.updateDisabled()
    this.updateVisible()
  }
}
