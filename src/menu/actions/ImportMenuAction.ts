import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPartialDeep } from "@/core"
import { readBlobAsText } from "@/dom"
import type { TSymbol } from "@/symbol"
import { IMAGE_MIME_TYPES, ImageUtil } from "@/symbol-utils"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"
/** A picture is put on the canvas; anything else is read as the JSON of a list of symbols */
async function importFile(canvas: TInteractiveInkCanvas, file: File): Promise<void> {
  if (ImageUtil.isSupportedMimeType(file.type)) {
    await canvas.importImage(file)
    return
  }
  const symbols = JSON.parse(await readBlobAsText(file)) as TPartialDeep<TSymbol>[]
  await canvas.createSymbols(symbols)
}

/**
 * @group Menu
 * @remarks Menu action Import: symbols from a JSON file, or a PNG/JPEG picture
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
          hint: canvas.i18n.t("menu.action.import.file"),
          accept: [".json", "application/json", ...IMAGE_MIME_TYPES].join(","),
          multiple: false,
          buttonLabel: canvas.i18n.t("menu.action.import"),
          action: async (canvas, files) => {
            if (files.length) {
              await importFile(canvas, files[0])
            }
          },
        },
      ],
    }

    super(config, canvas)
  }
}
