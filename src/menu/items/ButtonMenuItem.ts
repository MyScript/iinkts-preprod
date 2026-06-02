import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a simple button
 */
export interface IMenuButton extends IMenuItemBase {
  type: "button"
  icon?: string
  action: (editor: InteractiveInkEditor) => void | Promise<void>
}

/**
 * @group Menu
 * @remarks Class for buttons
 */
export class ButtonMenuItem extends BaseMenuItem<HTMLButtonElement>
{
  protected declare config: IMenuButton

  createElement(): HTMLButtonElement {
    const button = document.createElement("button")
    button.id = this.config.id
    button.classList.add("ms-menu-button")

    if (this.config.label) {
      button.textContent = this.config.label
    }
    if (this.config.icon) {
      button.innerHTML = this.config.icon
      button.classList.add("square")
    }

    button.addEventListener("pointerup", async () => {
      this.logger.info(`${this.config.id}.click`)
      await this.config.action(this.editor)
    })

    // Apply initial disabled state
    if (typeof this.config.disabled === "function") {
      button.disabled = this.config.disabled(this.editor)
    } else if (this.config.disabled) {
      button.disabled = true
    }

    return button
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
