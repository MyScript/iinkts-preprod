import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { IMenuCheckbox } from "../items/CheckboxMenuItem"
import { IMenuSelect } from "../items/SelectMenuItem"
import { isMathSymbol } from "../../symbol"
import mathIcon from "../../assets/svg/linear-double-arrow.svg"

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const items: (IMenuCheckbox | IMenuSelect)[] = [
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
        type: "select",
        id: `${idPrefix}-math-computation-mode`,
        label: "Computation result:",
        options: [
          { label: "Draw strokes", value: "strokes-only" },
          { label: "Show in panel", value: "value-only" },
          { label: "Both", value: "both" }
        ],
        getValue: (editor: InteractiveInkEditor) => editor.mathComputationMode,
        setValue: async (editor: InteractiveInkEditor, value: string) => {
          const oldMode = editor.mathComputationMode
          editor.mathComputationMode = value as "strokes-only" | "value-only" | "both"

          if (value === "value-only" && oldMode !== "value-only") {
            const mathSymbols = editor.model.symbols.filter(isMathSymbol)
            for (const mathSymbol of mathSymbols) {
              await editor.clearSolverOutputStrokes(mathSymbol)
            }
          }

          if (value === "value-only" || value === "both") {
            editor.mathOverlays.updateConfig({ showResultPanels: true })
          }
        }
      },
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
