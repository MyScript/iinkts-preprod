import styleIcon from "@/assets/svg/palette.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import { DOMFactory } from "@/dom"
import type { IIModel } from "@/model"
import type { TSymbol } from "@/symbol"

import { IIAbstractMenu } from "./IIAbstractMenu"
import {
  DEFAULT_FONT_SIZE_LIST,
  DEFAULT_FONT_WEIGHT_LIST,
  DEFAULT_MENU_COLORS,
  DEFAULT_THICKNESS_LIST,
} from "./MenuConstants"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each style element individually
 */
export type TMenuStyleConfig = {
  /** Enable/disable stroke color picker */
  strokeColor?: boolean
  /** Enable/disable fill color picker */
  fillColor?: boolean
  /** Enable/disable stroke thickness picker */
  thickness?: boolean
  /** Enable/disable nib picker */
  pen?: boolean
  /** Enable/disable font size picker */
  fontSize?: boolean
  /** Enable/disable font weight picker */
  fontWeight?: boolean
  /** Enable/disable opacity picker */
  opacity?: boolean
  /** Custom color palette */
  colors?: string[]
  /** Custom thickness list */
  thicknessList?: {
    label: string
    value: number
  }[]
  /** Custom font size list */
  fontSizeList?: {
    label: string
    value: "auto" | number
  }[]
  /** Custom font weight list */
  fontWeightList?: {
    label: string
    value: "auto" | "normal" | "bold"
  }[]
}

/** @group Menu */
export const DefaultMenuStyleConfig: Required<TMenuStyleConfig> = {
  strokeColor: true,
  fillColor: true,
  thickness: true,
  pen: true,
  fontSize: true,
  fontWeight: true,
  opacity: true,
  colors: DEFAULT_MENU_COLORS,
  thicknessList: DEFAULT_THICKNESS_LIST,
  fontSizeList: DEFAULT_FONT_SIZE_LIST,
  fontWeightList: DEFAULT_FONT_WEIGHT_LIST,
}
import {
  FillColorStyle,
  FontSizeStyle,
  FontWeightStyle,
  OpacityStyle,
  PenNibStyle,
  StrokeColorStyle,
  ThicknessStyle,
} from "./styles"

/**
 * @group Menu
 */
export class IIMenuStyle extends IIAbstractMenu<Required<TMenuStyleConfig>> {
  triggerBtn?: HTMLButtonElement
  subMenuWrapper?: HTMLDivElement
  subMenuContent?: HTMLDivElement

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-style", config?: TMenuStyleConfig) {
    super(canvas, id, buildMenuStyleConfig(config))
  }

  get model(): IIModel {
    return this.canvas.model
  }

  get symbolsSelected(): TSymbol[] {
    return this.model.symbolsSelected
  }

  get writeShape(): boolean {
    return ![CanvasWriteTool.Arrow, CanvasWriteTool.DoubleArrow, CanvasWriteTool.Line, CanvasWriteTool.Pencil].includes(
      this.canvas.writer.tool
    )
  }

  get rowHeight(): number {
    return this.canvas.configuration.rendering.guides.gap
  }

  get isMobile(): boolean {
    return this.canvas.renderer.parent.clientWidth < 700
  }

  render(layer: HTMLElement): void {
    if (!this.canvas.configuration.menu.style.enable) {
      return
    }
    this.logger.info("Rendering menu styles with config", this.config)
    const column = DOMFactory.div({ className: "ms-menu-column" })
    this.renderDropdownItems(column)

    this.triggerBtn = DOMFactory.button({ id: this.id, className: "square", html: styleIcon })
    const dropdown = this.createDropdown(this.triggerBtn, column, "bottom-left")
    this.subMenuWrapper = dropdown.element
    this.subMenuContent = dropdown.content

    const wrapper = DOMFactory.div({ className: ["ms-menu", "ms-menu-top-right"] })
    this.wrapper = wrapper
    wrapper.appendChild(dropdown.element)
    layer.appendChild(wrapper)
    this.update()
  }

  protected renderDropdownItems(column: HTMLElement): void {
    const { config } = this
    if (config.strokeColor) {
      this.addItem("strokeColor", new StrokeColorStyle(this.canvas, config.colors, this.id), column)
    }
    if (config.fillColor) {
      this.addItem("fillColor", new FillColorStyle(this.canvas, config.colors, this.id), column)
    }
    if (config.pen) {
      this.addItem("pen", new PenNibStyle(this.canvas, this.id), column)
    }
    if (config.thickness) {
      this.addItem("thickness", new ThicknessStyle(this.canvas, config.thicknessList, this.id), column)
    }
    if (config.fontSize) {
      this.addItem("fontSize", new FontSizeStyle(this.canvas, config.fontSizeList, this.rowHeight, this.id), column)
    }
    if (config.fontWeight) {
      this.addItem("fontWeight", new FontWeightStyle(this.canvas, config.fontWeightList, this.id), column)
    }
    if (config.opacity) {
      this.addItem("opacity", new OpacityStyle(this.canvas, this.id), column)
    }
  }

  update(): void {
    if (this.subMenuContent && this.subMenuWrapper) {
      if (this.isMobile) {
        // wrap — only if not already inside subMenuWrapper
        if (this.subMenuContent.parentElement !== this.subMenuWrapper) {
          this.subMenuContent.classList.add("sub-menu-content")
          this.subMenuWrapper.appendChild(this.subMenuContent)
          this.subMenuWrapper.style.display = "block"
        }
      } else {
        // unwrap — only if not already positioned before subMenuWrapper
        if (this.subMenuContent.nextElementSibling !== this.subMenuWrapper) {
          this.subMenuContent.classList.remove("sub-menu-content")
          this.subMenuWrapper.insertAdjacentElement("beforebegin", this.subMenuContent)
          this.subMenuWrapper.style.display = "none"
        }
      }
    }

    super.update()
    if ([CanvasTool.Write, CanvasTool.Select].includes(this.canvas.tool)) {
      this.show()
    } else {
      this.hide()
    }
  }

  destroy(): void {
    super.destroy()
    this.subMenuWrapper = undefined
    this.subMenuContent = undefined
    this.triggerBtn = undefined
  }
}

function buildMenuStyleConfig(config?: TMenuStyleConfig): Required<TMenuStyleConfig> {
  const built = { ...DefaultMenuStyleConfig }
  if (!config) {
    return built
  }
  if (config.colors) {
    built.colors = config.colors
  }
  if (config.thicknessList) {
    built.thicknessList = config.thicknessList
  }
  if (config.fontSizeList) {
    built.fontSizeList = config.fontSizeList
  }
  if (config.fontWeightList) {
    built.fontWeightList = config.fontWeightList
  }
  built.strokeColor = config.strokeColor ?? built.strokeColor
  built.fillColor = config.fillColor ?? built.fillColor
  built.thickness = config.thickness ?? built.thickness
  built.pen = config.pen ?? built.pen
  built.fontSize = config.fontSize ?? built.fontSize
  built.fontWeight = config.fontWeight ?? built.fontWeight
  built.opacity = config.opacity ?? built.opacity
  return built
}
