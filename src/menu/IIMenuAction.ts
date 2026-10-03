import menuIcon from "@/assets/svg/menu.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TRecognitionType } from "@/client"
import { DOMFactory } from "@/dom"
import type { IIModel } from "@/model"

import type {
  TExportActionConfig,
  TGestureActionConfig,
  TGuideActionConfig,
  TMathActionConfig,
  TOverlayActionConfig,
  TPenActionConfig,
  TSelectionActionConfig,
  TSnapActionConfig,
} from "./actions"
import {
  ClearMenuAction,
  ConvertMenuAction,
  DiagramMenuAction,
  ExportMenuAction,
  GestureMenuAction,
  GuideMenuAction,
  ImportMenuAction,
  LanguageMenuAction,
  MathMenuAction,
  MinimapMenuAction,
  OverlayMenuAction,
  PenMenuAction,
  SelectionMenuAction,
  SnapMenuAction,
  ThemeMenuAction,
  UndoRedoMenuAction,
  ZoomMenuAction,
} from "./actions"
import type { TCanvasTheme } from "./CanvasThemes"
import { IIAbstractMenu } from "./IIAbstractMenu"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
export type TMenuActionConfig = {
  /** Enable/disable Clear menu */
  clear?: boolean
  /** Enable/disable Language menu */
  language?: boolean
  /** Enable/disable Undo/Redo menus */
  undoRedo?: boolean
  /** Enable/disable Zoom menus */
  zoom?: boolean
  /** Enable/disable Convert menu */
  convert?: boolean
  /** Enable/disable Gesture submenu. Pass an object to configure individual gesture items. */
  gesture?: TGestureActionConfig
  /** Enable/disable Guide submenu. Pass an object to configure individual guide items. */
  guide?: TGuideActionConfig
  /** Enable/disable Pen submenu. Pass an object to configure individual pen items. */
  pen?: TPenActionConfig
  /** Enable/disable Snap submenu. Pass an object to configure individual snap items. */
  snap?: TSnapActionConfig
  /** Enable/disable Diagram submenu (toggles whether moving a connected shape follows its anchored edges) */
  diagram?: boolean
  /** Enable/disable Math submenu. Pass an object to configure individual math items. */
  math?: TMathActionConfig
  /** Enable/disable Overlay submenu. Pass an object to configure individual overlay items. */
  overlay?: TOverlayActionConfig
  /** Enable/disable Selection submenu. Pass an object to configure individual selection items. */
  selection?: TSelectionActionConfig
  /** Enable/disable Export submenu. Pass an object to configure individual export formats. */
  export?: TExportActionConfig
  /** Enable/disable Import submenu */
  import?: boolean
  /** Enable/disable Minimap toggle button */
  minimap?: boolean
  /** Enable/disable Theme picker */
  theme?: boolean
  /** Override predefined themes shown in the theme picker */
  themes?: TCanvasTheme[]
}

/** @group Menu */
export const DefaultMenuActionConfig: Required<Omit<TMenuActionConfig, "themes">> = {
  clear: true,
  language: true,
  undoRedo: true,
  zoom: true,
  convert: true,
  gesture: true,
  guide: true,
  pen: true,
  snap: true,
  diagram: true,
  math: true,
  overlay: true,
  selection: true,
  export: true,
  import: true,
  minimap: true,
  theme: true,
}

/**
 * @group Menu
 */
export class IIMenuAction extends IIAbstractMenu<
  Required<Omit<TMenuActionConfig, "themes">> & Pick<TMenuActionConfig, "themes">
> {
  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-action", config?: TMenuActionConfig) {
    super(canvas, id, { ...DefaultMenuActionConfig, ...config })
  }

  get model(): IIModel {
    return this.canvas.model
  }

  get isMobile(): boolean {
    return this.canvas.renderer.parent.clientWidth < 700
  }

  /** Whether the recognition configuration lets the backend recognize `type` */
  protected recognizes(type: TRecognitionType): boolean {
    return !!this.canvas.configuration.recognition["raw-content"].recognition?.types.includes(type)
  }

  render(layer: HTMLElement): void {
    if (!this.canvas.configuration.menu.action.enable) {
      return
    }
    this.logger.info("Rendering menu actions with config", this.config)
    const column = DOMFactory.div({ className: "ms-menu-column" })
    this.renderDropdownItems(column)

    const wrapper = DOMFactory.div({ className: ["ms-menu", "ms-menu-top-left", "ms-menu-row"] })
    this.wrapper = wrapper
    // Only add the dropdown if there are items
    if (column.children.length > 0) {
      const trigger = DOMFactory.button({ id: this.id, className: "square", html: menuIcon })
      wrapper.appendChild(this.createDropdown(trigger, column, "bottom-right").element)
    }
    this.renderBarItems(layer, wrapper)

    layer.appendChild(wrapper)
    this.update()
    this.show()
  }

  protected renderDropdownItems(column: HTMLElement): void {
    const { config } = this
    if (config.theme) {
      this.addItem("theme", new ThemeMenuAction(this.canvas, this.id, config.themes), column)
    }
    if (config.gesture) {
      this.addItem("gesture", new GestureMenuAction(this.canvas, this.id, this.subConfig(config.gesture)), column)
    }
    if (config.guide) {
      this.addItem("guide", new GuideMenuAction(this.canvas, this.id, this.subConfig(config.guide)), column)
    }
    if (config.pen) {
      this.addItem("pen", new PenMenuAction(this.canvas, this.id, this.subConfig(config.pen)), column)
    }
    if (config.snap) {
      this.addItem("snap", new SnapMenuAction(this.canvas, this.id, this.subConfig(config.snap)), column)
    }
    if (config.diagram && this.recognizes("shape")) {
      this.addItem("diagram", new DiagramMenuAction(this.canvas, this.id), column)
    }
    if (config.math && this.recognizes("math")) {
      this.addItem("math", new MathMenuAction(this.canvas, this.id, this.subConfig(config.math)), column)
    }
    if (config.overlay) {
      this.addItem("overlay", new OverlayMenuAction(this.canvas, this.id, this.subConfig(config.overlay)), column)
    }
    if (config.selection) {
      const selection = new SelectionMenuAction(this.canvas, this.id, this.subConfig(config.selection))
      this.addItem("selection", selection, column)
    }
    if (config.import) {
      this.addItem("import", new ImportMenuAction(this.canvas, this.id), column)
    }
    if (config.export) {
      this.addItem("export", new ExportMenuAction(this.canvas, this.id, this.subConfig(config.export)), column)
    }
  }

  protected renderBarItems(layer: HTMLElement, bar: HTMLElement): void {
    const { config } = this
    if (config.language) {
      this.addItem("language", new LanguageMenuAction(this.canvas, this.id), bar)
    }
    if (config.clear) {
      this.addItem("clear", new ClearMenuAction(this.canvas, this.id), bar)
    }
    if (config.undoRedo) {
      this.addItem("undoRedo", new UndoRedoMenuAction(this.canvas, this.id), bar)
    }
    if (config.convert) {
      this.addItem("convert", new ConvertMenuAction(this.canvas, this.id), bar)
    }
    if (config.zoom) {
      this.addItem("zoom", new ZoomMenuAction(this.canvas, this.id), bar)
    }
    if (config.minimap) {
      this.addItem("minimap", new MinimapMenuAction(this.canvas, layer, this.id), bar)
    }
  }
}
