import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"

import type { TMenuButton } from "../items"
import { ButtonMenuItem } from "../items"

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
export class DuplicateContextMenu extends ButtonMenuItem {
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-duplicate`,
      label: "Duplicate",
      action: async () => {
        const symbolsToDuplicate = this.editor.model.symbolsSelected.slice()
        await this.editor.duplicate(symbolsToDuplicate)
      },
    }
    super(config, editor)
  }
}
