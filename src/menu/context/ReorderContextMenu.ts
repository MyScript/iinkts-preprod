import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
export class ReorderContextMenu extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const config: IMenuSubMenu = {
      id: `${idPrefix}-reorder`,
      type: "submenu",
      label: "Reorder",
      position: "right",
      items: [
        {
          id: `${idPrefix}-reorder-first`,
          type: "button",
          label: "Bring to front",
          action: () => {
            editor.changeOrderSymbols(editor.model.symbolsSelected, "last")
            editor.selector.resetSelectedGroup(editor.model.symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-forward`,
          type: "button",
          label: "Bring forward",
          action: () => {
            editor.changeOrderSymbols(editor.model.symbolsSelected, "forward")
            editor.selector.resetSelectedGroup(editor.model.symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-backward`,
          type: "button",
          label: "Send backward",
          action: () => {
            editor.changeOrderSymbols(editor.model.symbolsSelected, "backward")
            editor.selector.resetSelectedGroup(editor.model.symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-last`,
          type: "button",
          label: "Send to back",
          action: () => {
            editor.changeOrderSymbols(editor.model.symbolsSelected.slice().reverse(), "first")
            editor.selector.resetSelectedGroup(editor.model.symbolsSelected)
          }
        }
      ]
    }

    super(config, editor)
  }
}
