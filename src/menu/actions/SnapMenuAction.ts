import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import snapIcon from "@/assets/svg/arrow-to-dot.svg"

/**
 * @group Menu
 * @remarks Menu action Snap - Configuration du snap
 */
export class SnapMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-snap`,
      label: "Snap",
      menuTitle: "Snap",
      icon: snapIcon,
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-snap-to-guide`,
          label: "Snap to guide",
          getValue: (editor) => editor.snaps.snapConfiguration.guide,
          setValue: (editor, value) => {
            editor.snaps.snapConfiguration.guide = value
          }
        },
        {
          type: "checkbox",
          id: `${idPrefix}-snap-to-element`,
          label: "Snap to element",
          getValue: (editor) => editor.snaps.snapConfiguration.symbol,
          setValue: (editor, value) => {
            editor.snaps.snapConfiguration.symbol = value
          }
        },
        {
          type: "select",
          id: `${idPrefix}-snap-angle`,
          label: "Snap angle",
          options: [
            { label: "None", value: "0" },
            { label: "10°", value: "10" },
            { label: "30°", value: "30" },
            { label: "45°", value: "45" },
            { label: "90°", value: "90" },
            { label: "180°", value: "180" }
          ],
          getValue: (editor) => editor.snaps.snapConfiguration.angle.toString(),
          setValue: (editor, angle) => {
            editor.snaps.snapConfiguration.angle = +angle
          }
        }
      ]
    }

    super(config, editor)
  }
}
