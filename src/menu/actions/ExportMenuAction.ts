import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import downloadIcon from "../../assets/svg/download.svg"

/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
export class ExportMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-export`,
      label: "Export",
      menuTitle: "Export",
      icon: downloadIcon,
      position: "right-top",
      items: [
        {
          type: "button",
          id: `${idPrefix}-export-json`,
          label: "JSON",
          action: (editor) => editor.downloadAsJson()
        },
        {
          type: "button",
          id: `${idPrefix}-export-svg`,
          label: "SVG",
          action: (editor) => editor.downloadAsSVG()
        },
        {
          type: "button",
          id: `${idPrefix}-export-png`,
          label: "PNG",
          action: (editor) => editor.downloadAsPNG()
        }
      ]
    }

    super(config, editor)
  }
}
