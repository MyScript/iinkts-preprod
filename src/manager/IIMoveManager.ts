import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { SVGRenderer } from "../renderer"

/**
 * @group Manager
 */
export class IIMoveManager
{
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor

  origin?: {
    left: number,
    top: number,
    x: number,
    y: number
  }

  constructor(editor: InteractiveInkEditor)
  {
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
    this.origin = {
      left: this.renderer.parent.scrollLeft,
      top: this.renderer.parent.scrollTop,
      x: info.clientX,
      y: info.clientY,
    }
  }

  continue(info: PointerInfo): void
  {
    if (!this.origin) {
      throw new Error("Can't move cause origin is undefined")
    }
    const dx = info.clientX - this.origin.x
    const dy = info.clientY - this.origin.y

    this.renderer.parent.scrollTop = this.origin.top - dy
    this.renderer.parent.scrollLeft = this.origin.left - dx
  }

  end(info: PointerInfo): void
  {
    this.continue(info)
    this.origin = undefined
  }
}
