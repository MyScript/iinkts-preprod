import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import { IMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import { IMenuSelect } from "@/menu/items/SelectMenuItem"
import { IMenuButton } from "@/menu/items/ButtonMenuItem"
import { isRecognizedMath } from "@/symbol"
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
        getValue: (editor: InteractiveInkEditor) => editor.mathOverlays.getConfig().showBlockOverlays,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathOverlays.toggleBlockOverlays(value)
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-math-draw-result-strokes`,
        label: "Draw result as strokes",
        getValue: (editor: InteractiveInkEditor) => editor.drawComputationResult,
        setValue: async (editor: InteractiveInkEditor, value: boolean) => {
          const oldMode = editor.drawComputationResult
          editor.drawComputationResult = value

          if (!value && oldMode) {
            // If switching from drawing strokes to not drawing, clear existing solver strokes
            const mathSymbols = editor.model.symbols.filter(isRecognizedMath)
            for (const mathSymbol of mathSymbols) {
              await editor.clearSolverOutputStrokes(mathSymbol)
            }
          }

          // Show result panels when not drawing strokes
          editor.mathOverlays.updateConfig({ showResultPanels: !value })
        }
      }
    ]
    if (editor.configuration.recognition.math?.solver?.["auto-variable-management"]?.enable) {
      items.push(
      {
        type: "checkbox",
        id: `${idPrefix}-math-show-dependency-on-hover`,
        label: "Show Dependencies on Hover",
        getValue: (editor: InteractiveInkEditor) => editor.mathInteractions.getConfig().showDependencyOnHover,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.mathInteractions.updateConfig({ showDependencyOnHover: value })
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
