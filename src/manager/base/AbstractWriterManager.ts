import { LoggerCategory, LoggerManager } from "@/logger"
import type
{
  TSymbol,
  TPointer,
} from "@/symbol"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TPointerInfo } from "@/grabber";
import { PointerEventGrabber } from "@/grabber"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { InkEditor } from "@/editor/variants/InkEditor"


/**
 * @group Manager
 */
export abstract class AbstractWriterManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: TInteractiveInkEditor | InkEditor
  currentSymbol?: TSymbol

  detectGesture: boolean = true

  constructor(editor: TInteractiveInkEditor | InkEditor)
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

  protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol
  protected abstract updateCurrentSymbol(pointer: TPointer): TSymbol

  start(info: TPointerInfo): void
  {
    this.#logger.info("startWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  continue(info: TPointerInfo): void
  {
    this.#logger.info("continueWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  abstract end(info: TPointerInfo): Promise<void>
}
