import type { InteractiveInkEditor } from "@/editor"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem";
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"
import trashIcon from "@/assets/svg/trash.svg"

/**
 * @group Menu
 * @remarks Menu action Clear
 */
export class ClearMenuAction extends ButtonMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-clear`,
      label: "Clear",
      icon: trashIcon,
      action: (editor) => editor.clear(),
      disabled: (editor) => editor.history.context.empty
    }
    super(config, editor)
  }
}
