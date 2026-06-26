import { LoggerCategory, LoggerManager } from "@/logger"
import { TEraser, TPoint, TSegment, TBox, isText } from "@/symbol"
import { BoxHelper } from "@/symbol/helpers/BoxHelper"
import { IIEraserHelper } from "@/symbol/helpers/IIEraserHelper"
import { SVGRenderer } from "@/renderer"
import { PointerEventGrabber, PointerInfo } from "@/grabber"
import { computeDistanceBetweenPointAndSegment, computeDistanceSquared } from "@/utils"
import type { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import type { InkEditor } from "@/editor/variants/InkEditor"

/**
 * @group Manager
 */
type THittable = { bounds: TBox; vertices: TPoint[]; edges: TSegment[] }

/**
 * @group Manager
 */
export class EraseManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor | InkEditor

  eraserWidth = 5
  currentEraser?: TEraser
  charsToDelete: Map<string, Set<string>> = new Map()

  #isInteractiveInkEditor(editor: InteractiveInkEditor | InkEditor): editor is InteractiveInkEditor
  {
    return "removeSymbols" in editor && typeof editor.removeSymbols === "function"
  }

  #isHitByPoint(symbol: THittable, point: TPoint, radius: number): boolean
  {
    const { x, y, width, height } = symbol.bounds
    const expanded = { x: x - radius, y: y - radius, width: width + 2 * radius, height: height + 2 * radius }
    if (!BoxHelper.containsPoint(expanded, point)) return false
    const edges = symbol.edges
    if (edges.length === 0) {
      const squaredRadius = radius * radius
      return symbol.vertices.some(v => computeDistanceSquared(point, v) <= squaredRadius)
    }
    return edges.some(edge => computeDistanceBetweenPointAndSegment(point, edge) < radius)
  }

  constructor(editor: InteractiveInkEditor | InkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  attach(layer: HTMLElement): void
  {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void
  {
    this.grabber.detach()
  }

  start(info: PointerInfo): void
  {
    this.#logger.info("startErase", { info })
    this.currentEraser = IIEraserHelper.create(this.eraserWidth)
    this.currentEraser.pointers.push(info.pointer)
    this.charsToDelete.clear()
    this.renderer.drawSymbol(this.currentEraser!)
  }

  continue(info: PointerInfo): void
  {
    this.#logger.info("continueErase", { info })
    if (!this.currentEraser) {
      throw new Error("Can't update current eraser because currentEraser is undefined")
    }
    this.currentEraser.pointers.push(info.pointer)
    this.renderer.drawSymbol(this.currentEraser)
    const currentPoint = info.pointer
    const radius = (this.currentEraser.style.width as number) / 2
    if (this.#isInteractiveInkEditor(this.editor)) {
      this.editor.model.symbols.forEach(s =>
      {
        if (isText(s)) {
          let hasHitChar = false
          s.chars.forEach(char => {
            const { x, y, width, height } = char.bounds
            const expanded = { x: x - radius, y: y - radius, width: width + 2 * radius, height: height + 2 * radius }
            if (BoxHelper.containsPoint(expanded, currentPoint)) {
              if (!this.charsToDelete.has(s.id)) {
                this.charsToDelete.set(s.id, new Set())
              }
              this.charsToDelete.get(s.id)!.add(char.id)
              hasHitChar = true
            }
          })
          if (hasHitChar) {
            s.deleting = true
            this.renderer.drawSymbol(s)
          }
        }
        else if (this.#isHitByPoint(s, currentPoint, radius)) {
          s.deleting = true
          this.renderer.drawSymbol(s)
        }
      })
    }
    else {
      this.editor.model.strokes.forEach(s =>
      {
        if (this.#isHitByPoint(s, currentPoint, radius)) {
          s.deleting = true
          this.renderer.drawSymbol(s)
        }
      })
    }
  }

  async end(info: PointerInfo): Promise<void>
  {
    this.#logger.info("finishErasing", { info })
    this.continue(info)

    this.renderer.removeSymbol(this.currentEraser!.id)
    if (this.#isInteractiveInkEditor(this.editor)) {
      const editor = this.editor as InteractiveInkEditor
      const symbolsToRemove: string[] = []

      editor.model.symbols.forEach(s => {
        if (isText(s) && this.charsToDelete.has(s.id)) {
          const charIdsToDelete = this.charsToDelete.get(s.id)!
          const remainingChars = s.chars.filter(char => !charIdsToDelete.has(char.id))

          if (remainingChars.length === 0) {
            // All chars deleted, remove the symbol
            symbolsToRemove.push(s.id)
          } else {
            // Some chars deleted, update the symbol directly
            s.chars = remainingChars
            editor.typeset.setBounds(s)
            this.renderer.drawSymbol(s)
          }
        } else if (s.deleting) {
          // For other symbol types, mark for deletion if deleting flag is set
          symbolsToRemove.push(s.id)
        }
      })

      // Remove complete symbols
      if (symbolsToRemove.length > 0) {
        await editor.removeSymbols(symbolsToRemove)
      }

      this.charsToDelete.clear()
    }
    else {
      this.editor.removeStrokes(this.editor.model.strokesToDelete.map(s => s.id))
    }
    this.currentEraser = undefined
  }
}
