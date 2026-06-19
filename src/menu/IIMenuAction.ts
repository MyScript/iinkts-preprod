import menuIcon from "@/assets/svg/menu.svg"
import { LoggerCategory, LoggerManager } from "@/logger"
import { IIModel } from "@/model"
import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem } from "./items"
import {
  ClearMenuAction,
  LanguageMenuAction,
  UndoRedoMenuAction,
  ZoomMenuAction,
  ConvertMenuAction,
  GestureMenuAction,
  GuideMenuAction,
  SnapMenuAction,
  MathMenuAction,
  OverlayMenuAction,
  SelectionMenuAction,
  ExportMenuAction,
  ImportMenuAction,
  MinimapMenuAction
} from "./actions"
import { IIMenuActionConfig, defaultMenuActionConfig } from "./IIMenuActionConfig"

/**
 * @group Menu
 */
export class IIMenuAction
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLElement
  config: Required<IIMenuActionConfig>

  private menuActions: Map<string, BaseMenuItem> = new Map()
  #documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(editor: InteractiveInkEditor, id = "ms-menu-action", config?: IIMenuActionConfig)
  {
    this.id = id
    this.editor = editor
    this.config = { ...defaultMenuActionConfig, ...config }
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

      const menuTrigger = document.createElement("button")
      menuTrigger.id = this.id
      menuTrigger.classList.add("ms-menu-button", "square")
      menuTrigger.innerHTML = menuIcon

      const subMenuWrapper = document.createElement("div")
      subMenuWrapper.classList.add("ms-menu-column")

      if (this.config.gesture) {
        const gestureAction = new GestureMenuAction(this.editor, this.id)
        this.menuActions.set("gesture", gestureAction)
        subMenuWrapper.appendChild(gestureAction.getElement())
      }

      if (this.config.guide) {
        const guideAction = new GuideMenuAction(this.editor, this.id)
        this.menuActions.set("guide", guideAction)
        subMenuWrapper.appendChild(guideAction.getElement())
      }

      if (this.config.snap) {
        const snapAction = new SnapMenuAction(this.editor, this.id)
        this.menuActions.set("snap", snapAction)
        subMenuWrapper.appendChild(snapAction.getElement())
      }

      if (this.config.math) {
        const mathAction = new MathMenuAction(this.editor, this.id)
        this.menuActions.set("math", mathAction)
        subMenuWrapper.appendChild(mathAction.getElement())
      }

      if (this.config.overlay) {
        const overlayAction = new OverlayMenuAction(this.editor, this.id)
        this.menuActions.set("overlay", overlayAction)
        subMenuWrapper.appendChild(overlayAction.getElement())
      }

      if (this.config.selection) {
        const selectionAction = new SelectionMenuAction(this.editor, this.id)
        this.menuActions.set("selection", selectionAction)
        subMenuWrapper.appendChild(selectionAction.getElement())
      }

      if (this.config.import) {
        const importAction = new ImportMenuAction(this.editor, this.id)
        this.menuActions.set("import", importAction)
        subMenuWrapper.appendChild(importAction.getElement())
      }

      if (this.config.export) {
        const exportAction = new ExportMenuAction(this.editor, this.id)
        this.menuActions.set("export", exportAction)
        subMenuWrapper.appendChild(exportAction.getElement())
      }

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-left", "ms-menu-row")

      // Only add submenu if there are items
      if (subMenuWrapper.children.length > 0) {
        const subMenuElement = document.createElement("div")
        subMenuElement.classList.add("sub-menu")
        subMenuElement.appendChild(menuTrigger)

        const subMenuContent = document.createElement("div")
        subMenuContent.classList.add("sub-menu-content", "bottom-right")
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
