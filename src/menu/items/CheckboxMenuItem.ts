import type { InteractiveInkEditor } from "@/editor"
import type { TMenuItemBase } from "./BaseMenuItem";
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a checkbox
 */
export type TMenuCheckbox = TMenuItemBase & {
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
  protected declare config: TMenuCheckbox

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({ id: this.config.id, className: ["ms-menu-item", "checkbox"] })

    if (this.config.label) {
      wrapper.appendChild(this.dom.span({ text: this.config.label }))
    }

    const isDisabled = typeof this.config.disabled === "function"
      ? this.config.disabled(this.editor)
      : (this.config.disabled ?? false)

    const checkbox = this.dom.checkbox({
      id: `${this.config.id}-input`,
      checked: this.config.getValue(this.editor),
      disabled: isDisabled,
    })

    checkbox.addEventListener("change", () => {
      this.logger.info(`${this.config.id}.change`, { value: checkbox.checked })
      this.config.setValue(this.editor, checkbox.checked)
    })

    wrapper.appendChild(checkbox)

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
