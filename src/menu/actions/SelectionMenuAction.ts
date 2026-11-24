import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

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
export class SelectionMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TSelectionActionItemsConfig) {
    const enabled = (key: keyof TSelectionActionItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-selection`,
      label: canvas.i18n.t("menu.action.selection"),
      menuTitle: canvas.i18n.t("menu.action.selection"),
      position: "right-top",
      items: [],
    }

    if (enabled("text") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("text")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-selection-text-level`,
        label: canvas.i18n.t("menu.action.selection.text"),
        options: [
          { label: canvas.i18n.t("common.element"), value: "element" },
          { label: canvas.i18n.t("menu.action.selection.word"), value: "word" },
          { label: canvas.i18n.t("menu.action.selection.character"), value: "char" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.selection.textLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.selection.textLevel = value as "element" | "word" | "char"
        },
      })
    }

    if (enabled("math") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("math")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-selection-math-level`,
        label: canvas.i18n.t("menu.action.selection.math"),
        options: [
          { label: canvas.i18n.t("common.element"), value: "element" },
          { label: canvas.i18n.t("menu.action.selection.operand"), value: "operand" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.selection.mathLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.selection.mathLevel = value as "element" | "operand"
        },
      })
    }

    if (enabled("shape") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("shape")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-selection-shape-level`,
        label: canvas.i18n.t("menu.action.selection.shape"),
        options: [
          { label: canvas.i18n.t("common.element"), value: "element" },
          { label: canvas.i18n.t("menu.action.selection.stroke"), value: "stroke" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.selection.shapeLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.selection.shapeLevel = value as "element" | "stroke"
        },
      })
    }

    super(config, canvas)
  }
}
