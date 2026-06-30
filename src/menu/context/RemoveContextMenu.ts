import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
export class RemoveContextMenu extends ButtonMenuItem {
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-remove`,
      label: "Remove",
      action: async (editor: TInteractiveInkEditor) => {
        const symbolsSelected = editor.model.symbolsSelected
        editor.selector.removeSelectedGroup()
        await editor.removeSymbols(symbolsSelected.map((s) => s.id))
      },
    }
    super(config, editor)
  }
}
