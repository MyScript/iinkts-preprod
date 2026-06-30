import translateIcon from "@/assets/svg/translate.svg"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action Convert
 */
export class ConvertMenuAction extends ButtonMenuItem {
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-convert`,
      label: "Convert",
      icon: translateIcon,
      action: (editor) => editor.convert(),
      disabled: (editor) => !editor.extractStrokesFromSymbols(editor.model.symbols).length,
    }
    super(config, editor)
  }
}
