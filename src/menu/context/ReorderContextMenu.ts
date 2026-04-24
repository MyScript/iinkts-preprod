import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
export class ReorderContextMenu extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const symbolsSelected = editor.model.symbolsSelected

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
            editor.changeOrderSymbols(symbolsSelected, "last")
            editor.selector.resetSelectedGroup(symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-forward`,
          type: "button",
          label: "Bring forward",
          action: () => {
            editor.changeOrderSymbols(symbolsSelected, "forward")
            editor.selector.resetSelectedGroup(symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-backward`,
          type: "button",
          label: "Send backward",
          action: () => {
            editor.changeOrderSymbols(symbolsSelected, "backward")
            editor.selector.resetSelectedGroup(symbolsSelected)
          }
        },
        {
          id: `${idPrefix}-reorder-last`,
          type: "button",
          label: "Send to back",
          action: () => {
            editor.changeOrderSymbols(symbolsSelected.slice().reverse(), "first")
            editor.selector.resetSelectedGroup(symbolsSelected)
          }
        }
      ]
    }

    super(config, editor)
  }
}
