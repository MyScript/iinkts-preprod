import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { PartialDeep } from "../../utils"
import { TIISymbol } from "../../symbol"
import uploadIcon from "../../assets/svg/upload.svg"

/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
export class ImportMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-import`,
      label: "Import",
      menuTitle: "Import",
      icon: uploadIcon,
      position: "right-top",
      items: [
        {
          type: "fileinput",
          id: `${idPrefix}-import-file`,
          label: "Import",
          accept: ".json",
          multiple: false,
          buttonLabel: "Import",
          action: async (editor, files) => {
            if (files.length) {
              const fileString = await this.readFileAsText(files[0])
              const symbols = JSON.parse(fileString) as PartialDeep<TIISymbol>[]
              await editor.createSymbols(symbols)
            }
          }
        }
      ]
    }

    super(config, editor)
  }

  private async readFileAsText(file: File): Promise<string>
  {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = () => {
        resolve(reader.result as string)
      }
      if (file) {
        reader.readAsText(file)
      }
    })
  }
}
