import styleIcon from "../assets/svg/palette.svg"
import { EditorTool, EditorWriteTool } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { SymbolType, TIISymbol } from "../symbol"
import { InteractiveInkEditor } from "../editor"
import { IIMenuStyleConfig, defaultMenuStyleConfig } from "./IIMenuStyleConfig"
import { BaseMenuItem } from "./items"
import {
  StrokeColorStyle,
  FillColorStyle,
  ThicknessStyle,
  FontSizeStyle,
  FontWeightStyle,
  OpacityStyle
} from "./styles"

/**
 * @group Menu
 */
export class IIMenuStyle
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLDivElement
  config: Required<IIMenuStyleConfig>
  triggerBtn?: HTMLButtonElement
  subMenuWrapper?: HTMLDivElement
  subMenuContent?: HTMLDivElement

  // Style items
  private styleItems: Map<string, BaseMenuItem> = new Map()

  constructor(editor: InteractiveInkEditor, id = "ms-menu-style", config?: IIMenuStyleConfig)
  {
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
    this.config = { ...defaultMenuStyleConfig }
    if (config) {
      if (config.colors) {
        this.config.colors = config.colors
      }
      if (config.thicknessList) {
        this.config.thicknessList = config.thicknessList
      }
      if (config.fontSizeList) {
        this.config.fontSizeList = config.fontSizeList
      }
      if (config.fontWeightList) {
        this.config.fontWeightList = config.fontWeightList
      }
      this.config.strokeColor = config.strokeColor ?? this.config.strokeColor
      this.config.fillColor = config.fillColor ?? this.config.fillColor
      this.config.thickness = config.thickness ?? this.config.thickness
      this.config.fontSize = config.fontSize ?? this.config.fontSize
      this.config.fontWeight = config.fontWeight ?? this.config.fontWeight
      this.config.opacity = config.opacity ?? this.config.opacity
    }
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get symbolsSelected(): TIISymbol[]
  {
    return this.model.symbolsSelected
  }

  get writeShape(): boolean
  {
    return ![EditorWriteTool.Arrow, EditorWriteTool.DoubleArrow, EditorWriteTool.Line, EditorWriteTool.Pencil].includes(this.editor.writer.tool)
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get isMobile(): boolean
  {
    return this.editor.renderer.parent.clientWidth < 700
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.style.enable) {
      this.#logger.info("Rendering menu styles with config", this.config)

      this.triggerBtn = document.createElement("button")
      this.triggerBtn.id = this.id
      this.triggerBtn.classList.add("ms-menu-button", "square")
      this.triggerBtn.innerHTML = styleIcon

      const subMenuContent = document.createElement("div")
      subMenuContent.classList.add("ms-menu-colmun")

      // Add style elements conditionally using new style classes
      if (this.config.strokeColor) {
        const strokeColorStyle = new StrokeColorStyle(this.editor, this.config.colors, this.id)
        this.styleItems.set("strokeColor", strokeColorStyle)
        subMenuContent.appendChild(strokeColorStyle.getElement())
      }

      if (this.config.fillColor) {
        const fillColorStyle = new FillColorStyle(this.editor, this.config.colors, this.id)
        this.styleItems.set("fillColor", fillColorStyle)
        subMenuContent.appendChild(fillColorStyle.getElement())
      }

      if (this.config.thickness) {
        const thicknessStyle = new ThicknessStyle(this.editor, this.config.thicknessList, this.id)
        this.styleItems.set("thickness", thicknessStyle)
        subMenuContent.appendChild(thicknessStyle.getElement())
      }

      if (this.config.fontSize) {
        const fontSizeStyle = new FontSizeStyle(this.editor, this.config.fontSizeList, this.rowHeight, this.id)
        this.styleItems.set("fontSize", fontSizeStyle)
        subMenuContent.appendChild(fontSizeStyle.getElement())
      }

      if (this.config.fontWeight) {
        const fontWeightStyle = new FontWeightStyle(this.editor, this.config.fontWeightList, this.id)
        this.styleItems.set("fontWeight", fontWeightStyle)
        subMenuContent.appendChild(fontWeightStyle.getElement())
      }

      if (this.config.opacity) {
        const opacityStyle = new OpacityStyle(this.editor, this.id)
        this.styleItems.set("opacity", opacityStyle)
        subMenuContent.appendChild(opacityStyle.getElement())
      }

      this.subMenuWrapper = document.createElement("div")
      this.subMenuWrapper.classList.add("sub-menu")
      this.subMenuWrapper.appendChild(this.triggerBtn)

      this.subMenuContent = document.createElement("div")
      this.subMenuContent.classList.add("sub-menu-content", "bottom-left")
      this.subMenuContent.appendChild(subMenuContent)
      this.subMenuWrapper.appendChild(this.subMenuContent)

      // Event listeners
      this.triggerBtn.addEventListener("pointerdown", () => this.subMenuContent?.classList.toggle("open"))
      document.addEventListener("pointerdown", (e) => {
        if (this.subMenuWrapper && !this.subMenuWrapper.contains(e.target as HTMLElement)) {
          this.subMenuContent?.classList.remove("open")
        }
      })

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-right")
      this.wrapper.appendChild(this.subMenuWrapper)
      layer.appendChild(this.wrapper)
      this.update()
    }
  }

  update(): void
  {
    if (this.subMenuContent && this.subMenuWrapper) {
      if (this.isMobile) {
        // wrap
        this.subMenuContent.classList.add("sub-menu-content")
        this.subMenuWrapper.appendChild(this.subMenuContent)
        this.subMenuWrapper.style.display = "block"
      } else {
        // unwrap
        this.subMenuContent.classList.remove("sub-menu-content")
        this.subMenuWrapper.insertAdjacentElement("beforebegin", this.subMenuContent)
        this.subMenuWrapper.style.display = "none"
      }
    }

    if (this.editor.tool === EditorTool.Write) {
      this.show()
      // Show all style items for write mode
      const strokeColorEl = this.styleItems.get("strokeColor")?.getElement()
      const fillColorEl = this.styleItems.get("fillColor")?.getElement()
      const thicknessEl = this.styleItems.get("thickness")?.getElement()
      const fontSizeEl = this.styleItems.get("fontSize")?.getElement()
      const fontWeightEl = this.styleItems.get("fontWeight")?.getElement()
      const opacityEl = this.styleItems.get("opacity")?.getElement()

      if (strokeColorEl) strokeColorEl.style.display = "block"
      if (fillColorEl) fillColorEl.style.display = this.writeShape ? "block" : "none"
      if (thicknessEl) thicknessEl.style.display = "block"
      if (fontSizeEl) fontSizeEl.style.display = "block"
      if (fontWeightEl) fontWeightEl.style.display = "block"
      if (opacityEl) opacityEl.style.display = "block"
    }
    else if (this.editor.tool === EditorTool.Select) {
      this.show()
      const shapeSelected = this.model.symbolsSelected.length && this.model.symbolsSelected.some(s => s.type === SymbolType.Shape)

      const strokeColorEl = this.styleItems.get("strokeColor")?.getElement()
      const fillColorEl = this.styleItems.get("fillColor")?.getElement()
      const thicknessEl = this.styleItems.get("thickness")?.getElement()
      const fontSizeEl = this.styleItems.get("fontSize")?.getElement()
      const fontWeightEl = this.styleItems.get("fontWeight")?.getElement()
      const opacityEl = this.styleItems.get("opacity")?.getElement()

      if (strokeColorEl) strokeColorEl.style.display = "block"
      if (fillColorEl) fillColorEl.style.display = shapeSelected ? "block" : "none"
      if (thicknessEl) thicknessEl.style.display = "block"
      if (fontSizeEl) fontSizeEl.style.display = "block"
      if (fontWeightEl) fontWeightEl.style.display = "block"
      if (opacityEl) opacityEl.style.display = "block"
    }
    else {
      this.hide()
    }
  }

  show(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "visible"
    }
  }

  hide(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "hidden"
    }
  }

  destroy(): void
  {
    if (this.wrapper) {
      // Destroy all style items
      this.styleItems.forEach((item) => item.destroy())
      this.styleItems.clear()

      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
      this.subMenuWrapper = undefined
      this.subMenuContent = undefined
      this.triggerBtn = undefined
    }
  }
}
