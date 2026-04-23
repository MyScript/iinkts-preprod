import { InteractiveInkEditor } from "../../editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a checkbox
 */
export interface IMenuCheckbox extends IMenuItemBase {
  type: "checkbox"
  getValue: (editor: InteractiveInkEditor) => boolean
  setValue: (editor: InteractiveInkEditor, value: boolean) => void
}

/**
 * @group Menu
 * @remarks Class for checkboxes
 */
export class CheckboxMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuCheckbox

  createElement(): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-item", "checkbox")

    if (this.config.label) {
      const label = document.createElement("span")
      label.textContent = this.config.label
      wrapper.appendChild(label)
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = `${this.config.id}-input`
    checkbox.checked = this.config.getValue(this.editor)

    checkbox.addEventListener("change", () => {
      this.logger.info(`${this.config.id}.change`, { value: checkbox.checked })
      this.config.setValue(this.editor, checkbox.checked)
    })

    wrapper.appendChild(checkbox)

    // Apply initial disabled state
    if (typeof this.config.disabled === "function") {
      checkbox.disabled = this.config.disabled(this.editor)
    } else if (this.config.disabled) {
      checkbox.disabled = true
    }

    return wrapper
  }

  update(): void {
    if (!this.element) return

    const checkbox = this.element.querySelector("input") as HTMLInputElement
    if (checkbox) {
      checkbox.checked = this.config.getValue(this.editor)
    }

    this.updateDisabled()
    this.updateVisible()
  }
}
