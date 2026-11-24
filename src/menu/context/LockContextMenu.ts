import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items"
import { ButtonMenuItem } from "../items"

/**
 * @group Menu
 * @remarks Context menu Lock / Unlock: locks the selection while any of it is unlocked, unlocks it
 * once all of it is locked. Hide it with `menu.context.lock: false` to keep locking to the API.
 */
export class LockContextMenu extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-lock`,
      label: LockContextMenu.#labelFor(canvas),
      action: async (canvas: TInteractiveInkCanvas) => {
        const selected = canvas.model.symbolsSelected
        const ids = selected.map((s) => s.id)
        if (selected.some((s) => !s.locked)) {
          await canvas.lockSymbols(ids)
        } else {
          await canvas.unlockSymbols(ids)
        }
        canvas.selector.drawSelectedGroup(canvas.model.symbolsSelected)
      },
    }
    super(config, canvas)
  }

  static #labelFor(canvas: TInteractiveInkCanvas): string {
    const selected = canvas.model.symbolsSelected
    return selected.length && selected.every((s) => s.locked)
      ? canvas.i18n.t("menu.context.unlock")
      : canvas.i18n.t("menu.context.lock")
  }

  update(): void {
    super.update()
    this.getElement().textContent = LockContextMenu.#labelFor(this.canvas)
  }
}
