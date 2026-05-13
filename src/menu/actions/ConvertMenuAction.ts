import { InteractiveInkEditor } from "../../editor"
import { ButtonMenuItem, IMenuButton } from "../items/ButtonMenuItem"
import translateIcon from "../../assets/svg/translate.svg"

/**
 * @group Menu
 * @remarks Menu action Convert
 */
export class ConvertMenuAction extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config: IMenuButton = {
      type: "button",
      id: `${idPrefix}-convert`,
      label: "Convert",
      icon: translateIcon,
      action: (editor) => editor.convert(),
      disabled: (editor) => !editor.extractStrokesFromSymbols(editor.model.symbols).length
    }
    super(config, editor)
  }
}
