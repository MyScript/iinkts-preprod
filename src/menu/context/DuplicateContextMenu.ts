import { InteractiveInkEditor } from "@/editor"
import { ButtonMenuItem, IMenuButton } from "../items"

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
export class DuplicateContextMenu extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-duplicate`,
      label: "Duplicate",
      action: async () => {
        const symbolsToDuplicate = this.editor.model.symbolsSelected.slice()
        await this.editor.duplicate(symbolsToDuplicate)
      }
    }
    super(config, editor)
  }
}
