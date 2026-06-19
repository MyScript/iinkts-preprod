import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TContextExportItemsConfig = {
  json?: boolean
  svg?: boolean
  png?: boolean
  text?: boolean
}
/** @group Menu */
export type TContextExportConfig = boolean | TContextExportItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
export class ExportContextMenu extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context", itemsConfig?: TContextExportItemsConfig)
  {
    const enabled = (key: keyof TContextExportItemsConfig) => itemsConfig?.[key] !== false

    const config: IMenuSubMenu = {
      id: `${idPrefix}-export`,
      type: "submenu",
      label: "Export",
      position: "right",
      items: []
    }

    if (enabled("json")) {
      config.items.push({ id: `${idPrefix}-export-json`, type: "button", label: "json", action: () => editor.downloadAsJson(editor.model.symbolsSelected.length > 0) })
    }
    if (enabled("svg")) {
      config.items.push({ id: `${idPrefix}-export-svg`, type: "button", label: "svg", action: () => editor.downloadAsSVG(editor.model.symbolsSelected.length > 0) })
    }
    if (enabled("png")) {
      config.items.push({ id: `${idPrefix}-export-png`, type: "button", label: "png", action: () => editor.downloadAsPNG(editor.model.symbolsSelected.length > 0) })
    }
    if (enabled("text")) {
      config.items.push({ id: `${idPrefix}-export-text`, type: "button", label: "text", action: () => editor.downloadAsText(editor.model.symbolsSelected.length > 0) })
    }

    super(config, editor)
  }
}
