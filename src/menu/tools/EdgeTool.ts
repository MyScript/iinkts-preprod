import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, IMenuItemBase } from "@/menu/items/BaseMenuItem"
import { EditorTool, EditorWriteTool } from "@/Constants"
import lineIcon from "@/assets/svg/linear.svg"
import arrowIcon from "@/assets/svg/linear-arrow.svg"
import doubleArrowIcon from "@/assets/svg/linear-double-arrow.svg"

interface IEdgeToolConfig extends IMenuItemBase {
  type: "edge"
}

/**
 * @group Menu
 * @remarks Edge tool - Sub-menu for lines and arrows
 */
export class EdgeTool extends BaseMenuItem<HTMLDivElement>
{
  private subMenuButtons: Map<EditorWriteTool, HTMLButtonElement> = new Map()
  private triggerButton?: HTMLButtonElement
  private currentIcon: string = lineIcon

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: IEdgeToolConfig = {
      type: "edge",
      id: `${idPrefix}-write-edge`,
      label: "Edge"
    }
    super(config, editor)
  }

  private createEdgeButton(icon: string, tool: EditorWriteTool, label: string): HTMLButtonElement
  {
    const button = document.createElement("button")
    button.id = `${this.config.id}-${tool}`
    button.classList.add("ms-menu-button", "square")
    button.innerHTML = icon
    button.title = label

    button.addEventListener("click", () => {
      this.unselectAll()
      this.editor.tool = EditorTool.Write
      this.editor.writer.tool = tool
      this.currentIcon = icon

      if (this.triggerButton) {
        this.triggerButton.innerHTML = icon
        this.triggerButton.classList.add("active")
      }
      button.classList.add("active")

      const subMenuContent = this.element?.querySelector(".sub-menu-content-edge")
      subMenuContent?.classList.remove("open")
    })

    this.subMenuButtons.set(tool, button)
    return button
  }

  createElement(): HTMLDivElement
  {
    this.triggerButton = document.createElement("button")
    this.triggerButton.id = this.config.id
    this.triggerButton.classList.add("ms-menu-button", "square")
    this.triggerButton.innerHTML = this.currentIcon

    const subMenuContent = document.createElement("div")
    subMenuContent.id = `${this.config.id}-list`
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-edge")

    subMenuContent.appendChild(this.createEdgeButton(lineIcon, EditorWriteTool.Line, "Line"))
    subMenuContent.appendChild(this.createEdgeButton(arrowIcon, EditorWriteTool.Arrow, "Arrow"))
    subMenuContent.appendChild(this.createEdgeButton(doubleArrowIcon, EditorWriteTool.DoubleArrow, "Double Arrow"))

    const wrapper = document.createElement("div")
    wrapper.classList.add("sub-menu")
    wrapper.appendChild(this.triggerButton)

    const content = document.createElement("div")
    content.classList.add("sub-menu-content", "top")
    content.appendChild(subMenuContent)
    wrapper.appendChild(content)

    // Event listeners
    this.triggerButton.addEventListener("pointerdown", () => content.classList.toggle("open"))
    document.addEventListener("pointerdown", (e) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    })

    return wrapper
  }

  update(): void
  {
    if (!this.element || !this.triggerButton) return

    const isEdgeTool = this.editor.tool === EditorTool.Write && [
      EditorWriteTool.Line,
      EditorWriteTool.Arrow,
      EditorWriteTool.DoubleArrow
    ].includes(this.editor.writer.tool)

    if (isEdgeTool) {
      this.triggerButton.classList.add("active")
      const activeButton = this.subMenuButtons.get(this.editor.writer.tool)
      activeButton?.classList.add("active")
    } else {
      this.triggerButton.classList.remove("active")
      this.subMenuButtons.forEach(btn => btn.classList.remove("active"))
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
