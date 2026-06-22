import { InteractiveInkEditor } from "@/editor"
import { ButtonMenuItem, IMenuButton } from "@/menu/items/ButtonMenuItem"
import { EditorTool } from "@/Constants"
import eraseIcon from "@/assets/svg/erase.svg"

/**
 * @group Menu
 * @remarks Erase tool - Element erasure
 */
export class EraseTool extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-erase`,
      label: "Erase",
      icon: eraseIcon,
      action: (editor: InteractiveInkEditor) => {
        editor.tool = EditorTool.Erase
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

    const isActive = this.editor.tool === EditorTool.Erase

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
