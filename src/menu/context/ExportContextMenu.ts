import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"

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
        },
        {
          id: `${idPrefix}-export-text`,
          type: "button",
          label: "text",
          action: () => editor.downloadAsText(haveSymbolsSelected)
        }
      ]
    }

    super(config, editor)
  }
}
