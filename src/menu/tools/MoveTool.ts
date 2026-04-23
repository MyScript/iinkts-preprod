import { InteractiveInkEditor } from "../../editor"
import { ButtonMenuItem, IMenuButton } from "../items/ButtonMenuItem"
import { EditorTool } from "../../Constants"
import handIcon from "../../assets/svg/drag-hand-gesture.svg"

/**
 * @group Menu
 * @remarks Move tool - View movement
 */
export class MoveTool extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-move`,
      label: "Move",
      icon: handIcon,
      action: (editor: InteractiveInkEditor) => {
        editor.tool = EditorTool.Move
      }
    }
    super(config, editor)
  }

  createElement(): HTMLButtonElement
  {
    const button = document.createElement("button")
    button.id = this.config.id
    button.classList.add("ms-menu-button", "square")
    button.innerHTML = this.config.icon || ""
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
