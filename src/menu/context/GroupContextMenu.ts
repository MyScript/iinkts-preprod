import { InteractiveInkEditor } from "../../editor"
import { BaseMenuItem, TGenericMenuItem } from "../items/BaseMenuItem"
import { IISymbolGroup, SymbolType } from "../../symbol"

/**
 * @group Menu
 * @remarks Menu contextuel Group/Ungroup - Groupe ou dégroupe les symboles sélectionnés
 */
export class GroupContextMenu extends BaseMenuItem<HTMLButtonElement>
{
  protected declare config: TGenericMenuItem

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: TGenericMenuItem = {
      type: "button",
      id: `${idPrefix}-group`,
      label: "Group"
    }
    super(config, editor)
  }

  createElement(): HTMLButtonElement
  {
    const button = document.createElement("button")
    button.id = this.config.id
    button.classList.add("ms-menu-button")
    button.textContent = this.config.label || "Group"
    
    button.addEventListener("pointerup", async () => {
      const symbolsSelected = this.editor.model.symbolsSelected
      
      if (symbolsSelected.length === 1 && symbolsSelected[0].type === SymbolType.Group) {
        const symbols = this.editor.ungroupSymbol(symbolsSelected[0] as IISymbolGroup)
        this.editor.select(symbols.map(s => s.id))
      }
      else {
        const symbols = symbolsSelected.slice()
        const group = this.editor.groupSymbols(symbols)
        group.selected = true
        this.editor.select([group.id])
      }
    })

    return button
  }

  update(): void
  {
    if (!this.element) return

    const symbolsSelected = this.editor.model.symbolsSelected
    
    // Update button text based on selection
    if (symbolsSelected.length === 1 && symbolsSelected[0].type === SymbolType.Group) {
      this.element.textContent = "UnGroup"
    }
    else {
      this.element.textContent = "Group"
    }

    this.updateDisabled()
    this.updateVisible()
  }
}
