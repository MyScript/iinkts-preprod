import { InteractiveInkEditor } from "@/editor"
import { Minimap } from "@/components"
import { ButtonMenuItem, IMenuButton } from "@/menu/items/ButtonMenuItem"
import minimapIcon from "@/assets/svg/minimap.svg"

/**
 * @group Menu
 * @remarks Menu action to toggle the minimap overlay
 */
export class MinimapMenuAction extends ButtonMenuItem
{
  #minimap: Minimap
  #visible = false

  constructor(editor: InteractiveInkEditor, layer: HTMLElement, idPrefix = "ms-menu-action")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-minimap`,
      label: "Minimap",
      icon: minimapIcon,
      action: () => this.#toggle(),
    }
    super(config, editor)
    this.#minimap = new Minimap(editor, { width: 240, height: 160 })
    this.#initInLayer(layer)
  }

  #initInLayer(layer: HTMLElement): void
  {
    this.#minimap.getElement().classList.add("ms-menu-minimap")
    this.#minimap.attach(layer)
    this.#minimap.getElement().style.display = "none"
  }

  #toggle(): void
  {
    this.#visible = !this.#visible
    this.#minimap.getElement().style.display = this.#visible ? "block" : "none"
    this.getElement().classList.toggle("active", this.#visible)
  }

  update(): void
  {
    super.update()
    this.getElement().classList.toggle("active", this.#visible)
  }

  destroy(): void
  {
    this.#minimap.destroy()
    super.destroy()
  }
}
