import { TGrabberConfiguration } from "../configuration"
import { LoggerClass, LoggerLevel, LoggerManager } from "../logger"
import { TPointer } from "../symbol"
import { IGrabber } from "./IGrabber"

/**
 * @group Grabber
 */
export class OIPointerEventGrabber implements IGrabber
{
  #logger = LoggerManager.getLogger(LoggerClass.GRABBER)

  protected configuration: TGrabberConfiguration
  protected layerCapture!: SVGElement
  protected capturing: boolean = false
  protected pointerType?: string
  protected prevent = (e: Event) => e.preventDefault()

  onPointerDown!: (evt: PointerEvent, point: TPointer) => void
  onPointerMove!: (evt: PointerEvent, point: TPointer) => void
  onPointerUp!: (evt: PointerEvent, point: TPointer) => void
  onContextMenu!: (el: HTMLElement, point: TPointer) => void

  constructor(configuration: TGrabberConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
  }

  protected roundFloat(oneFloat: number, requestedFloatPrecision: number): number
  {
    if (requestedFloatPrecision >= 0) {
      const floatPrecision: number = Math.pow(10, requestedFloatPrecision)
      return Math.round(oneFloat / floatPrecision) * floatPrecision
    }
    this.#logger.debug("roundFloat", { oneFloat, requestedFloatPrecision })
    return oneFloat
  }

  protected extractPoint(event: MouseEvent | TouchEvent): TPointer
  {
    let clientX: number, clientY: number
    if ("changedTouches" in event) {
      ({ clientX, clientY } = event.changedTouches[0])
    } else {
      ({ clientX, clientY } = event)
    }
    const rect: DOMRect = this.layerCapture.getBoundingClientRect()
    const pointer = {
      x: this.roundFloat(clientX - rect.left - this.layerCapture.clientLeft + this.layerCapture.scrollLeft, this.configuration.xyFloatPrecision),
      y: this.roundFloat(clientY - rect.top - this.layerCapture.clientTop + this.layerCapture.scrollTop, this.configuration.xyFloatPrecision),
      t: this.roundFloat(Date.now(), this.configuration.timestampFloatPrecision),
      p: (event as PointerEvent).pressure,
    }
    this.#logger.debug("extractPoint", { event, pointer })
    return pointer
  }

  protected getPointerInfos(evt: PointerEvent): { clientX: number, clientY: number, isPrimary: boolean, type: string, pointerType: string, target: string }
  {
    return {
      clientX: evt.clientX,
      clientY: evt.clientY,
      isPrimary: evt.isPrimary,
      type: evt.type,
      target: (evt.target as HTMLElement)?.tagName,
      pointerType: evt.pointerType,
    }
  }

  protected pointerDownHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerDownHandler", { evt })

    // exit if not a left click or multi-touch
    if (evt.button !== 0 || evt.buttons !== 1) {
      return
    }
    this.capturing = true
    this.pointerType = evt.pointerType

    if (this.#logger.level === LoggerLevel.INFO) {
      this.#logger.info("pointerDownHandler", this.getPointerInfos(evt))
    }

    if (this.onPointerDown) {
      const point = this.extractPoint(evt)
      this.onPointerDown(evt, point)
    }
  }

  protected pointerMoveHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerMoveHandler", { evt })
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerMoveHandler", this.getPointerInfos(evt))
      }
      if (this.onPointerMove) {
        const point = this.extractPoint(evt)
        this.onPointerMove(evt, point)
      }
    }
  }

  protected pointerUpHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerUpHandler", { evt })
    if (this.capturing && this.pointerType === evt.pointerType) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerUpHandler", this.getPointerInfos(evt))
      }
      this.pointerType = undefined
      this.capturing = false
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.onPointerUp(evt, point)
      }
    }
  }

  protected pointerOutHandler = (evt: PointerEvent) =>
  {
    this.#logger.debug("pointerOutHandler", this.getPointerInfos(evt))
    if (this.capturing && this.pointerType === evt.pointerType && !this.layerCapture.contains(evt.target as HTMLElement)) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("pointerOutHandler", this.getPointerInfos(evt))
      }
      this.pointerType = undefined
      this.capturing = false
      if (this.onPointerUp) {
        const point = this.extractPoint(evt)
        this.onPointerUp(evt, point)
      }
    }
  }

  protected contextMenuHandler = (evt: MouseEvent) =>
  {
    this.#logger.debug("contextMenuHandler", evt)
    if (evt.target) {
      if (this.#logger.level === LoggerLevel.INFO) {
        this.#logger.info("contextMenuHandler", this.getPointerInfos(evt as PointerEvent))
      }
      const point = this.extractPoint(evt)
      this.onContextMenu(evt.target as HTMLElement, point)
    }
  }

  stopPointerEvent(): void
  {
    this.capturing = false
    this.pointerType = undefined
  }

  attach(layerCapture: SVGElement)
  {
    this.#logger.info("attach", { domElement: layerCapture })
    if (this.layerCapture) {
      this.detach()
    }
    // The touch-action CSS property prevents the input from continuing.
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event
    layerCapture.style.setProperty("touch-action", "none")
    this.layerCapture = layerCapture
    this.layerCapture.addEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)
    this.layerCapture.addEventListener("contextmenu", this.contextMenuHandler)
  }

  detach()
  {
    this.#logger.info("detach")
    this.layerCapture?.removeEventListener("pointerdown", this.pointerDownHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointermove", this.pointerMoveHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerup", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerleave", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointercancel", this.pointerUpHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("pointerout", this.pointerOutHandler, this.configuration.listenerOptions)
    this.layerCapture?.removeEventListener("contextmenu", this.contextMenuHandler)
  }
}
