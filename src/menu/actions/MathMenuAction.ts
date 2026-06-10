import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import { IMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import { IMenuSelect } from "@/menu/items/SelectMenuItem"
import { IMenuButton } from "@/menu/items/ButtonMenuItem"
import { IIMathCapabilitiesTable } from "@/components"
import mathIcon from "@/assets/svg/linear-double-arrow.svg"

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const items: (IMenuCheckbox | IMenuSelect | IMenuButton)[] = [
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-block-overlays`,
        label: "Show Block Overlays (∑)",
        getValue: (editor: InteractiveInkEditor) => editor.math.getOverlaysConfig().showBlockOverlays,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.math.toggleBlockOverlays(value)
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-draw-result-strokes`,
        label: "Draw result as strokes",
        getValue: (editor: InteractiveInkEditor) => editor.drawComputationResult,
        setValue: async (editor: InteractiveInkEditor, value: boolean) => {
          editor.drawComputationResult = value

          if (!value) {
            await editor.math.clearAllSolverOutputs()
          } else {
            await editor.math.computeAllNumericalResults()
          }

          // Show result panels when not drawing strokes
          editor.math.updateOverlaysConfig({ showResultPanels: !value })
        }
      }
    ]
    if (editor.configuration.recognition.math?.solver?.["auto-variable-management"]?.enable) {
      items.push(
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-dependency-on-hover`,
        label: "Show Dependencies on Hover",
        getValue: (editor: InteractiveInkEditor) => editor.math.getVariablesConfig().showDependencyOnHover,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.math.updateVariablesConfig({ showDependencyOnHover: value })
          if (!value) {
            editor.math.clearVariableInteractions()
          }
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-highlight-on-select`,
        label: "Highlight on Select",
        getValue: (editor: InteractiveInkEditor) => editor.math.getVariablesConfig().highlightOnSelect,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.math.updateVariablesConfig({ highlightOnSelect: value })
        }
      })
    }

    // Add button to show capabilities overview
    items.push({
      type: "button",
      id: `${idPrefix}-math-capabilities-overview`,
      label: "Show Math Capabilities Overview",
      action: async (editor: InteractiveInkEditor) => {
        const capabilitiesTable = new IIMathCapabilitiesTable(editor)
        await capabilitiesTable.show()
      }
    })

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
