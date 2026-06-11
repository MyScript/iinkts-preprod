import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import { SELECTION_MARGIN } from "@/Constants"
import { createUUID } from "@/utils"

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
export class DuplicateContextMenu extends BaseMenuItem<HTMLButtonElement>
{
  protected declare config: TGenericMenuItem

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: TGenericMenuItem = {
      type: "button",
      id: `${idPrefix}-duplicate`,
      label: "Duplicate"
    }
    super(config, editor)
  }

  createElement(): HTMLButtonElement
  {
    const button = document.createElement("button")
    button.id = this.config.id
    button.classList.add("ms-menu-button")
    button.textContent = this.config.label || "Duplicate"
    
    button.addEventListener("pointerup", async () => {
      const symbolsToDuplicate = this.editor.model.symbolsSelected.slice()

      const duplicatedSymbols = symbolsToDuplicate.map(s => {
        const clone = s.clone()

        // Generate unique ID for cloned symbols
        while (this.editor.model.symbols.find(sym => sym.id === clone.id)) {
          clone.id = `${clone.type}-${createUUID()}`
        }

        clone.selected = true
        this.editor.translator.applyToSymbol(clone, SELECTION_MARGIN, clone.bounds.height + SELECTION_MARGIN)
        return clone
      })

      this.editor.unselectAll()
      await this.editor.addSymbols(duplicatedSymbols)
      this.editor.selector.drawSelectedGroup(duplicatedSymbols)
    })

    return button
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()
  }
}
