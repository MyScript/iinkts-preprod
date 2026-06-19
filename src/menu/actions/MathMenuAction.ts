import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import { IMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import { IMenuSelect } from "@/menu/items/SelectMenuItem"
import { IMenuButton } from "@/menu/items/ButtonMenuItem"
import { IIMathCapabilitiesTable, IIMathVariableEditor } from "@/components"
import { TMathResultMode } from "@/manager/interactive/math"

/** @group Menu */
export type TMathActionItemsConfig = {
  autoCompute?: boolean
  resultMode?: boolean
  showDependencies?: boolean
  highlightOnSelect?: boolean
  editVariables?: boolean
  capabilities?: boolean
}
/** @group Menu */
export type TMathActionConfig = boolean | TMathActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action", itemsConfig?: TMathActionItemsConfig)
  {
    const enabled = (key: keyof TMathActionItemsConfig) => itemsConfig?.[key] !== false

    const items: (IMenuCheckbox | IMenuSelect | IMenuButton)[] = []

    if (enabled("autoCompute")) {
      items.push({
        type: "checkbox",
        id: `${idPrefix}-math-auto-compute`,
        label: "Auto-compute",
        getValue: (editor: InteractiveInkEditor) => editor.math.getComputationConfig().autoCompute,
        setValue: async (editor: InteractiveInkEditor, value: boolean) => {
          editor.math.updateComputationConfig({ autoCompute: value })
          if (value) {
            await editor.math.tryAutoCompute()
          }
        }
      })
    }

    if (enabled("resultMode")) {
      items.push({
        type: "select",
        id: `${idPrefix}-math-result-mode`,
        label: "Result mode",
        options: [
          { label: "Draw result", value: "draw" },
          { label: "Show result", value: "ghost" },
        ],
        getValue: (editor: InteractiveInkEditor) => editor.math.getComputationConfig().resultMode,
        setValue: async (editor: InteractiveInkEditor, value: string) => {
          const mode = value as TMathResultMode
          editor.math.updateComputationConfig({ resultMode: mode })
          await editor.math.clearAllSolverOutputs()

          if (mode === "draw") {
            await editor.math.computeAllNumericalResults()
          }
        }
      })
    }

    if (editor.configuration.recognition.math?.solver?.["auto-variable-management"]?.enable) {
      if (enabled("showDependencies")) {
        items.push({
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
        })
      }

      if (enabled("highlightOnSelect")) {
        items.push({
          type: "checkbox",
          id: `${idPrefix}-math-highlight-on-select`,
          label: "Highlight on Select",
          getValue: (editor: InteractiveInkEditor) => editor.math.getVariablesConfig().highlightOnSelect,
          setValue: (editor: InteractiveInkEditor, value: boolean) => {
            editor.math.updateVariablesConfig({ highlightOnSelect: value })
          }
        })
      }
    }

    if (enabled("editVariables")) {
      items.push({
        type: "button",
        id: `${idPrefix}-math-variables`,
        label: "Edit Variables",
        action: async (editor: InteractiveInkEditor) => {
          const variableEditor = new IIMathVariableEditor(editor)
          await variableEditor.show()
        }
      })
    }

    if (enabled("capabilities")) {
      items.push({
        type: "button",
        id: `${idPrefix}-math-capabilities-overview`,
        label: "Show Math Capabilities Overview",
        action: async (editor: InteractiveInkEditor) => {
          const capabilitiesTable = new IIMathCapabilitiesTable(editor)
          await capabilitiesTable.show()
        }
      })
    }

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-math`,
      label: "Math (∑)",
      menuTitle: "Math (∑)",
      position: "right-top",
      items: items
    }

    super(config, editor)
  }
}
