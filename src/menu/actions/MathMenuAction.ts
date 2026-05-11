import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { IMenuCheckbox } from "../items/CheckboxMenuItem"
import mathIcon from "../../assets/svg/linear-double-arrow.svg"

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const items: IMenuCheckbox[] = [
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-badges`,
        label: "Show Badges (∑)",
        getValue: (editor: InteractiveInkEditor) => editor.mathOverlays.getConfig().showBadges,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathOverlays.toggleBadges(value)
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-borders`,
        label: "Show Borders",
        getValue: (editor: InteractiveInkEditor) => editor.mathOverlays.getConfig().showBorders,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathOverlays.toggleBorders(value)
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-result-panels`,
        label: "Show Result Panels",
        getValue: (editor: InteractiveInkEditor) => editor.mathOverlays.getConfig().showResultPanels,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathOverlays.toggleResultPanels(value)
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-highlight-on-hover`,
        label: "Highlight on Hover",
        getValue: (editor: InteractiveInkEditor) => editor.mathInteractions.getConfig().highlightOnHover,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathInteractions.updateConfig({ highlightOnHover: value })
          if (!value) {
            editor.mathInteractions.clearAll()
          }
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-highlight-on-select`,
        label: "Highlight on Select",
        getValue: (editor: InteractiveInkEditor) => editor.mathInteractions.getConfig().highlightOnSelect,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathInteractions.updateConfig({ highlightOnSelect: value })
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-dependency-arrows`,
        label: "Show Dependency Arrows",
        getValue: (editor: InteractiveInkEditor) => editor.mathInteractions.getConfig().showDependencyArrows,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathInteractions.toggleDependencyArrows(value)
        }
      }
    ]

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-math-dependencies`,
      label: "Math",
      menuTitle: "Math",
      icon: mathIcon,
      position: "right-top",
      items: items
    }

    super(config, editor)
  }
}
