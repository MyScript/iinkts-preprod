import type { InteractiveInkEditor } from "@/editor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem";
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Convert - Convertit les symboles sélectionnés
 */
export class ConvertContextMenu extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-convert`,
      label: "Convert",
      action: (editor: InteractiveInkEditor) => {
        const symbolsSelected = editor.model.symbolsSelected
        editor.convert(symbolsSelected)
      }
    }
    super(config, editor)
  }
}
