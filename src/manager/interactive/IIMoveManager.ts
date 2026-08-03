import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TPointerInfo } from "@/grabber"
import { PointerEventGrabber } from "@/grabber"
import { LoggerCategory } from "@/logger"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 */
export class IIMoveManager extends IIAbstractManager {
  protected managerName = "IIMoveManager"

  grabber: PointerEventGrabber

  origin?: {
    viewBoxX: number
    viewBoxY: number
    clientX: number
    clientY: number
  }

  #pendingInfo?: TPointerInfo
  #pendingFrame?: number

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MOVE)
    this.grabber = new PointerEventGrabber(canvas.configuration.grabber)
  }

  protected updateViewBox(info: TPointerInfo, redrawGuide: boolean): void {
    if (!this.origin) {
      this.logger.error("Can't move cause origin is undefined")
      return
    }
    const dx = info.clientX - this.origin.clientX
    const dy = info.clientY - this.origin.clientY

    const viewBox = this.renderer.getViewBox()
    const zoom = this.renderer.getZoom()

    const viewBoxDx = -dx / zoom
    const viewBoxDy = -dy / zoom

    this.renderer.setViewBox(
      this.origin.viewBoxX + viewBoxDx,
      this.origin.viewBoxY + viewBoxDy,
      viewBox.width,
      viewBox.height,
      redrawGuide
    )
  }

  /**
   * Coalesces the viewBox update to at most once per animation frame: a fast pan
   * gesture fires many `continue()` calls per frame, each of which would otherwise
   * force a native layout/paint of the whole scene on a canvas that may hold many symbols.
   */
  #scheduleUpdateViewBox(): void {
    if (this.#pendingFrame !== undefined) {
      return
    }
    this.#pendingFrame = requestAnimationFrame(() => {
      this.#pendingFrame = undefined
      if (this.#pendingInfo) {
        this.updateViewBox(this.#pendingInfo, false)
        this.#pendingInfo = undefined
      }
    })
  }

  #cancelScheduledUpdateViewBox(): void {
    if (this.#pendingFrame !== undefined) {
      cancelAnimationFrame(this.#pendingFrame)
      this.#pendingFrame = undefined
    }
    this.#pendingInfo = undefined
  }

  attach(layer: HTMLElement): void {
    this.logger.info("attach", { layer })
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void {
    this.logger.info("detach")
    this.#cancelScheduledUpdateViewBox()
    this.grabber.detach()
  }

  start(info: TPointerInfo): void {
    const viewBox = this.renderer.getViewBox()
    this.origin = {
      viewBoxX: viewBox.x,
      viewBoxY: viewBox.y,
      clientX: info.clientX,
      clientY: info.clientY,
    }
    this.logger.info("start", {
      origin: this.origin,
    })
  }

  continue(info: TPointerInfo): void {
    this.logger.info("continue", { info })
    this.#pendingInfo = info
    this.#scheduleUpdateViewBox()
  }

  end(info: TPointerInfo): void {
    this.logger.info("end", { info })
    this.#cancelScheduledUpdateViewBox()
    this.updateViewBox(info, true)
    this.origin = undefined
  }
}
