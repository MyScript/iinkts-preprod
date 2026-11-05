import { convertToExcalidrawElements } from "@excalidraw/excalidraw"
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform"
import type { ExcalidrawElement, ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types"
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"
import type { TGesture, TGestureType, TRecognitionStroke, TWebSocketClientMessageContextlessGesture, WebSocketClient } from "iink-ts"
import { boxContains, boxOverlaps, expandBox, isFreeDraw, isText, sceneBox, TBox } from "./FreeDrawStroke"
import { TElementPatch, updateScene } from "./Scene"

/**
 * The stroke widths Excalidraw offers: thin, bold, extra bold
 */
const STROKE_WIDTHS = [1, 2, 4]

/**
 * How close to a converted text a stroke must end to be checked as a gesture on it
 */
const CONVERTED_TEXT_MARGIN_PX = 10

const UNDERLINE_WIDTH = 2

const nextStrokeWidth = (width: number): number =>
  STROKE_WIDTHS.find(w => w > width) ?? STROKE_WIDTHS[STROKE_WIDTHS.length - 1]

const center = (box: TBox) => ({ x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 })

const isBetween = (value: number, min: number, max: number): boolean => value >= min && value <= max

/**
 * A horizontal gesture under a text, from its middle to below it, underlines it; through its
 * middle, strikes it through. Same bands as the iinkTS interactive canvas
 */
const isCrossedAt = (gestureBox: TBox, text: TBox, from: number, to: number): boolean =>
{
  const textCenter = center(text)
  const height = text.maxY - text.minY
  return isBetween(textCenter.x, gestureBox.minX, gestureBox.maxX)
    && isBetween(center(gestureBox).y, textCenter.y + height * from, textCenter.y + height * to)
}

const toGesture = (gestureType: TGestureType, gestureStrokeId: string, strokeIds: string[]): TGesture =>
  ({ gestureType, gestureStrokeId, strokeIds, strokeBeforeIds: [], strokeAfterIds: [] })

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

  /**
   * A text has no stroke width: it gets a straight line under it, grouped with it so they move together.
   * The group id comes from the text id: crypto.randomUUID only exists on a secure origin (https or localhost)
   */
  private underlineText(text: ExcalidrawTextElement, patches: Map<string, TElementPatch>): ExcalidrawElementSkeleton
  {
    const groupIds = text.groupIds.length ? text.groupIds : [`underline-${ text.id }`]
    if (!text.groupIds.length) patches.set(text.id, { groupIds })
    return {
      type: "line",
      x: text.x,
      y: text.y + text.height,
      points: [[0, 0], [text.width, 0]],
      strokeColor: text.strokeColor,
      strokeWidth: UNDERLINE_WIDTH,
      opacity: text.opacity,
      groupIds: [...groupIds],
    }
  }

  private underline(gesture: TGesture): void
  {
    const ids = new Set(gesture.strokeIds)
    const underlined = this.api.getSceneElements().filter(e => ids.has(e.id))
    const patches = new Map<string, TElementPatch>(
      underlined.filter(isFreeDraw).map(e => [e.id, { strokeWidth: nextStrokeWidth(e.strokeWidth) }])
    )
    const lines = underlined.filter(isText).map(t => this.underlineText(t, patches))
    if (!patches.size && !lines.length) return
    updateScene(this.api, { erase: [gesture.gestureStrokeId], patches, add: convertToExcalidrawElements(lines) })
  }

  private textsNear(gestureBox: TBox): ExcalidrawTextElement[]
  {
    const area = expandBox(gestureBox, CONVERTED_TEXT_MARGIN_PX)
    return this.api.getSceneElements().filter(isText).filter(t => boxOverlaps(area, sceneBox(t)))
  }

  private horizontalGesture(gestureId: string, gestureBox: TBox, texts: ExcalidrawTextElement[]): TGesture | undefined
  {
    const underlined = texts.filter(t => isCrossedAt(gestureBox, sceneBox(t), 1 / 4, 3 / 4))
    if (underlined.length) return toGesture("UNDERLINE", gestureId, underlined.map(t => t.id))
    const struck = texts.filter(t => isCrossedAt(gestureBox, sceneBox(t), -1 / 4, 1 / 4))
    if (struck.length) return toGesture("STRIKETHROUGH", gestureId, struck.map(t => t.id))
  }

  private surroundGesture(gestureId: string, gestureBox: TBox, elements: readonly ExcalidrawElement[]): TGesture | undefined
  {
    const hasSurrounded = elements.some(e => e.id !== gestureId && boxContains(gestureBox, sceneBox(e)))
    return hasSurrounded ? toGesture("SURROUND", gestureId, []) : undefined
  }

  /**
   * Turns the shape the server saw into a gesture on the converted texts it touches
   */
  private toTextGesture(answer: TWebSocketClientMessageContextlessGesture, gestureBox: TBox, texts: ExcalidrawTextElement[]): TGesture | undefined
  {
    const gestureId = answer.strokeId
    switch (answer.gestureType) {
      case "surround":
        return this.surroundGesture(gestureId, gestureBox, this.api.getSceneElements())
      case "left-right":
      case "right-left":
        return this.horizontalGesture(gestureId, gestureBox, texts)
      case "scratch": {
        const scratched = texts.filter(t => boxOverlaps(gestureBox, sceneBox(t)))
        return scratched.length ? toGesture("SCRATCH", gestureId, scratched.map(t => t.id)) : undefined
      }
      default:
        return
    }
  }

  /**
   * A converted text has no strokes on the server, which therefore cannot see a gesture drawn on it:
   * a stroke ending near one is first classified on its own shape, the way the iinkTS interactive
   * canvas does for its converted symbols. Resolves whether the stroke was applied as a gesture
   */
  async applyOnConvertedText(client: WebSocketClient, stroke: TRecognitionStroke): Promise<boolean>
  {
    const gestureElement = this.api.getSceneElements().find(e => e.id === stroke.id)
    if (!gestureElement) return false
    const gestureBox = sceneBox(gestureElement)
    const texts = this.textsNear(gestureBox)
    if (!texts.length) return false
    const answer = await client.recognizeGesture(stroke)
    const gesture = answer && this.toTextGesture(answer, gestureBox, texts)
    if (!gesture) return false
    this.apply(gesture)
    return true
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
