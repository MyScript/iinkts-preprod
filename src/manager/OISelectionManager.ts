import { LoggerClass, ResizeDirection, SELECTION_MARGIN, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIText, SymbolType, TBoundingBox, TOISymbol, TPoint } from "../primitive"
import { OISVGRenderer, SVGBuilder } from "../renderer"
import { OIResizeManager } from "./OIResizeManager"
import { OIRotationManager } from "./OIRotationManager"
import { OITranslateManager } from "./OITranslateManager"

/**
 * @group Manager
 */
export class OISelectionManager
{
  #logger = LoggerManager.getLogger(LoggerClass.SELECTION)
  #selectingId = "selecting-rect"
  startSelectionPoint?: TPoint
  endSelectionPoint?: TPoint
  selectedGroup?: SVGGElement

  behaviors: OIBehaviors

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get internalEvent(): InternalEvent
  {
    return this.behaviors.internalEvent
  }

  get rotator(): OIRotationManager
  {
    return this.behaviors.rotator
  }

  get translator(): OITranslateManager
  {
    return this.behaviors.translator
  }

  get resizer(): OIResizeManager
  {
    return this.behaviors.resizer
  }

  get selectionBox(): Box | undefined
  {
    if (this.startSelectionPoint && this.endSelectionPoint) {
      return Box.createFromPoints([this.startSelectionPoint, this.endSelectionPoint])
    }
    return
  }

  drawSelectingRect(box: TBoundingBox): void
  {
    this.clearSelectingRect()
    const attrs = {
      id: this.#selectingId,
      fill: "transparent",
      stroke: "grey",
      opacity: "0.25",
    }
    this.renderer.appendElement(SVGBuilder.createRect(box, attrs))
  }

