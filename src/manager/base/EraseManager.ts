import { LoggerCategory, LoggerManager } from "../../logger"
import { IIEraser, TSegment, SymbolType, IIRecognizedText, IIText, Box, RecognizedKind } from "../../symbol"
import { SVGRenderer } from "../../renderer"
import { PointerEventGrabber, PointerInfo } from "../../grabber"
import { findIntersectionBetween2Segment } from "../../utils"
import type { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import type { InkEditor } from "../../editor/InkEditor"

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
        if (s.type === SymbolType.Recognized) {
          // For recognized symbols, mark only intersected strokes as deleting
          const recognized = s as IIRecognizedText
          let hasIntersectedStroke = false
          recognized.strokes.forEach(stroke => {
            if (stroke.isIntersected(lastSeg)) {
              stroke.deleting = true
              hasIntersectedStroke = true
            }
          })
          if (hasIntersectedStroke) {
            this.renderer.drawSymbol(s)
          }
        }
        else if (s.type === SymbolType.Text) {
          // For text symbols, mark only intersected characters
          const text = s as IIText
          let hasIntersectedChar = false
          text.chars.forEach(char => {
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
        if (s.type === SymbolType.Recognized) {
          const strokeIdsToDelete = s.strokes
            .filter(stroke => stroke.deleting)
            .map(stroke => stroke.id)

          if (strokeIdsToDelete.length > 0) {
            if (strokeIdsToDelete.length === s.strokes.length) {
              // All strokes deleted, remove the entire symbol
              symbolsToRemove.push(s.id)
            } else {
              // Partial deletion: collect stroke IDs to delete
              strokeIdsToDelete.forEach(id => allStrokeIdsToDelete.push(id))
              // Clean up solverOutputStrokeIds for math symbols
              if (s.kind === RecognizedKind.Math) {
                if (s.solverOutputStrokeIds && s.solverOutputStrokeIds.length > 0) {
                  // Remove deleted stroke IDs from solverOutputStrokeIds
                  const updatedSolverIds = s.solverOutputStrokeIds.filter(
                    id => !strokeIdsToDelete.includes(id)
                  )
                  // Update or clear the property
                  s.solverOutputStrokeIds = updatedSolverIds.length > 0 ? updatedSolverIds : undefined
                }
              }
            }
          }
        } else if (s.type === SymbolType.Text && this.charsToDelete.has(s.id)) {
          const text = s as IIText
          const charIdsToDelete = this.charsToDelete.get(s.id)!
          const remainingChars = text.chars.filter(char => !charIdsToDelete.has(char.id))

          if (remainingChars.length === 0) {
            // All chars deleted, remove the symbol
            symbolsToRemove.push(s.id)
          } else {
            // Some chars deleted, update the symbol directly
            text.chars = remainingChars
            editor.texter.setBounds(text)
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
        await editor.synchronizeStrokesWithJIIX()
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
