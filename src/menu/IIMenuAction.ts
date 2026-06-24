import menuIcon from "@/assets/svg/menu.svg"
import { LoggerCategory, LoggerManager } from "@/logger"
import { IIModel } from "@/model"
import { InteractiveInkEditor } from "@/editor"
import { DOMFactory } from "@/components/dom"
import { BaseMenuItem } from "./items"
import { IEditorTheme } from "@/editor/EditorThemes"
import {
  ClearMenuAction,
  LanguageMenuAction,
  UndoRedoMenuAction,
  ZoomMenuAction,
  ConvertMenuAction,
  GestureMenuAction, TGestureActionConfig,
  GuideMenuAction, TGuideActionConfig,
  SnapMenuAction, TSnapActionConfig,
  MathMenuAction, TMathActionConfig,
  OverlayMenuAction, TOverlayActionConfig,
  SelectionMenuAction, TSelectionActionConfig,
  ExportMenuAction, TExportActionConfig,
  ImportMenuAction,
  MinimapMenuAction,
  ThemeMenuAction
} from "./actions"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
export interface IIMenuActionConfig {
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
  /** Enable/disable Snap submenu. Pass an object to configure individual snap items. */
  snap?: TSnapActionConfig
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
  themes?: IEditorTheme[]
}

/** @group Menu */
export const DefaultMenuActionConfig: Required<Omit<IIMenuActionConfig, "themes">> = {
  clear: true,
  language: true,
  undoRedo: true,
  zoom: true,
  convert: true,
  gesture: true,
  guide: true,
  snap: true,
  math: true,
  overlay: true,
  selection: true,
  export: true,
  import: true,
  minimap: true,
  theme: true
}

function extractSubConfig<T>(config: boolean | T): T | undefined {
  return typeof config === "object" && config !== null ? config : undefined
}

/**
 * @group Menu
 */
