import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import type { TGesture } from "iink-ts"
import { boxContains, isFreeDraw, sceneBox } from "./FreeDrawStroke"
import { updateScene } from "./Scene"

/**
 * The stroke widths Excalidraw offers: thin, bold, extra bold
 */
const STROKE_WIDTHS = [1, 2, 4]

const nextStrokeWidth = (width: number): number =>
  STROKE_WIDTHS.find(w => w > width) ?? STROKE_WIDTHS[STROKE_WIDTHS.length - 1]

/**
 * Applies what the recognizer detected. INSERT and JOIN have no meaning on free strokes and are ignored
 */
export class GestureManager
{
  constructor(private readonly api: ExcalidrawImperativeAPI) { }

  private erase(gesture: TGesture): void
  {
    if (!gesture.strokeIds.length) return
    updateScene(this.api, { erase: [gesture.gestureStrokeId, ...gesture.strokeIds] })
  }

  private surround(gesture: TGesture): void
  {
    const elements = this.api.getSceneElements()
    const gestureElement = elements.find(e => e.id === gesture.gestureStrokeId)
    if (!gestureElement) return
    const gestureBox = sceneBox(gestureElement)
    const surrounded = elements.filter(e => e.id !== gestureElement.id && boxContains(gestureBox, sceneBox(e)))
    if (!surrounded.length) return
    this.api.setActiveTool({ type: "selection" })
    updateScene(this.api, { erase: [gestureElement.id], selectedIds: surrounded.map(e => e.id) })
  }

  private underline(gesture: TGesture): void
  {
    const ids = new Set(gesture.strokeIds)
    const underlined = this.api.getSceneElements().filter(isFreeDraw).filter(e => ids.has(e.id))
    if (!underlined.length) return
    updateScene(this.api, {
      erase: [gesture.gestureStrokeId],
      strokeWidths: new Map(underlined.map(e => [e.id, nextStrokeWidth(e.strokeWidth)])),
    })
  }

  apply(gesture: TGesture): void
  {
    switch (gesture.gestureType) {
      case "SCRATCH":
      case "STRIKETHROUGH":
        return this.erase(gesture)
      case "SURROUND":
        return this.surround(gesture)
      case "UNDERLINE":
        return this.underline(gesture)
      default:
        return
    }
  }
}
