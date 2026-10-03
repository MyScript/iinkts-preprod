import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { mergeDeep } from "@/core/std"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { TMenuActionConfig } from "./IIMenuAction"
import { IIMenuAction } from "./IIMenuAction"
import type { TMenuContextConfig } from "./IIMenuContext"
import { IIMenuContext } from "./IIMenuContext"
import type { TMenuStyleConfig } from "./IIMenuStyle"
import { IIMenuStyle } from "./IIMenuStyle"
import type { TMenuToolConfig } from "./IIMenuTool"
import { IIMenuTool } from "./IIMenuTool"
import style from "./menu.css"

/**
 * @group Menu
 * @remarks Partial config accepted by {@link IIMenuManager.setConfig} after initial load.
 */
export type TMenuConfigUpdate = {
  enable?: boolean
  style?: TMenuStyleConfig & { enable?: boolean }
  tool?: TMenuToolConfig & { enable?: boolean }
  action?: TMenuActionConfig & {
    enable?: boolean
  }
  context?: TMenuContextConfig & {
    enable?: boolean
  }
}

/**
 * @group Menu
 * @summary Menu classes `options.override.menu` can replace
 * @remarks Each one is constructed like the built-in menu it replaces: `(canvas, id, config)`, at load and on every {@link IIMenuManager.setConfig}.
 */
export type TMenuOverride = {
  style?: typeof IIMenuStyle
  tool?: typeof IIMenuTool
  action?: typeof IIMenuAction
  context?: typeof IIMenuContext
}

/**
 * @group Manager
 */
export class IIMenuManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  layer?: HTMLElement
  // Assigned by createMenus(), from the constructor
  action!: IIMenuAction
  tool!: IIMenuTool
  context!: IIMenuContext
  style!: IIMenuStyle

  /** The classes the menus are built from: the overrides, else the built-in ones */
  protected menuClasses: Required<TMenuOverride>

  constructor(canvas: TInteractiveInkCanvas, custom?: TMenuOverride) {
    this.#logger.info("constructor")
    this.canvas = canvas
    this.menuClasses = {
      style: custom?.style ?? IIMenuStyle,
      tool: custom?.tool ?? IIMenuTool,
      action: custom?.action ?? IIMenuAction,
      context: custom?.context ?? IIMenuContext,
    }
    this.createMenus()
  }

  /** Builds the four menus from {@link menuClasses} and the current configuration; renders nothing */
  protected createMenus(): void {
    const { menu } = this.canvas.configuration
    this.style = new this.menuClasses.style(this.canvas, "ms-menu-style", menu.style)
    this.tool = new this.menuClasses.tool(this.canvas, "ms-menu-tool", menu.tool)
    this.action = new this.menuClasses.action(this.canvas, "ms-menu-action", menu.action)
    this.context = new this.menuClasses.context(this.canvas, "ms-menu-context", menu.context)
  }

  render(layer: HTMLElement): void {
    if (this.canvas.configuration.menu.enable) {
      this.layer = layer

      const styleElement = DOMFactory.style(style as string, { "ms-menu-style": "" })
      this.layer.prepend(styleElement)

      if (this.canvas.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.canvas.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.canvas.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.canvas.configuration.menu.context.enable) {
        this.context.render(this.layer)
      }
    }
  }

  /**
   * Update menu configuration at runtime and re-render affected sections.
   * Merges deeply into the current config — omitted keys keep their current value.
   * @example
   * // Hide only PNG and text export
   * canvas.menu.setConfig({ action: { export: { png: false, text: false } } })
   * // Disable the entire action menu
   * canvas.menu.setConfig({ action: { enable: false } })
   */
  setConfig(config: TMenuConfigUpdate): void {
    mergeDeep(this.canvas.configuration.menu, config)

    if (!this.layer) {
      return
    }

    const contextPosition = {
      ...this.context.position,
    }
    const contextVisible = this.context.wrapper?.style.display !== "none"

    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()

    this.createMenus()

    if (this.canvas.configuration.menu.enable) {
      if (this.canvas.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.canvas.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.canvas.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.canvas.configuration.menu.context.enable) {
        this.context.render(this.layer)
        this.context.position = contextPosition
        if (contextVisible) {
          this.context.show()
        }
      }
    }
  }

  update(): void {
    this.action.update()
    this.tool.update()
    this.style.update()
  }

  show(): void {
    this.action.show()
    this.tool.show()
    this.style.show()
  }

  hide(): void {
    this.action.hide()
    this.tool.hide()
    this.style.hide()
  }

  destroy(): void {
    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()
  }
}
