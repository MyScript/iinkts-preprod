import type { InteractiveInkEditor } from "@/editor"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem";
import { SubMenuItem } from "@/menu/items/SubMenuItem"
import type { TMenuSelect } from "@/menu/items/SelectMenuItem"
import frameSelectIcon from "@/assets/svg/frame-select.svg"

/** @group Menu */
export type TSelectionActionItemsConfig = {
  text?: boolean
  math?: boolean
  shape?: boolean
}
/** @group Menu */
export type TSelectionActionConfig = boolean | TSelectionActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action for configuring selection granularity (text, math and shape levels)
 */
export class SelectionMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action", itemsConfig?: TSelectionActionItemsConfig)
  {
    const enabled = (key: keyof TSelectionActionItemsConfig) => itemsConfig?.[key] !== false

    const items: TMenuSelect[] = []

    if (enabled("text") && editor.configuration.recognition["raw-content"].recognition?.types.includes("text")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-text-level`,
        label: "Text selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Word", value: "word" },
          { label: "Character", value: "char" },
        ],
        getValue: (editor: InteractiveInkEditor) => editor.configuration.textSelectionLevel,
        setValue: (editor: InteractiveInkEditor, value: string) => {
          editor.configuration.textSelectionLevel = value as "element" | "word" | "char"
        }
      })
    }

    if (enabled("math") && editor.configuration.recognition["raw-content"].recognition?.types.includes("math")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-math-level`,
        label: "Math selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Operand", value: "operand" },
        ],
        getValue: (editor: InteractiveInkEditor) => editor.configuration.mathSelectionLevel,
        setValue: (editor: InteractiveInkEditor, value: string) => {
          editor.configuration.mathSelectionLevel = value as "element" | "operand"
        }
      })
    }

    if (enabled("shape") && editor.configuration.recognition["raw-content"].recognition?.types.includes("shape")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-shape-level`,
        label: "Shape selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Stroke", value: "stroke" },
        ],
        getValue: (editor: InteractiveInkEditor) => editor.configuration.shapeSelectionLevel,
        setValue: (editor: InteractiveInkEditor, value: string) => {
          editor.configuration.shapeSelectionLevel = value as "element" | "stroke"
        }
      })
    }

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-selection`,
      label: "Selection",
      menuTitle: "Selection",
      icon: frameSelectIcon,
      position: "right-top",
      items
    }

    super(config, editor)
  }
}
