import { InteractiveInkEditor } from "@/editor"
import { ButtonMenuItem, IMenuButton } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
export class RemoveContextMenu extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-remove`,
      label: "Remove",
      action: async (editor: InteractiveInkEditor) => {
        const symbolsSelected = editor.model.symbolsSelected
        editor.selector.removeSelectedGroup()
        await editor.removeSymbols(symbolsSelected.map(s => s.id))
      }
    }
    super(config, editor)
  }
}
