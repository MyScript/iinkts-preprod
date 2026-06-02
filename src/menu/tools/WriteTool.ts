import { InteractiveInkEditor } from "@/editor"
import { ButtonMenuItem, IMenuButton } from "@/menu/items/ButtonMenuItem"
import { EditorTool, EditorWriteTool } from "@/Constants"
import pencilIcon from "@/assets/svg/edit-pencil.svg"

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
export class WriteTool extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-write-pencil`,
      label: "Write",
      icon: pencilIcon,
      action: (editor: InteractiveInkEditor) => {
        editor.tool = EditorTool.Write
        editor.writer.tool = EditorWriteTool.Pencil
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

    const isActive = this.editor.tool === EditorTool.Write &&
                     this.editor.writer.tool === EditorWriteTool.Pencil

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
