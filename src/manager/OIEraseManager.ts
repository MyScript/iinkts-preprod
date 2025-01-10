import { LoggerCategory, LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIEraser, TPointer, TSegment } from "../symbol"
import { OISVGRenderer } from "../renderer"
import { EditorOffscreen } from "../editor/EditorOffscreen"

/**
 * @group Manager
 */
export class OIEraseManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  editor: EditorOffscreen

  currentEraser?: OIEraser

  constructor(editor: EditorOffscreen)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): OIModel
  {
    return this.editor.model
  }

  get renderer(): OISVGRenderer
  {
    return this.editor.renderer
  }

  start(pointer: TPointer): void
  {
    this.#logger.info("startErase", { pointer })
    this.currentEraser = new OIEraser()
    this.currentEraser.pointers.push(pointer)
    this.renderer.drawSymbol(this.currentEraser!)
  }

  continue(pointer: TPointer): void
  {
    this.#logger.info("continueErase", { pointer })
    if (!this.currentEraser) {
      throw new Error("Can't update current eraser because currentEraser is undefined")
    }
    this.currentEraser.pointers.push(pointer)
    this.renderer.drawSymbol(this.currentEraser)
    const lastSeg: TSegment = {
      p1: this.currentEraser.pointers.at(-1)!,
      p2: this.currentEraser.pointers.at(-2)!
    }
    this.model.symbols.forEach(s => {
      if (s.isIntersected(lastSeg))
      {
        s.deleting = true
      }
    })
    this.model.symbolsToDelete.map(s => this.renderer.drawSymbol(s))
  }

  async end(pointer: TPointer): Promise<void>
  {
    this.#logger.info("finishErasing", { pointer })
    this.continue(pointer)

    this.renderer.removeSymbol(this.currentEraser!.id)
    this.currentEraser = undefined
    this.editor.removeSymbols(this.model.symbolsToDelete.map(s => s.id))
  }
}
