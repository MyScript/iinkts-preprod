import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
export class ExportContextMenu extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context")
  {
    const haveSymbolsSelected = editor.model.symbolsSelected.length > 0

    const config: IMenuSubMenu = {
      id: `${idPrefix}-export`,
      type: "submenu",
      label: "Export",
      position: "right",
      items: [
        {
          id: `${idPrefix}-export-json`,
          type: "button",
          label: "json",
          action: () => editor.downloadAsJson(haveSymbolsSelected)
        },
        {
          id: `${idPrefix}-export-svg`,
          type: "button",
          label: "svg",
          action: () => editor.downloadAsSVG(haveSymbolsSelected)
        },
        {
          id: `${idPrefix}-export-png`,
          type: "button",
          label: "png",
          action: () => editor.downloadAsPNG(haveSymbolsSelected)
        }
      ]
    }

    super(config, editor)
  }
}
