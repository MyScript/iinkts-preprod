import downloadIcon from "@/assets/svg/download.svg"
import uploadIcon from "@/assets/svg/upload.svg"
import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** Downloads the session under `name`, by default the first words of the document, and says so */
async function saveSession(canvas: TInteractiveInkCanvas, name: string): Promise<void> {
  // Known here, not left to download(): the confirmation names the file
  const filename = name || (await canvas.session.suggestedFileName())
  await canvas.download("session", { filename })
  canvas.layers.showMessageInfo({ message: filename ? `Session saved: ${filename}.iinkts` : "Session saved" })
}

async function openSession(canvas: TInteractiveInkCanvas, file: File): Promise<void> {
  try {
    // Restored as it was, the content coming back is the confirmation; only a recognition starting
    // over needs telling
    if ((await canvas.session.restore(file)) === "replayed") {
      canvas.layers.showMessageInfo({ message: "Session restored, its strokes are recognized again" })
    }
  } catch (error) {
    canvas.manageError(error instanceof Error ? error : new Error(String(error)))
  }
}

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
          type: "textinput",
          id: `${idPrefix}-session-save`,
          icon: downloadIcon,
          title: "Save to a file",
          hint: "Content and recognition, to resume later",
          placeholder: "File name",
          buttonLabel: "Download .iinkts",
          // The first words of the document; an empty field keeps the default name
          value: (c) => c.session.suggestedFileName(),
          action: saveSession,
        },
        {
          type: "fileinput",
          id: `${idPrefix}-session-open`,
          icon: uploadIcon,
          title: "Open a file",
          hint: "Replaces the current content",
          accept: ".iinkts",
          multiple: false,
          buttonLabel: "Open session",
          action: (c, files) => openSession(c, files[0]),
        },
      ],
    }
    super(config, canvas)
  }
}
