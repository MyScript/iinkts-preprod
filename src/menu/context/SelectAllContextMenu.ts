import type { InteractiveInkEditor } from "@/editor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem";
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Select All - Sélectionne tous les symboles
 */
export class SelectAllContextMenu extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-select-all`,
      label: "Select all",
      action: async (editor: InteractiveInkEditor) => {
        await editor.selectAll()
      }
    }
    super(config, editor)
  }
}
