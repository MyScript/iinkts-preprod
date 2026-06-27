import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem";
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"
import { EditorTool } from "@/Constants"
import handIcon from "@/assets/svg/drag-hand-gesture.svg"

/**
 * @group Menu
 * @remarks Move tool - View movement
 */
export class MoveTool extends ButtonMenuItem
{
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-move`,
      label: "Move",
      icon: handIcon,
      action: (editor: TInteractiveInkEditor) => {
        editor.tool = EditorTool.Move
      }
    }
    super(config, editor)
  }

  createElement(): HTMLButtonElement
  {
    const button = this.dom.button({ id: this.config.id, html: this.config.icon || "", className: "square" })
    button.addEventListener("click", () => {
      this.unselectAll()
      button.classList.add("active")
      this.config.action(this.editor)
    })
    return button
  }

  update(): void
  {
    if (!this.element) return

    const isActive = this.editor.tool === EditorTool.Move

    if (isActive) {
      this.element.classList.add("active")
    } else {
      this.element.classList.remove("active")
    }

    this.updateDisabled()
    this.updateVisible()
  }

  private unselectAll(): void
  {
    const menu = this.element?.closest(".ms-menu")
    menu?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
  }
}
