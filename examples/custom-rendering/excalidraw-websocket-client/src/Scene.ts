import { CaptureUpdateAction, newElementWith } from "@excalidraw/excalidraw"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { AppState, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"

type TSceneUpdate = {
  erase?: Iterable<string>
  strokeWidths?: Map<string, number>
  add?: readonly ExcalidrawElement[]
  selectedIds?: string[]
}

const toSelection = (ids: string[]): AppState["selectedElementIds"] =>
  Object.fromEntries(ids.map(id => [id, true as const]))

/**
 * One scene update, so that one gesture or one conversion is one undo step
 */
export const updateScene = (api: ExcalidrawImperativeAPI, update: TSceneUpdate): void =>
{
  const erase = new Set(update.erase)
  const elements = api.getSceneElementsIncludingDeleted().map(e =>
  {
    if (erase.has(e.id)) return newElementWith(e, { isDeleted: true })
    const strokeWidth = update.strokeWidths?.get(e.id)
    return strokeWidth === undefined ? e : newElementWith(e, { strokeWidth })
  })
  api.updateScene({
    elements: [...elements, ...(update.add ?? [])],
    appState: update.selectedIds ? { selectedElementIds: toSelection(update.selectedIds) } : undefined,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  })
}
