import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu action Session - save the session as a `.iinkts` file, open one to resume it
 */
export class SessionMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-session`,
      label: "Session",
      menuTitle: "Session",
      position: "right-top",
      items: [
        {
          type: "button",
          id: `${idPrefix}-session-save`,
          label: "Save",
          action: (c) => c.download("session"),
        },
        {
          type: "fileinput",
          id: `${idPrefix}-session-open`,
          label: "Open",
          accept: ".iinkts",
          multiple: false,
          buttonLabel: "Open",
          action: async (c, files) => {
            try {
              await c.session.restore(files[0])
            } catch (error) {
              c.manageError(error instanceof Error ? error : new Error(String(error)))
            }
          },
        },
      ],
    }
    super(config, canvas)
  }
}