export class IIMenuAction
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLElement
  config: Required<Omit<IIMenuActionConfig, "themes">> & Pick<IIMenuActionConfig, "themes">

  private menuActions: Map<string, BaseMenuItem> = new Map()
  #documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(editor: InteractiveInkEditor, id = "ms-menu-action", config?: IIMenuActionConfig)
  {
    this.id = id
    this.editor = editor
    this.config = { ...DefaultMenuActionConfig, ...config }
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get isMobile(): boolean
  {
    return this.editor.renderer.parent.clientWidth < 700
  }


  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.action.enable) {
      this.#logger.info("Rendering menu actions with config", this.config)

      
      const menuTrigger = DOMFactory.button({ id: this.id, className: "square", html: menuIcon })

      const subMenuWrapper = DOMFactory.div({ className: "ms-menu-column" })

      if (this.config.theme) {
        const themeAction = new ThemeMenuAction(this.editor, this.id, this.config.themes)
        this.menuActions.set("theme", themeAction)
        subMenuWrapper.appendChild(themeAction.getElement())
      }

      if (this.config.gesture) {
        const gestureAction = new GestureMenuAction(this.editor, this.id, extractSubConfig(this.config.gesture))
        this.menuActions.set("gesture", gestureAction)
        subMenuWrapper.appendChild(gestureAction.getElement())
      }

      if (this.config.guide) {
        const guideAction = new GuideMenuAction(this.editor, this.id, extractSubConfig(this.config.guide))
        this.menuActions.set("guide", guideAction)
        subMenuWrapper.appendChild(guideAction.getElement())
      }

      if (this.config.snap) {
        const snapAction = new SnapMenuAction(this.editor, this.id, extractSubConfig(this.config.snap))
        this.menuActions.set("snap", snapAction)
        subMenuWrapper.appendChild(snapAction.getElement())
      }

      if (this.config.math && this.editor.configuration.recognition["raw-content"].recognition?.types.includes("math")) {
        const mathAction = new MathMenuAction(this.editor, this.id, extractSubConfig(this.config.math))
        this.menuActions.set("math", mathAction)
        subMenuWrapper.appendChild(mathAction.getElement())
      }

      if (this.config.overlay) {
        const overlayAction = new OverlayMenuAction(this.editor, this.id, extractSubConfig(this.config.overlay))
        this.menuActions.set("overlay", overlayAction)
        subMenuWrapper.appendChild(overlayAction.getElement())
      }

      if (this.config.selection) {
        const selectionAction = new SelectionMenuAction(this.editor, this.id, extractSubConfig(this.config.selection))
        this.menuActions.set("selection", selectionAction)
        subMenuWrapper.appendChild(selectionAction.getElement())
      }

      if (this.config.import) {
        const importAction = new ImportMenuAction(this.editor, this.id)
        this.menuActions.set("import", importAction)
        subMenuWrapper.appendChild(importAction.getElement())
      }

      if (this.config.export) {
        const exportAction = new ExportMenuAction(this.editor, this.id, extractSubConfig(this.config.export))
        this.menuActions.set("export", exportAction)
        subMenuWrapper.appendChild(exportAction.getElement())
      }

      this.wrapper = DOMFactory.div({ className: ["ms-menu", "ms-menu-top-left", "ms-menu-row"] })

      // Only add submenu if there are items
      if (subMenuWrapper.children.length > 0) {
        const subMenuElement = DOMFactory.div({ className: "sub-menu" })
        subMenuElement.appendChild(menuTrigger)

        const subMenuContent = DOMFactory.div({ className: ["sub-menu-content", "bottom-right"] })
        subMenuContent.appendChild(subMenuWrapper)
        subMenuElement.appendChild(subMenuContent)

        // Event listeners
        menuTrigger.addEventListener("pointerdown", () => subMenuContent.classList.toggle("open"))
        this.#documentPointerdownHandler = (e: PointerEvent) => {
          if (!subMenuElement.contains(e.target as HTMLElement)) {
            subMenuContent.classList.remove("open")
          }
        }
        document.addEventListener("pointerdown", this.#documentPointerdownHandler)

        this.wrapper.appendChild(subMenuElement)
      }

      if (this.config.language) {
        const languageAction = new LanguageMenuAction(this.editor, this.id)
        this.menuActions.set("language", languageAction)
        this.wrapper.appendChild(languageAction.getElement())
      }

      if (this.config.clear) {
        const clearAction = new ClearMenuAction(this.editor, this.id)
        this.menuActions.set("clear", clearAction)
        this.wrapper.appendChild(clearAction.getElement())
      }

      if (this.config.undoRedo) {
        const undoRedoAction = new UndoRedoMenuAction(this.editor, this.id)
        this.menuActions.set("undoRedo", undoRedoAction)
        this.wrapper.appendChild(undoRedoAction.getElement())
      }

      if (this.config.convert) {
        const convertAction = new ConvertMenuAction(this.editor, this.id)
        this.menuActions.set("convert", convertAction)
        this.wrapper.appendChild(convertAction.getElement())
      }

      if (this.config.zoom) {
        const zoomAction = new ZoomMenuAction(this.editor, this.id)
        this.menuActions.set("zoom", zoomAction)
        this.wrapper.appendChild(zoomAction.getElement())
      }

      if (this.config.minimap) {
        const minimapAction = new MinimapMenuAction(this.editor, layer, this.id)
        this.menuActions.set("minimap", minimapAction)
        this.wrapper.appendChild(minimapAction.getElement())
      }

      layer.appendChild(this.wrapper)
      this.update()
      this.show()
    }
  }

  update(): void
  {
    this.menuActions.forEach(menuAction => {
      menuAction.update()
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
      if (this.#documentPointerdownHandler) {
        document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
        this.#documentPointerdownHandler = undefined
      }
      this.menuActions.forEach(menuAction => {
        menuAction.destroy()
      })
      this.menuActions.clear()

      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
    }
  }
}
