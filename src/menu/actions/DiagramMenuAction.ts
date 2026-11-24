import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu action Diagram - toggles whether moving/resizing/rotating a connected shape
 * reshapes its anchored edges (raw stroke or converted Line/PolyEdge/Arc) to follow it.
 */
export class DiagramMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-diagram`,
      label: canvas.i18n.t("menu.action.diagram"),
      menuTitle: canvas.i18n.t("menu.action.diagram"),
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-diagram-follow-connected-edges`,
          label: canvas.i18n.t("menu.action.diagram.followEdges"),
          getValue: (canvas) => canvas.connector.connectorConfiguration.followConnectedEdges,
          setValue: (canvas, value) => {
            canvas.connector.connectorConfiguration.followConnectedEdges = value
          },
        },
      ],
    }
    super(config, canvas)
  }
}
