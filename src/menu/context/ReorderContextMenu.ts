import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TContextReorderItemsConfig = {
  front?: boolean
  forward?: boolean
  backward?: boolean
  back?: boolean
}
/** @group Menu */
export type TContextReorderConfig = boolean | TContextReorderItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
export class ReorderContextMenu extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context", itemsConfig?: TContextReorderItemsConfig) {
    const enabled = (key: keyof TContextReorderItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      id: `${idPrefix}-reorder`,
      type: "submenu",
      label: canvas.i18n.t("menu.context.reorder"),
      position: "right",
      items: [],
    }

    if (enabled("front")) {
      config.items.push({
        id: `${idPrefix}-reorder-first`,
        type: "button",
        label: canvas.i18n.t("menu.context.reorder.bringToFront"),
        action: () => {
          canvas.changeOrderSymbols(canvas.model.symbolsSelected, "last")
          canvas.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("forward")) {
      config.items.push({
        id: `${idPrefix}-reorder-forward`,
        type: "button",
        label: canvas.i18n.t("menu.context.reorder.bringForward"),
        action: () => {
          canvas.changeOrderSymbols(canvas.model.symbolsSelected, "forward")
          canvas.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("backward")) {
      config.items.push({
        id: `${idPrefix}-reorder-backward`,
        type: "button",
        label: canvas.i18n.t("menu.context.reorder.sendBackward"),
        action: () => {
          canvas.changeOrderSymbols(canvas.model.symbolsSelected, "backward")
          canvas.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("back")) {
      config.items.push({
        id: `${idPrefix}-reorder-last`,
        type: "button",
        label: canvas.i18n.t("menu.context.reorder.sendToBack"),
        action: () => {
          canvas.changeOrderSymbols(canvas.model.symbolsSelected.slice().reverse(), "first")
          canvas.selector.redrawSelectedGroup()
        },
      })
    }

    super(config, canvas)
  }
}
