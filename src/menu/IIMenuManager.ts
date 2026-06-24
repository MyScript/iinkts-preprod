import style from "./menu.css"
import { LoggerCategory, LoggerManager } from "@/logger"
import { InteractiveInkEditor } from "@/editor"
import { DOMFactory } from "@/components/dom"
import { mergeDeep } from "@/utils"
import { IIMenuAction } from "./IIMenuAction"
import { IIMenuTool } from "./IIMenuTool"
import { IIMenuContext } from "./IIMenuContext"
import { IIMenuStyle } from "./IIMenuStyle"
import type { IIMenuStyleConfig } from "./IIMenuStyle"
import type { IIMenuToolConfig } from "./IIMenuTool"
import type { IIMenuActionConfig } from "./IIMenuAction"
import type { IIMenuContextConfig } from "./IIMenuContext"

/**
 * @group Menu
 * @remarks Partial config accepted by {@link IIMenuManager.setConfig} after initial load.
 */
export type TMenuConfigUpdate = {
  enable?: boolean
  style?: IIMenuStyleConfig & { enable?: boolean }
  tool?: IIMenuToolConfig & { enable?: boolean }
  action?: IIMenuActionConfig & { enable?: boolean }
  context?: IIMenuContextConfig & { enable?: boolean }
}

/**
 * @group Manager
 */
export class IIMenuManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: InteractiveInkEditor
  layer?: HTMLElement
  action: IIMenuAction
  tool: IIMenuTool
  context: IIMenuContext
  style: IIMenuStyle

  constructor(editor: InteractiveInkEditor, custom?: { style?: IIMenuStyle, tool?: IIMenuTool, action?: IIMenuAction, context?: IIMenuContext })
  {
    this.#logger.info("constructor")
    this.editor = editor

    if (custom?.style) {
      const CustomMenuStyle = custom.style as unknown as typeof IIMenuStyle
      this.style = new CustomMenuStyle(this.editor)
    }
    else {
      this.style = new IIMenuStyle(this.editor, "ms-menu-style", this.editor.configuration.menu.style)
    }
    if (custom?.tool) {
      const CustomMenuTool = custom.tool as unknown as typeof IIMenuTool
      this.tool = new CustomMenuTool(this.editor)
    }
    else {
      this.tool = new IIMenuTool(this.editor, "ms-menu-tool", this.editor.configuration.menu.tool)
    }
    if (custom?.action) {
      const CustomMenuAction = custom.action as unknown as typeof IIMenuAction
      this.action = new CustomMenuAction(this.editor)
    }
    else {
      this.action = new IIMenuAction(this.editor, "ms-menu-action", this.editor.configuration.menu.action)
    }
    if (custom?.context) {
      const CustomMenuAction = custom.context as unknown as typeof IIMenuContext
      this.context = new CustomMenuAction(this.editor)
    }
    else {
      this.context = new IIMenuContext(this.editor, "ms-menu-context", this.editor.configuration.menu.context)
    }
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.enable) {
      this.layer = layer

      const styleElement = DOMFactory.style(style as string, { "ms-menu-style": "" })
      this.layer.prepend(styleElement)

      if (this.editor.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.editor.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.editor.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.editor.configuration.menu.context.enable) {
        this.context.render(this.layer)
      }
    }
  }

  /**
   * Update menu configuration at runtime and re-render affected sections.
   * Merges deeply into the current config — omitted keys keep their current value.
   * @example
   * // Hide only PNG and text export
   * editor.menu.setConfig({ action: { export: { png: false, text: false } } })
   * // Disable the entire action menu
   * editor.menu.setConfig({ action: { enable: false } })
   */
  setConfig(config: TMenuConfigUpdate): void
  {
    mergeDeep(this.editor.configuration.menu, config)

    if (!this.layer) return

    const contextPosition = { ...this.context.position }
    const contextVisible = this.context.wrapper?.style.display !== "none"

    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()

    this.action = new IIMenuAction(this.editor, "ms-menu-action", this.editor.configuration.menu.action)
    this.tool = new IIMenuTool(this.editor, "ms-menu-tool", this.editor.configuration.menu.tool)
    this.style = new IIMenuStyle(this.editor, "ms-menu-style", this.editor.configuration.menu.style)
    this.context = new IIMenuContext(this.editor, "ms-menu-context", this.editor.configuration.menu.context)

    if (this.editor.configuration.menu.enable) {
      if (this.editor.configuration.menu.action.enable) this.action.render(this.layer)
      if (this.editor.configuration.menu.style.enable) this.style.render(this.layer)
      if (this.editor.configuration.menu.tool.enable) this.tool.render(this.layer)
      if (this.editor.configuration.menu.context.enable) {
        this.context.render(this.layer)
        this.context.position = contextPosition
        if (contextVisible) this.context.show()
      }
    }
  }

  update(): void
  {
    this.action.update()
    this.tool.update()
    this.style.update()
  }

  show(): void
  {
    this.action.show()
    this.tool.show()
    this.style.show()
  }

  hide(): void
  {
    this.action.hide()
    this.tool.hide()
    this.style.hide()
  }

  destroy(): void
  {
    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
    this.context.destroy()
  }
}
