import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPartialDeep } from "@/core"
import { readBlobAsText } from "@/dom"
import type { TSymbol } from "@/symbol"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"
/**
 * @group Menu
 * @remarks Menu action Import - Import de fichiers JSON
 */
export class ImportMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-import`,
      label: canvas.i18n.t("menu.action.import"),
      menuTitle: canvas.i18n.t("menu.action.import"),
      position: "right-top",
      items: [
        {
          type: "fileinput",
          id: `${idPrefix}-import-file`,
          label: canvas.i18n.t("menu.action.import"),
          accept: ".json",
          multiple: false,
          buttonLabel: canvas.i18n.t("menu.action.import"),
          action: async (canvas, files) => {
            if (files.length) {
              const fileString = await readBlobAsText(files[0])
              const symbols = JSON.parse(fileString) as TPartialDeep<TSymbol>[]
              await canvas.createSymbols(symbols)
            }
          },
        },
      ],
    }

    super(config, canvas)
  }
}