  clearSelectingRect(): void
  {
    this.renderer.clearElements({ attrs: { id: this.#selectingId } })
  }

  protected getPoint(ev: PointerEvent): TPoint
  {
    const { clientLeft, scrollLeft, clientTop, scrollTop } = this.renderer.parent
    const rect: DOMRect = this.renderer.parent.getBoundingClientRect()
    return {
      x: ev.clientX - rect.left - clientLeft + scrollLeft,
      y: ev.clientY - rect.top - clientTop + scrollTop,
    }
  }

  protected createTranslateRect(box: TBoundingBox): SVGRectElement
  {
    const attrs = {
      role: SvgElementRole.Translate,
      style: "cursor:move",
      fill: "transparent",
      stroke: "transparent",
    }
    const boxWithMarge: TBoundingBox = {
      height: box.height,
      width: box.width,
      x: box.x,
      y: box.y
    }
    const translateEl = SVGBuilder.createRect(boxWithMarge, attrs)
    const handler = (ev: PointerEvent) =>
    {
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.continue(this.getPoint(ev))
    }
    const endHandler = (ev: PointerEvent) =>
    {
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.end(this.getPoint(ev))
      this.renderer.layer.removeEventListener("pointermove", handler)
      this.renderer.layer.removeEventListener("pointercancel", endHandler)
      this.renderer.layer.removeEventListener("pointerleave", endHandler)
      this.renderer.layer.removeEventListener("pointerup", endHandler)
    }

    translateEl.addEventListener("pointerdown", (ev) =>
    {
      if (ev.button !== 0 || ev.buttons !== 1) {
        return
      }
      ev.preventDefault()
      ev.stopPropagation()
      this.translator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
    return translateEl
  }

  protected createRotateGroup(box: TBoundingBox): SVGGElement
  {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Rotate,
      "vector-effect": "non-scaling-size",
      "style": "cursor:pointer;",
      "opacity": "1",
    })
    const radius = 8
    const center: TPoint = {
      x: (box.x + box.width / 2),
      y: box.y - 4 * SELECTION_MARGIN
    }
    const attrs1 = {
      role: SvgElementRole.Rotate,
      "stroke-width": "2",
      "stroke": "black",
      fill: "white",
    }
    group.appendChild(SVGBuilder.createCircle(center, radius, attrs1))

    const attrs2 = {
      role: SvgElementRole.Rotate,
      fill: "black",
    }

    group.appendChild(SVGBuilder.createCircle(center, radius / 2, attrs2))
    const attrs3 = {
      role: SvgElementRole.Rotate,
      stroke: "black",
      "stroke-width": "2"
    }
    group.appendChild(SVGBuilder.createLine({ x: center.x, y: center.y + radius }, { x: center.x, y: box.y - SELECTION_MARGIN }, attrs3))

    const handler = (ev: PointerEvent) =>
    {
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.continue(this.getPoint(ev))
    }
    const endHandler = (ev: PointerEvent) =>
    {
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.end(this.getPoint(ev))
      this.renderer.layer.removeEventListener("pointermove", handler)
      this.renderer.layer.removeEventListener("pointercancel", endHandler)
      this.renderer.layer.removeEventListener("pointerleave", endHandler)
      this.renderer.layer.removeEventListener("pointerup", endHandler)
    }

    group.addEventListener("pointerdown", (ev) =>
    {
      if (ev.button !== 0 || ev.buttons !== 1) {
        return
      }
      ev.preventDefault()
      ev.stopPropagation()
      this.rotator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
    return group
  }

  protected createResizeGroup(box: TBoundingBox): SVGGElement
  {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Resize,
      "vector-effect": "non-scaling-size",
      "stroke-width": "4",
      "stroke": "#3e68ff",
    })
    const P_NW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_NE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y - SELECTION_MARGIN }
    const P_SE: TPoint = { x: box.x + box.width + SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }
    const P_SW: TPoint = { x: box.x - SELECTION_MARGIN, y: box.y + box.height + SELECTION_MARGIN }

    const bindEl = (el: SVGElement, transformOrigin: TPoint) =>
    {
      const handler = (ev: PointerEvent) =>
      {
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.continue(this.getPoint(ev))
      }
      const endHandler = (ev: PointerEvent) =>
      {
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.end(this.getPoint(ev))
        this.renderer.layer.removeEventListener("pointermove", handler)
        this.renderer.layer.removeEventListener("pointercancel", endHandler)
        this.renderer.layer.removeEventListener("pointerleave", endHandler)
        this.renderer.layer.removeEventListener("pointerup", endHandler)
      }

      el.addEventListener("pointerdown", (ev) =>
      {
        if (ev.button !== 0 || ev.buttons !== 1) {
          return
        }
        ev.preventDefault()
        ev.stopPropagation()
        this.resizer.start(ev.target as Element, transformOrigin)
        this.renderer.layer.addEventListener("pointermove", handler)
        this.renderer.layer.addEventListener("pointercancel", endHandler)
        this.renderer.layer.addEventListener("pointerleave", endHandler)
        this.renderer.layer.addEventListener("pointerup", endHandler)
      })
    }

    const sideResizeDefs = [
      { direction: ResizeDirection.North, p1: P_NW, p2: P_NE, transformOrigin: { x: box.x + box.width / 2, y: box.y + box.height } },
      { direction: ResizeDirection.East, p1: P_NE, p2: P_SE, transformOrigin: { x: box.x, y: box.y + box.height / 2 } },
      { direction: ResizeDirection.South, p1: P_SW, p2: P_SE, transformOrigin: { x: box.x + box.width / 2, y: box.y } },
      { direction: ResizeDirection.West, p1: P_NW, p2: P_SW, transformOrigin: { x: box.x + box.width, y: box.y + box.height / 2 } },
    ]
    sideResizeDefs.forEach(def =>
    {
      const attrs = {
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        style: `cursor:${ def.direction };`
      }
      const lineResize = SVGBuilder.createLine(def.p1, def.p2, attrs)
      bindEl(lineResize, def.transformOrigin)
      group.appendChild(lineResize)
    })
    const cornerResizeDefs = [
      { direction: ResizeDirection.NorthWest, p: P_NW, transformOrigin: { x: box.x + box.width, y: box.y + box.height } },
      { direction: ResizeDirection.NorthEast, p: P_NE, transformOrigin: { x: box.x, y: box.y + box.height } },
      { direction: ResizeDirection.SouthEast, p: P_SE, transformOrigin: { x: box.x, y: box.y } },
      { direction: ResizeDirection.SouthWest, p: P_SW, transformOrigin: { x: box.x + box.width, y: box.y } },
    ]
    cornerResizeDefs.forEach(def =>
    {
      const attrs = {
        "stroke-width": "4",
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        transform: "scale(1, 1)",
        fill: "white",
        style: `cursor:${ def.direction };`
      }
      const cornerResize = SVGBuilder.createCircle(def.p, 5, attrs)
      bindEl(cornerResize, def.transformOrigin)
      group.appendChild(cornerResize)
    })
    return group
  }

  protected createInteractElementsGroup(symbols: TOISymbol[]): SVGGElement | undefined
  {
    this.#logger.info("createInteractElementsGroup", { symbols })

    if (!symbols.length) return

    const symbolElementMap = symbols.map(s =>
    {
      return {
        symbol: s,
        element: this.renderer.getElementById(s.id),
      }
    })

    const box1 = Box.createFromBoxes(symbols.map(s =>
    {
      return {
        x: s.boundingBox.x - (s.style.width || 1),
        y: s.boundingBox.y - (s.style.width || 1),
        height: s.boundingBox.height + (s.style.width || 1) * 2,
        width: s.boundingBox.width + (s.style.width || 1) * 2,
      }
    }))

    const box2 = Box.createFromPoints(symbols.flatMap(s => s.vertices))
    const box = Box.createFromBoxes([box1, box2])

    const attrs = {
      id: `selected-${ Date.now() }`,
      role: SvgElementRole.InteractElementsGroup,
    }
    const surroundGroup = SVGBuilder.createGroup(attrs)
    surroundGroup.appendChild(this.createTranslateRect(box))
    surroundGroup.appendChild(this.createResizeGroup(box))
    surroundGroup.appendChild(this.createRotateGroup(box))
    const SURROUND_ATTRS = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "#3e68ff",
      "stroke-width": "1",
      "stroke-dasharray": "4",
      "vector-effect": "non-scaling-size",
      transform: "rotate(0, 0, 0)"
    }
    symbolElementMap.forEach(s =>
    {
      if (s.element) {
        const bounds: TBoundingBox = {
          x: s.symbol.boundingBox.x - (s.symbol.style.width || 1),
          y: s.symbol.boundingBox.y - (s.symbol.style.width || 1),
          height: s.symbol.boundingBox.height + (s.symbol.style.width || 1) * 2,
          width: s.symbol.boundingBox.width + (s.symbol.style.width || 1) * 2,
        }
        if (s.symbol.type === SymbolType.Text) {
          const t = s.symbol as OIText
          SURROUND_ATTRS.transform = `rotate(${ t.rotation?.degree || 0 }, ${ t.rotation?.center.x || 0 }, ${ t.rotation?.center.y || 0 })`
        }
        else {
          SURROUND_ATTRS.transform = "rotate(0, 0, 0)"
        }
        surroundGroup.prepend(SVGBuilder.createRect(bounds, SURROUND_ATTRS))
      }
    })
    return surroundGroup
  }

  drawSelectedGroup(symbols: TOISymbol[]): void
  {
    if (!symbols.length) return
    this.selectedGroup = this.createInteractElementsGroup(symbols)
    if (this.selectedGroup) {
      this.renderer.layer.appendChild(this.selectedGroup)
      const groupBox = this.selectedGroup.getBBox()
      this.behaviors.menu.context.position.x = groupBox.x + groupBox.width / 2 - this.renderer.parent.clientLeft
      this.behaviors.menu.context.position.y = groupBox.y + groupBox.height - this.renderer.parent.clientTop
      this.behaviors.menu.context.show()
    }
    this.behaviors.menu.update()
  }

  resetSelectedGroup(symbols: TOISymbol[]): void
  {
    this.#logger.info("resetSelectedGroup", { symbols })
    this.removeSelectedGroup()
    this.drawSelectedGroup(symbols)
  }

  removeSelectedGroup(): void
  {
    this.#logger.info("removeSelectedGroup")
    this.behaviors.menu.context.hide()
    this.selectedGroup?.remove()
    this.selectedGroup = undefined
  }

  hideInteractElements(): void
  {
    this.behaviors.menu.context.hide()
    const query = `[role=${ SvgElementRole.Resize }],[role=${ SvgElementRole.Rotate }],[role=${ SvgElementRole.Translate }]`
    this.selectedGroup?.querySelectorAll(query)
      .forEach(el =>
      {
        el.setAttribute("visibility", "hidden")
      })
  }

  showInteractElements(): void
  {
    this.behaviors.menu.context.show()
    const query = `[role=${ SvgElementRole.Resize }],[role=${ SvgElementRole.Rotate }],[role=${ SvgElementRole.Translate }]`
    this.selectedGroup?.querySelectorAll(query)
      .forEach(el => el.setAttribute("visibility", "visible"))
  }

  start(point: TPoint): void
  {
    this.startSelectionPoint = point
    this.endSelectionPoint = point
    this.drawSelectingRect(this.selectionBox!)
  }

  continue(point: TPoint): TOISymbol[]
  {
    if (!this.startSelectionPoint) {
      throw new Error("You need to call startSelectionByBox before")
    }
    this.endSelectionPoint = point
    const updatedSymbols: TOISymbol[] = []
    this.model.symbols.forEach(s =>
    {
      if (s.selected !== s.overlaps(this.selectionBox!)) {
        s.selected = s.overlaps(this.selectionBox!)
        updatedSymbols.push(s)
        this.renderer.drawSymbol(s)
      }
    })
    this.drawSelectingRect(this.selectionBox!)
    return updatedSymbols
  }

  end(point: TPoint): TOISymbol[]
  {
    this.endSelectionPoint = point
    const updatedSymbols = this.continue(point)
    this.startSelectionPoint = undefined
    this.endSelectionPoint = undefined
    this.clearSelectingRect()
    this.drawSelectedGroup(this.model.symbolsSelected)
    this.internalEvent.emitSelected(this.model.symbolsSelected)
    this.behaviors.menu.style.update()
    return updatedSymbols
  }
}
