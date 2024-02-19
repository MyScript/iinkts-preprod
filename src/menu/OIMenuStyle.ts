import styleIcon from "../assets/svg/palette.svg"
import { Intention, LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { SymbolType, TOISymbol } from "../primitive"
import { OIMenu, TMenuItemColorList } from "./OIMenu"
import { WriteTool } from "../manager"
import { OIMenuSub } from "./OIMenuSub"

/**
 * Menu
 */
export class OIMenuStyle extends OIMenu
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)

  behaviors: OIBehaviors
  id: string
  wrapper?: HTMLDivElement
  subMenu?: OIMenuSub
  triggerBtn?: HTMLButtonElement
  menuColorStroke?: HTMLDivElement
  menuColorFill?: HTMLDivElement
  menuThickness?: HTMLDivElement
  menuStrokeOpacity?: HTMLDivElement

  constructor(behaviors: OIBehaviors, id = "ms-menu-style")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get symbolsSelected(): TOISymbol[]
  {
    return this.model.symbolsSelected
  }

  get writeShape(): boolean
  {
    return ![WriteTool.Arrow, WriteTool.DoubleArrow, WriteTool.Line, WriteTool.Pencil].includes(this.behaviors.writer.tool)
  }

  get isMobile(): boolean
  {
    return this.behaviors.renderer.parent.clientWidth < 700
  }

  protected createMenuStroke(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : (this.behaviors.currentPenStyle.color || "rgb(0, 0, 0)") as string
    const menuColorStrokeDef: TMenuItemColorList = {
      type: "colors",
      label: "Colors",
      id: `${ this.id }-color`,
      fill: false,
      values: this.colors,
      initValue: color,
      callback: (color) => {
        this.behaviors.setPenStyle({ color })
        this.behaviors.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { color })
      },
    }
    const menuColor = this.createColorList(menuColorStrokeDef)
    this.menuColorStroke = this.createWrapCollapsible(menuColor, "Colors")
    this.menuColorStroke.id = `${ this.id }-color`
    return this.menuColorStroke
  }

  protected createMenuColorFill(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : (this.behaviors.currentPenStyle.color || "rgb(0, 0, 0)") as string
    const menuColorStrokeDef: TMenuItemColorList = {
      type: "colors",
      label: "Fill",
      id: `${ this.id }-fill`,
      fill: true,
      values: this.colors,
      initValue: color,
      callback: (fill) => {
        this.behaviors.setPenStyle({ fill })
        this.behaviors.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { fill })
      },
    }
    const menuColor = this.createColorList(menuColorStrokeDef)
    this.menuColorFill = this.createWrapCollapsible(menuColor, "Fill")
    this.menuColorFill.id = `${ this.id }-fill`
    return this.menuColorFill
  }


  protected createMenuThickness(): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-thickness-list`
    wrapper.classList.add("ms-menu-row")

    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqWidth = symbolsStyles.length && symbolsStyles.every(st => st.width === symbolsStyles[0]?.width)
    const width = hasUniqWidth ? symbolsStyles[0]?.width : (this.behaviors.currentPenStyle.width || 4)

    this.sizes.forEach((size) =>
    {
      const btn = document.createElement("button")
      btn.id = `${ this.id }-thickness-${ size.label }-btn`
      btn.classList.add("ms-menu-button", "square")
      btn.textContent = size.label
      if (width === size.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        this.behaviors.setPenStyle({ width: size.value })
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        if (this.symbolsSelected.length) {
          this.behaviors.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { width: size.value })
        }
      })
      wrapper.appendChild(btn)
    })
    this.menuThickness = this.createWrapCollapsible(wrapper, "Thickness")
    this.menuThickness.id = `${ this.id }-thickness`
    return this.menuThickness
  }

  protected createMenuOpacity(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqOpacity = symbolsStyles.length && symbolsStyles.every(st => st.opacity === symbolsStyles[0]?.opacity)
    const currentOpacity = (hasUniqOpacity && symbolsStyles[0]?.opacity ? symbolsStyles[0]?.opacity : (this.behaviors.currentPenStyle.opacity || 1)) * 100 as number

    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-opacity-input-wrapper`
    const input = document.createElement("input")
    input.id = `${ this.id }-opacity-input`
    input.setAttribute("name", `opacity`)
    input.setAttribute("type", "range")
    input.setAttribute("step", "1")
    input.setAttribute("min", "1")
    input.setAttribute("max", "100")
    wrapper.appendChild(input)

    const output = document.createElement("output")
    output.setAttribute("for", `opacity`)
    output.classList.add("tooltip")
    output.innerHTML = currentOpacity ? `${ currentOpacity }` : "-"
    wrapper.appendChild(output)

    if (currentOpacity) {
      input.setAttribute("value", currentOpacity.toString())
    }
    input.addEventListener("input", (evt) =>
    {
      const value = (evt.target as HTMLInputElement).value as unknown as number
      output.innerHTML = `${ value }%`
      this.behaviors.setPenStyle({ opacity: value / 100 })
      if (this.symbolsSelected.length) {
        this.behaviors.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { opacity: value / 100 })
      }
    })
    this.menuStrokeOpacity = this.createWrapCollapsible(wrapper, "Opacity")
    this.menuStrokeOpacity.id = `${ this.id }-opacity`
    return this.menuStrokeOpacity
  }

  render(layer: HTMLElement): void
  {
    if (this.behaviors.configuration.menu.style.enable) {
      this.triggerBtn = document.createElement("button")
      this.triggerBtn.id = this.id
      this.triggerBtn.classList.add("ms-menu-button", "square")
      this.triggerBtn.innerHTML = styleIcon

      const subMenuContent = document.createElement("div")
      subMenuContent.classList.add("ms-menu-colmun")
      subMenuContent.appendChild(this.createMenuStroke())
      subMenuContent.appendChild(this.createMenuColorFill())
      subMenuContent.appendChild(this.createMenuThickness())
      subMenuContent.appendChild(this.createMenuOpacity())
      this.subMenu = this.createSubMenu(this.createToolTip(this.triggerBtn, "Style", "left"), subMenuContent, "bottom-left")

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-right")
      this.wrapper.appendChild(this.subMenu.element)
      layer.appendChild(this.wrapper)
      this.update()
    }
  }

  update(): void
  {
    if (this.subMenu) {
      this.isMobile ? this.subMenu.wrap() : this.subMenu.unwrap()
    }

    if (this.behaviors.intention === Intention.Write) {
      this.show()
      if (this.menuColorStroke) {
        this.menuColorStroke.style.display = "block"
      }
      if (this.menuColorFill) {
        this.menuColorFill.style.display = this.writeShape ? "block" : "none"
      }
      if (this.menuThickness) {
        this.menuThickness.style.display = "block"
      }
      if (this.menuStrokeOpacity) {
        this.menuStrokeOpacity.style.display = "block"
      }
    }
    else if (this.behaviors.intention === Intention.Select) {
      this.show()
      if (this.menuColorStroke) {
        this.menuColorStroke.style.display = "block"
      }
      if (this.menuColorFill) {
        const shapeSelected = this.model.symbolsSelected.length && this.model.symbolsSelected.some(s => s.type === SymbolType.Shape)
        this.menuColorFill.style.display = shapeSelected ? "block" : "none"
      }
      if (this.menuThickness) {
        this.menuThickness.style.display = "block"
      }
      if (this.menuStrokeOpacity) {
        this.menuStrokeOpacity.style.display = "block"
      }
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
      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
      this.subMenu = undefined
      this.triggerBtn = undefined
      this.menuColorStroke = undefined
      this.menuColorFill = undefined
      this.menuThickness = undefined
      this.menuStrokeOpacity = undefined
    }
  }
}
