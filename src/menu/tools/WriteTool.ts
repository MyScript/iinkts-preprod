import pencilIcon from "@/assets/svg/edit-pencil.svg"
import { EditorTool, EditorWriteTool } from "@/Constants"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
export class WriteTool extends ButtonMenuItem {
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-tool") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-write-pencil`,
      label: "Write",
      icon: pencilIcon,
      action: (editor: TInteractiveInkEditor) => {
        editor.tool = EditorTool.Write
        editor.writer.tool = EditorWriteTool.Pencil
      },
    }
    super(config, editor)
  }

  createElement(): HTMLButtonElement {
    const button = this.dom.button({
      id: this.config.id,
      html: this.config.icon || "",
      className: "square",
    })
    button.addEventListener("click", () => {
      this.unselectAll()
      button.classList.add("active")
      this.config.action(this.editor)
    })
    return button
  }

  update(): void {
    if (!this.element) {
      return
    }

    const isActive = this.editor.tool === EditorTool.Write && this.editor.writer.tool === EditorWriteTool.Pencil

    if (isActive) {
      this.element.classList.add("active")
    } else {
      this.element.classList.remove("active")
    }

    this.updateDisabled()
    this.updateVisible()
  }

  private unselectAll(): void {
    const menu = this.element?.closest(".ms-menu")
    menu?.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
  }
}
