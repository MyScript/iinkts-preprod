import { InteractiveInkEditor } from "../../editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a select/dropdown menu item
 */
export interface IMenuSelect extends IMenuItemBase {
  type: "select"
  options: Array<{ label: string, value: string }>
  getValue: (editor: InteractiveInkEditor) => string
  setValue: (editor: InteractiveInkEditor, value: string) => void
}

/**
 * @group Menu
 * @remarks Class for select/dropdown menu items
 */
export class SelectMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuSelect

  createElement(): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-item", "select")

    if (this.config.label) {
      const label = document.createElement("span")
      label.textContent = this.config.label
      wrapper.appendChild(label)
    }

    const select = document.createElement("select")
    select.id = `${this.config.id}-input`

    const currentValue = this.config.getValue(this.editor)
    this.config.options.forEach(option => {
      const opt = document.createElement("option")
      opt.value = option.value
      opt.textContent = option.label
      opt.selected = option.value === currentValue
      select.appendChild(opt)
    })

    select.addEventListener("change", () => {
      this.logger.info(`${this.config.id}.change`, { value: select.value })
      this.config.setValue(this.editor, select.value)
    })

    wrapper.appendChild(select)

    // Apply initial disabled state
    if (typeof this.config.disabled === "function") {
      select.disabled = this.config.disabled(this.editor)
    } else if (this.config.disabled) {
      select.disabled = true
    }

    return wrapper
  }

  update(): void {
    if (!this.element) return

    const select = this.element.querySelector("select") as HTMLSelectElement
    if (select) {
      select.value = this.config.getValue(this.editor)
    }

    this.updateDisabled()
    this.updateVisible()
  }
}
