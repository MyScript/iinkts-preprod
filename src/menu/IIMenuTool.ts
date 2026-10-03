import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/dom"

import { IIAbstractMenu } from "./IIAbstractMenu"
import { EdgeTool, EraseTool, MoveTool, SelectTool, ShapeTool, WriteTool } from "./tools"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each tool individually
 */
export type TMenuToolConfig = {
  /** Enable/disable Write tool (Pencil) */
  write?: boolean
  /** Enable/disable Move tool (Hand) */
  move?: boolean
  /** Enable/disable Select tool (Cursor) */
  select?: boolean
  /** Enable/disable Erase tool */
  erase?: boolean
  /** Enable/disable Shape submenu (Rectangle, Circle, etc.) */
  shape?: boolean
  /** Enable/disable Edge submenu (Line, Arrow, etc.) */
  edge?: boolean
}

/** @group Menu */
export const DefaultMenuToolConfig: Required<TMenuToolConfig> = {
  write: true,
  move: true,
  select: true,
  erase: true,
  shape: true,
  edge: true,
}

/**
 * @group Menu
 */
export class IIMenuTool extends IIAbstractMenu<Required<TMenuToolConfig>> {
  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-tool", config?: TMenuToolConfig) {
    super(canvas, id, { ...DefaultMenuToolConfig, ...config })
  }

  render(layer: HTMLElement): void {
    if (!this.canvas.configuration.menu.tool.enable) {
      return
    }
    this.logger.info("Rendering menu tools with config", this.config)
    const wrapper = DOMFactory.div({ className: ["ms-menu", "ms-menu-bottom", "ms-menu-row"] })
    this.wrapper = wrapper

    if (this.config.write) {
      this.addItem("write", new WriteTool(this.canvas, this.id), wrapper)
    }
    if (this.config.move) {
      this.addItem("move", new MoveTool(this.canvas, this.id), wrapper)
    }
    if (this.config.select) {
      this.addItem("select", new SelectTool(this.canvas, this.id), wrapper)
    }
    if (this.config.erase) {
      this.addItem("erase", new EraseTool(this.canvas, this.id), wrapper)
    }
    if (this.config.edge) {
      this.addItem("edge", new EdgeTool(this.canvas, this.id), wrapper)
    }
    if (this.config.shape) {
      this.addItem("shape", new ShapeTool(this.canvas, this.id), wrapper)
    }

    layer.appendChild(wrapper)
    this.update()
    this.show()
  }
}
