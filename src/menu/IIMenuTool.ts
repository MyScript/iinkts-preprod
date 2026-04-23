import { LoggerCategory, LoggerManager } from "../logger"
import { InteractiveInkEditor } from "../editor"
import { BaseMenuItem } from "./items"
import {
  WriteTool,
  MoveTool,
  SelectTool,
  EraseTool,
  ShapeTool,
  EdgeTool
} from "./tools"
import { IIMenuToolConfig, defaultMenuToolConfig } from "./IIMenuToolConfig"

/**
 * @group Menu
 */
export class IIMenuTool
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLDivElement
  config: Required<IIMenuToolConfig>

  // Instances des classes d'outils
  private menuTools: Map<string, BaseMenuItem> = new Map()

  constructor(editor: InteractiveInkEditor, id = "ms-menu-tool", config?: IIMenuToolConfig)
  {
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
    this.config = { ...defaultMenuToolConfig, ...config }
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.tool.enable) {
      this.#logger.info("Rendering menu tools with config", this.config)

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-bottom", "ms-menu-row")

      // Ajouter les outils conditionnellement
      if (this.config.write) {
        const writeTool = new WriteTool(this.editor, this.id)
        this.menuTools.set("write", writeTool)
        this.wrapper.appendChild(writeTool.getElement())
      }

      if (this.config.move) {
        const moveTool = new MoveTool(this.editor, this.id)
        this.menuTools.set("move", moveTool)
        this.wrapper.appendChild(moveTool.getElement())
      }

      if (this.config.select) {
        const selectTool = new SelectTool(this.editor, this.id)
        this.menuTools.set("select", selectTool)
        this.wrapper.appendChild(selectTool.getElement())
      }

      if (this.config.erase) {
        const eraseTool = new EraseTool(this.editor, this.id)
        this.menuTools.set("erase", eraseTool)
        this.wrapper.appendChild(eraseTool.getElement())
      }

      if (this.config.edge) {
        const edgeTool = new EdgeTool(this.editor, this.id)
        this.menuTools.set("edge", edgeTool)
        this.wrapper.appendChild(edgeTool.getElement())
      }

      if (this.config.shape) {
        const shapeTool = new ShapeTool(this.editor, this.id)
        this.menuTools.set("shape", shapeTool)
        this.wrapper.appendChild(shapeTool.getElement())
      }

      layer.appendChild(this.wrapper)
      this.update()
      this.show()
    }
  }

  update(): void
  {
    this.menuTools.forEach(tool => {
      tool.update()
    })
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
      this.menuTools.forEach(tool => {
        tool.destroy()
      })
      this.menuTools.clear()

      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
    }
  }
}
