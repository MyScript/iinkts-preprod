import { LoggerCategory, LoggerManager } from "../logger"
import { IIRecognizedText, IIRecognizedMath, IIStroke, IISymbolGroup, IIText, RecognizedKind, SymbolType, TIISymbol } from "../symbol"
import { InteractiveInkEditor } from "../editor"
import { IIMenuContextConfig, defaultMenuContextConfig } from "./IIMenuContextConfig"
import {
  EditContextMenu,
  DecoratorContextMenu,
  ReorderContextMenu,
  ExportContextMenu,
  ConvertContextMenu,
  MathContextMenu,
  GroupContextMenu,
  DuplicateContextMenu,
  RemoveContextMenu,
  SelectAllContextMenu
} from "./context"
/**
 * @group Menu
 */
export class IIMenuContext
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLElement
  config: Required<IIMenuContextConfig>

  // Context menu instances
  private contextMenus: Map<string, EditContextMenu | DecoratorContextMenu | ReorderContextMenu | ExportContextMenu | ConvertContextMenu | MathContextMenu | GroupContextMenu | DuplicateContextMenu | RemoveContextMenu | SelectAllContextMenu> = new Map()

  position: {
    x: number,
    y: number
  }

  constructor(editor: InteractiveInkEditor, id = "ms-menu-context", config?: IIMenuContextConfig)
  {
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
    this.config = { ...defaultMenuContextConfig, ...config }
    this.position = { x: 0, y: 0 }
  }

  get symbolsSelected(): TIISymbol[]
  {
    return this.editor.model.symbolsSelected
  }

  get haveSymbolsSelected(): boolean
  {
    return this.symbolsSelected.length > 0
  }

  get symbolsDecorable(): (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  {
    return this.symbolsSelected.filter(s => {
      return s.type === SymbolType.Stroke || s.type === SymbolType.Text || s.type === SymbolType.Group || (s.type === SymbolType.Recognized && s.kind === RecognizedKind.Text)
    }) as (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  }

  get showDecorator(): boolean
  {
    return this.symbolsDecorable.length > 0
  }

  get hasSingleMathSymbol(): boolean
  {
    return this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Recognized && this.symbolsSelected[0].kind === RecognizedKind.Math
  }

  protected async updateMathMenu(): Promise<void>
  {
    const mathMenuInstance = this.contextMenus.get("math") as MathContextMenu | undefined
    if (mathMenuInstance) {
      if (this.hasSingleMathSymbol) {
        const mathSymbol = this.symbolsSelected[0] as IIRecognizedMath
        const [actions, variables, evaluables] = await Promise.all([
          this.editor.getAvailableActions(mathSymbol.jiixId!),
          this.editor.getVariables(mathSymbol.jiixId!),
          this.editor.getEvaluables(mathSymbol.jiixId!)
        ])

        const canEditVariables = Object.keys(variables).length > 0
        const canCompute = actions?.includes("numerical-computation") && !mathSymbol.solverOutputStrokeIds
        const canEvaluate = evaluables?.length ? true : false
        if (canEditVariables || canCompute || canEvaluate) {
          mathMenuInstance.setMenuVisibility(true, { canEditVariables, canCompute, canEvaluate })
        } else {
          mathMenuInstance.setMenuVisibility(false, { canEditVariables: false, canCompute: false, canEvaluate: false })
        }
      }
      else {
        mathMenuInstance.setMenuVisibility(false, { canEditVariables: false, canCompute: false, canEvaluate: false })
      }
    }
  }

  update(): void
  {
    // Position is now in client coordinates (relative to viewport), no need to adjust for scroll
    this.wrapper?.style.setProperty("left", `${ this.position.x }px`)
    this.wrapper?.style.setProperty("top", `${ this.position.y }px`)

    // Adjust position if menu overflows viewport boundaries
    if (this.wrapper) {
      const rect = this.wrapper.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = this.position.x
      let adjustedY = this.position.y

      // Check if menu overflows bottom
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10 // 10px margin
      }

      // Check if menu overflows right
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10 // 10px margin
      }

      // Check if menu overflows left
      if (adjustedX < 10) {
        adjustedX = 10 // 10px margin
      }

      // Check if menu overflows top
      if (adjustedY < 10) {
        adjustedY = 10 // 10px margin
      }

      // Apply adjusted positions if needed
      if (adjustedX !== this.position.x) {
        this.wrapper.style.setProperty("left", `${ adjustedX }px`)
      }
      if (adjustedY !== this.position.y) {
        this.wrapper.style.setProperty("top", `${ adjustedY }px`)
      }
    }

    if (this.haveSymbolsSelected) {
      // Update edit menu
      const editMenuInstance = this.contextMenus.get("edit") as EditContextMenu | undefined
      if (editMenuInstance) {
        const textSymbol = this.editor.model.symbolsSelected.find(s => s.type === SymbolType.Text)
        if (editMenuInstance.editInput && this.editor.model.symbolsSelected.length === 1 && textSymbol) {
          editMenuInstance.editInput.value = (textSymbol as IIText).label
          editMenuInstance.getElement().style.removeProperty("display")
        }
        else {
          editMenuInstance.getElement().style.setProperty("display", "none")
        }
      }

      // Show convert button only if there are strokes AND not only math selected
      if (this.editor.extractStrokesFromSymbols(this.symbolsSelected).length && !this.hasSingleMathSymbol) {
        this.contextMenus.get("convert")?.getElement().style.removeProperty("display")
      }
      else {
        this.contextMenus.get("convert")?.getElement().style.setProperty("display", "none")
      }

      this.contextMenus.get("reorder")?.getElement().style.removeProperty("display")
      this.contextMenus.get("duplicate")?.getElement().style.removeProperty("display")
      this.contextMenus.get("remove")?.getElement().style.removeProperty("display")
      this.contextMenus.get("export")?.getElement().style.removeProperty("display")

      // Update group menu
      const groupMenuInstance = this.contextMenus.get("group") as GroupContextMenu | undefined
      if (groupMenuInstance && !this.hasSingleMathSymbol) {
        groupMenuInstance.update()
        groupMenuInstance.getElement().style.removeProperty("display")
      }
      else {
        groupMenuInstance?.getElement().style.setProperty("display", "none")
      }
    }
    else {
      this.contextMenus.get("edit")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("convert")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("reorder")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("duplicate")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("remove")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("export")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("group")?.getElement().style.setProperty("display", "none")
    }

    // Update menu instances
    this.contextMenus.get("edit")?.update()
    this.contextMenus.get("decorator")?.update()
    this.contextMenus.get("duplicate")?.update()
    this.updateMathMenu()
  }

  render(layer: HTMLElement): void
  {
    this.#logger.info("Rendering context menu with config", this.config)

    this.wrapper = document.createElement("div")
    this.wrapper.id = `${ this.id }-wrapper`
    this.wrapper.classList.add("ms-menu", "ms-menu-context")

    if (this.config.edit) {
      const editMenuInstance = new EditContextMenu(this.editor, this.id)
      this.contextMenus.set("edit", editMenuInstance)
      this.wrapper.appendChild(editMenuInstance.getElement())
    }

    if (this.config.decorator) {
      const decoratorMenuInstance = new DecoratorContextMenu(this.editor, this.id)
      this.contextMenus.set("decorator", decoratorMenuInstance)
      this.wrapper.appendChild(decoratorMenuInstance.getElement())
    }

    if (this.config.reorder) {
      const reorderMenuInstance = new ReorderContextMenu(this.editor, this.id)
      this.contextMenus.set("reorder", reorderMenuInstance)
      this.wrapper.appendChild(reorderMenuInstance.getElement())
    }

    if (this.config.export) {
      const exportMenuInstance = new ExportContextMenu(this.editor, this.id)
      this.contextMenus.set("export", exportMenuInstance)
      this.wrapper.appendChild(exportMenuInstance.getElement())
    }

    if (this.config.convert) {
      const convertMenuInstance = new ConvertContextMenu(this.editor, this.id)
      this.contextMenus.set("convert", convertMenuInstance)
      this.wrapper.appendChild(convertMenuInstance.getElement())
    }

    if (this.config.math) {
      const mathMenuInstance = new MathContextMenu(this.editor, this.id)
      this.contextMenus.set("math", mathMenuInstance)
      this.wrapper.appendChild(mathMenuInstance.getElement())
    }

    if (this.config.group) {
      const groupMenuInstance = new GroupContextMenu(this.editor, this.id)
      this.contextMenus.set("group", groupMenuInstance)
      this.wrapper.appendChild(groupMenuInstance.getElement())
    }

    if (this.config.duplicate) {
      const duplicateMenuInstance = new DuplicateContextMenu(this.editor, this.id)
      this.contextMenus.set("duplicate", duplicateMenuInstance)
      this.wrapper.appendChild(duplicateMenuInstance.getElement())
    }

    if (this.config.remove) {
      const removeMenuInstance = new RemoveContextMenu(this.editor, this.id)
      this.contextMenus.set("remove", removeMenuInstance)
      this.wrapper.appendChild(removeMenuInstance.getElement())
    }

    if (this.config.selectAll) {
      const selectAllMenuInstance = new SelectAllContextMenu(this.editor, this.id)
      this.contextMenus.set("selectAll", selectAllMenuInstance)
      this.wrapper.appendChild(selectAllMenuInstance.getElement())
    }

    this.wrapper.style.setProperty("display", "none")
    layer.appendChild(this.wrapper)

    // Hide context menu when scrolling as the referenced element moves
    this.editor.layers.rendering.addEventListener("scroll", () =>
    {
      this.hide()
    })
  }

  show(): void
  {
    this.update()
    this.wrapper?.style.setProperty("display", "block")
  }

  hide(): void
  {
    this.wrapper?.style.setProperty("display", "none")
  }

  destroy(): void
  {
    while (this.wrapper?.lastChild) {
      this.wrapper.removeChild(this.wrapper.lastChild)
    }
    this.wrapper?.remove()
  }
}
