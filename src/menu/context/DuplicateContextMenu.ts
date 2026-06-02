import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import { SELECTION_MARGIN } from "@/Constants"
import { SymbolType, RecognizedKind } from "@/symbol"
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

        // Reset jiixId and variableValues for recognized symbols as they need re-recognition
        if (clone.type === SymbolType.Recognized) {
          clone.jiixId = undefined
          if (clone.kind === RecognizedKind.Math) {
            clone.variableValues = undefined
          }
        }

        while (this.editor.model.symbols.find(s => s.id === clone.id)) {
          clone.id = `${clone.type}-${ createUUID() }`
          if (clone.type === SymbolType.Recognized) {
            clone.jiixId = undefined
            clone.strokes.forEach(s => s.id = `${s.type}-${ createUUID() }`)
            // Reset jiixId as strokes have changed and need re-recognition
            clone.jiixId = undefined
            // Reset variableValues for math symbols as they're tied to jiixId
            if (clone.kind === RecognizedKind.Math) {
              clone.variableValues = undefined
            }
          }
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
