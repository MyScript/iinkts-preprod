import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import guideIcon from "@/assets/svg/orthogonal-view.svg"

/**
 * @group Menu
 * @remarks Menu action Guide - Configuration des guides
 */
export class GuideMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const guideGaps = [
      { label: "S", value: "25" },
      { label: "M", value: "50" },
      { label: "L", value: "100" },
      { label: "XL", value: "150" }
    ]

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-guide`,
      label: "Guide",
      menuTitle: "Guide",
      icon: guideIcon,
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-guide-enable`,
          label: "Show guide",
          getValue: (editor) => editor.configuration.rendering.guides.enable,
          setValue: (editor, value) => {
            editor.configuration.rendering.guides.enable = value
            editor.renderingConfiguration = editor.configuration.rendering
          }
        },
        {
          type: "select",
          id: `${idPrefix}-guide-type`,
          label: "Guide style",
          options: [
            { label: "Line", value: "line" },
            { label: "Grid", value: "grid" },
            { label: "Point", value: "point" }
          ],
          getValue: (editor) => editor.configuration.rendering.guides.type,
          setValue: (editor, value) => {
            editor.configuration.rendering.guides.type = value as ("line" | "grid" | "point")
            editor.renderingConfiguration = editor.configuration.rendering
          }
        },
        {
          type: "buttonlist",
          id: `${idPrefix}-guide-size`,
          label: "Guide size",
          buttonType: "square",
          options: guideGaps,
          getValue: (editor) => editor.configuration.rendering.guides.gap.toString(),
          setValue: (editor, value) => {
            editor.configuration.rendering.guides.gap = +value
            editor.renderingConfiguration = editor.configuration.rendering
          }
        }
      ]
    }

    super(config, editor)
  }
}
