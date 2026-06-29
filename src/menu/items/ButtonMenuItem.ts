import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a simple button
 */
export type TMenuButton = TMenuItemBase & {
  type: "button"
  icon?: string
  action: (editor: TInteractiveInkEditor) => void | Promise<void>
}

/**
 * @group Menu
 * @remarks Class for buttons
 */
export class ButtonMenuItem extends BaseMenuItem<HTMLButtonElement> {
  declare protected config: TMenuButton

  createElement(): HTMLButtonElement {
    const button = this.dom.button({
      id: this.config.id,
      className: "ms-menu-item",
    })

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
