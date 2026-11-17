import searchIcon from "@/assets/svg/search.svg"
import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action that opens or closes the search bar, for devices without Ctrl+F
 */
export class SearchMenuAction extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-search`,
      label: "Search",
      icon: searchIcon,
      action: (canvas) => this.toggle(canvas),
    }
    super(config, canvas)
  }

  protected toggle(canvas: TInteractiveInkCanvas): void {
    const { search } = canvas.menu
    if (search.isOpen) {
      search.close()
    } else {
      search.open()
    }
  }

  update(): void {
    super.update()
    this.getElement().classList.toggle("active", this.canvas.menu.search.isOpen)
  }
}
