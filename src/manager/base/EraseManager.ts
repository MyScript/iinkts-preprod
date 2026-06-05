import { LoggerCategory, LoggerManager } from "@/logger"
import { IIEraser, TSegment, Box, isText } from "@/symbol"
import { SVGRenderer } from "@/renderer"
import { PointerEventGrabber, PointerInfo } from "@/grabber"
import { findIntersectionBetween2Segment } from "@/utils"
import type { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import type { InkEditor } from "@/editor/variants/InkEditor"

/**
 * @group Manager
 */
function isInteractiveInkEditor(editor: InteractiveInkEditor | InkEditor): editor is InteractiveInkEditor
{
  return "removeSymbols" in editor && typeof editor.removeSymbols === "function"
}

function segmentIntersectsBox(segment: TSegment, box: Box): boolean
{
  // Check if either point is inside the box
  if (Box.containsPoint(box, segment.p1) || Box.containsPoint(box, segment.p2)) {
    return true
  }

  // Check if segment intersects any side of the box
  const sides = Box.getSides(box)
  return sides.some(side => {
    const intersection = findIntersectionBetween2Segment(segment, side)
    return intersection !== null
  })
}

/**
 * @group Manager
 */
export class EraseManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor | InkEditor

  currentEraser?: IIEraser
  charsToDelete: Map<string, Set<string>> = new Map() // Map<symbolId, Set<charId>>

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
    this.currentEraser = new IIEraser()
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
    const lastSeg: TSegment = {
      p1: this.currentEraser.pointers.at(-1)!,
      p2: this.currentEraser.pointers.at(-2)!
    }
    if (isInteractiveInkEditor(this.editor)) {
      this.editor.model.symbols.forEach(s =>
      {
        // Recognized symbols no longer exist - skip this check
        if (isText(s)) {
          // For text symbols, mark only intersected characters
          let hasIntersectedChar = false
          s.chars.forEach(char => {
            const charBox = new Box(char.bounds)
            if (segmentIntersectsBox(lastSeg, charBox)) {
              if (!this.charsToDelete.has(s.id)) {
                this.charsToDelete.set(s.id, new Set())
              }
              this.charsToDelete.get(s.id)!.add(char.id)
              hasIntersectedChar = true
            }
          })
          if (hasIntersectedChar) {
            s.deleting = true
            this.renderer.drawSymbol(s)
          }
        }
        else if (s.isIntersected(lastSeg)) {
          // For other symbols, mark the entire symbol as deleting
          s.deleting = true
          this.renderer.drawSymbol(s)
        }
      })
    }
    else {
      this.editor.model.strokes.forEach(s =>
      {
        if (s.isIntersected(lastSeg)) {
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
    if (isInteractiveInkEditor(this.editor)) {
      const editor = this.editor as InteractiveInkEditor
      const symbolsToRemove: string[] = []
      const allStrokeIdsToDelete: string[] = []

      editor.model.symbols.forEach(s => {
        // Recognized symbols no longer exist - skip this check
        if (isText(s) && this.charsToDelete.has(s.id)) {
          const charIdsToDelete = this.charsToDelete.get(s.id)!
          const remainingChars = s.chars.filter(char => !charIdsToDelete.has(char.id))

          if (remainingChars.length === 0) {
            // All chars deleted, remove the symbol
            symbolsToRemove.push(s.id)
          } else {
            // Some chars deleted, update the symbol directly
            s.chars = remainingChars
            editor.texter.setBounds(s)
            this.renderer.drawSymbol(s)
          }
        } else if (s.deleting) {
          // For other symbol types, mark for deletion if deleting flag is set
          symbolsToRemove.push(s.id)
        }
      })

      // Erase deleted strokes from recognizer and wait for synchronization
      if (allStrokeIdsToDelete.length > 0) {
        await editor.recognizer.eraseStrokes(allStrokeIdsToDelete)
      }

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
