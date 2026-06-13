import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, IMenuItemBase } from "@/menu/items/BaseMenuItem"
import { EditorTool, EditorWriteTool } from "@/Constants"
import rectangleIcon from "@/assets/svg/rectangle.svg"
import circleIcon from "@/assets/svg/circle.svg"
import ellipseIcon from "@/assets/svg/ellipse.svg"
import triangleIcon from "@/assets/svg/triangle.svg"
import rhombusIcon from "@/assets/svg/rhombus.svg"

interface IShapeToolConfig extends IMenuItemBase {
  type: "shape"
}

/**
 * @group Menu
 * @remarks Shape tool - Sub-menu for geometric shapes
 */
export class ShapeTool extends BaseMenuItem<HTMLDivElement>
{
  #documentPointerdownHandler?: (e: PointerEvent) => void
  private subMenuButtons: Map<EditorWriteTool, HTMLButtonElement> = new Map()
  private triggerButton?: HTMLButtonElement
  private currentIcon: string = rectangleIcon

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-tool")
  {
    const config: IShapeToolConfig = {
      type: "shape",
      id: `${idPrefix}-write-shape`,
      label: "Shape"
    }
    super(config, editor)
  }

  private createShapeButton(icon: string, tool: EditorWriteTool, label: string): HTMLButtonElement
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

      const subMenuContent = this.element?.querySelector(".sub-menu-content-shape")
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
    subMenuContent.classList.add("ms-menu-row", "sub-menu-content-shape")

    subMenuContent.appendChild(this.createShapeButton(rectangleIcon, EditorWriteTool.Rectangle, "Rectangle"))
    subMenuContent.appendChild(this.createShapeButton(circleIcon, EditorWriteTool.Circle, "Circle"))
    subMenuContent.appendChild(this.createShapeButton(ellipseIcon, EditorWriteTool.Ellipse, "Ellipse"))
    subMenuContent.appendChild(this.createShapeButton(triangleIcon, EditorWriteTool.Triangle, "Triangle"))
    subMenuContent.appendChild(this.createShapeButton(rhombusIcon, EditorWriteTool.Rhombus, "Rhombus"))

    const wrapper = document.createElement("div")
    wrapper.classList.add("sub-menu")
    wrapper.appendChild(this.triggerButton)

    const content = document.createElement("div")
    content.classList.add("sub-menu-content", "top")
    content.appendChild(subMenuContent)
    wrapper.appendChild(content)

    // Event listeners
    this.triggerButton.addEventListener("pointerdown", () => content.classList.toggle("open"))
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return wrapper
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    super.destroy()
  }

  update(): void
  {
    if (!this.element || !this.triggerButton) return

    const isShapeTool = this.editor.tool === EditorTool.Write && [
      EditorWriteTool.Circle,
      EditorWriteTool.Ellipse,
      EditorWriteTool.Triangle,
      EditorWriteTool.Rectangle,
      EditorWriteTool.Rhombus
    ].includes(this.editor.writer.tool)

    if (isShapeTool) {
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
