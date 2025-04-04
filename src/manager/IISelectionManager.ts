import { ResizeDirection, SELECTION_MARGIN, SvgElementRole } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { Box, IIText, SymbolType, TBox, TIIEdge, TIISymbol, TPoint } from "../symbol"
import { SVGRenderer, SVGBuilder } from "../renderer"
import { IIResizeManager } from "./IIResizeManager"
import { IIRotationManager } from "./IIRotationManager"
import { IITranslateManager } from "./IITranslateManager"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../grabber"

/**
 * @group Manager
 */
export class IISelectionManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.SELECTION)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor

  #selectingId = "selecting-rect"
  startSelectionPoint?: TPoint
  endSelectionPoint?: TPoint
  selectedGroup?: SVGGElement

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
    this.grabber.onContextMenu = this.onContextMenu.bind(this)
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get rotator(): IIRotationManager
  {
    return this.editor.rotator
  }

  get translator(): IITranslateManager
  {
    return this.editor.translator
  }

  get resizer(): IIResizeManager
  {
    return this.editor.resizer
  }

  get selectionBox(): Box | undefined
  {
    if (this.startSelectionPoint && this.endSelectionPoint) {
      return Box.createFromPoints([this.startSelectionPoint, this.endSelectionPoint])
    }
    return
  }

  attach(layer: HTMLElement): void
  {
    this.removeSelectedGroup()
    this.grabber.attach(layer)
  }

  detach(): void
  {
    this.removeSelectedGroup()
    this.grabber.detach()
  }

  drawSelectingRect(box: TBox): void
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

  protected createTranslateRect(box: TBox): SVGRectElement
  {
    const attrs = {
      role: SvgElementRole.Translate,
      style: "cursor:move",
      fill: "transparent",
      stroke: "transparent",
    }
    const boxWithMarge: TBox = {
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
      this.renderer.layer.style.cursor = ""
      this.resetSelectedGroup(this.model.symbolsSelected)
    }

    translateEl.addEventListener("pointerdown", (ev) =>
    {
      if (ev.button !== 0 || ev.buttons !== 1) {
        return
      }
      ev.preventDefault()
      ev.stopPropagation()
      this.hideInteractElements()
      this.translator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)

      this.renderer.layer.style.cursor = "move"
    })
    return translateEl
  }

  protected createRotateGroup(box: TBox): SVGGElement
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
      this.resetSelectedGroup(this.model.symbolsSelected)
    }

    group.addEventListener("pointerdown", (ev) =>
    {
      if (ev.button !== 0 || ev.buttons !== 1) {
        return
      }
      ev.preventDefault()
      ev.stopPropagation()
      this.hideInteractElements()
      this.rotator.start(ev.target as Element, this.getPoint(ev))
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
    return group
  }

  protected createResizeGroup(box: TBox): SVGGElement
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

    const bindEl = (el: SVGElement, transformOrigin: TPoint, cursor: string) =>
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

        this.renderer.layer.style.cursor = ""
        this.resetSelectedGroup(this.model.symbolsSelected)
      }

      el.addEventListener("pointerdown", (ev) =>
      {
        if (ev.button !== 0 || ev.buttons !== 1) {
          return
        }
        ev.preventDefault()
        ev.stopPropagation()
        this.hideInteractElements()
        this.renderer.layer.style.cursor = cursor
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
      bindEl(lineResize, def.transformOrigin, def.direction)
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
      bindEl(cornerResize, def.transformOrigin, def.direction)
      group.appendChild(cornerResize)
    })
    return group
  }

  protected createInteractElementsGroup(symbols: TIISymbol[]): SVGGElement | undefined
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
        x: s.bounds.x - (s.style.width || 1),
        y: s.bounds.y - (s.style.width || 1),
        height: s.bounds.height + (s.style.width || 1) * 2,
        width: s.bounds.width + (s.style.width || 1) * 2,
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
        const bounds: TBox = {
          x: s.symbol.bounds.x - (s.symbol.style.width || 1),
          y: s.symbol.bounds.y - (s.symbol.style.width || 1),
          height: s.symbol.bounds.height + (s.symbol.style.width || 1) * 2,
          width: s.symbol.bounds.width + (s.symbol.style.width || 1) * 2,
        }
        if (s.symbol.type === SymbolType.Text) {
          const t = s.symbol as IIText
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

  protected createEdgeResizeGroup(edge: TIIEdge): SVGGElement
  {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Resize,
      "vector-effect": "non-scaling-size",
      "stroke-width": "4",
      "stroke": "#3e68ff",
    })

    const radius = 5
    const attrs = {
      role: SvgElementRole.Resize,
      "stroke-width": "4",
      "stroke": "#3e68ff",
      fill: "white",
      style: `cursor:grab;`
    }
    const bindEl = (el: SVGCircleElement, pointIndex: number) =>
    {
      const handler = (ev: PointerEvent) =>
      {
        ev.preventDefault()
        ev.stopPropagation()
        const point = this.getPoint(ev)
        const { x, y } = this.editor.snaps.snapResize(point)
        edge.vertices[pointIndex].x = x
        edge.vertices[pointIndex].y = y
        this.model.updateSymbol(edge)
        this.renderer.drawSymbol(edge)
      }
      const endHandler = (ev: PointerEvent) =>
      {
        ev.preventDefault()
        ev.stopPropagation()
        const point = this.getPoint(ev)
        const { x, y } = this.editor.snaps.snapResize(point)
        edge.vertices[pointIndex].x = x
        edge.vertices[pointIndex].y = y
        this.renderer.layer.style.cursor = ""
        this.editor.updateSymbol(edge)
        this.renderer.layer.removeEventListener("pointermove", handler)
        this.renderer.layer.removeEventListener("pointercancel", endHandler)
        this.renderer.layer.removeEventListener("pointerleave", endHandler)
        this.renderer.layer.removeEventListener("pointerup", endHandler)
        this.editor.snaps.clearSnapToElementLines()
        this.resetSelectedGroup(this.model.symbolsSelected)
      }

      el.addEventListener("pointerdown", (ev) =>
      {
        if (ev.button !== 0 || ev.buttons !== 1) {
          return
        }
        this.renderer.layer.style.cursor = "grabbing"
        this.hideInteractElements()
        ev.preventDefault()
        ev.stopPropagation()
        this.renderer.layer.addEventListener("pointermove", handler)
        this.renderer.layer.addEventListener("pointercancel", endHandler)
        this.renderer.layer.addEventListener("pointerleave", endHandler)
        this.renderer.layer.addEventListener("pointerup", endHandler)
      })
    }
    edge.vertices.forEach((p, i) =>
    {
      const pointEl = SVGBuilder.createCircle(p, radius, attrs)
      bindEl(pointEl, i)
      group.appendChild(pointEl)
    })

    return group
  }

  protected createInteractEdgeGroup(edge: TIIEdge): SVGGElement | undefined
  {
    this.#logger.info("createInteractEdgeGroup", { edge })
    const attrs = {
      id: `selected-${ Date.now() }`,
      role: SvgElementRole.InteractElementsGroup,
    }
    const surroundGroup = SVGBuilder.createGroup(attrs)
    surroundGroup.appendChild(this.createTranslateRect(edge.bounds))
    surroundGroup.appendChild(this.createEdgeResizeGroup(edge.clone()))
    return surroundGroup
  }

  drawSelectedGroup(symbols: TIISymbol[]): void
  {
    if (!symbols.length) return
    if (symbols.length === 1 && symbols[0].type === SymbolType.Edge) {
      this.selectedGroup = this.createInteractEdgeGroup(symbols[0] as TIIEdge)
    }
    else {
      this.selectedGroup = this.createInteractElementsGroup(symbols)
    }
    if (this.selectedGroup) {
      this.renderer.layer.appendChild(this.selectedGroup)
      const groupBox = this.selectedGroup.getBBox()
      this.editor.menu.context.position.x = groupBox.x + groupBox.width / 2 - this.renderer.parent.clientLeft
      this.editor.menu.context.position.y = groupBox.y + groupBox.height - this.renderer.parent.clientTop
      this.editor.menu.context.show()
    }
    this.editor.menu.update()
  }

  resetSelectedGroup(symbols: TIISymbol[]): void
  {
    this.#logger.info("resetSelectedGroup", { symbols })
    this.removeSelectedGroup()
    this.drawSelectedGroup(symbols)
  }

  removeSelectedGroup(): void
  {
    this.#logger.info("removeSelectedGroup")
    this.editor.menu.context.hide()
    this.selectedGroup?.remove()
    this.selectedGroup = undefined
  }

  hideInteractElements(): void
  {
    this.editor.menu.context.hide()
    const query = `[role=${ SvgElementRole.Resize }],[role=${ SvgElementRole.Rotate }],[role=${ SvgElementRole.Translate }]`
    this.selectedGroup?.querySelectorAll(query)
      .forEach(el =>
      {
        el.setAttribute("visibility", "hidden")
      })
  }

  start(info: PointerInfo): void
  {
    this.removeSelectedGroup()
    this.startSelectionPoint = info.pointer
    this.endSelectionPoint = info.pointer
    this.drawSelectingRect(this.selectionBox!)
  }

  continue(info: PointerInfo): TIISymbol[]
  {
    if (!this.startSelectionPoint) {
      throw new Error("You need to call startSelectionByBox before")
    }
    this.endSelectionPoint = info.pointer
    const updatedSymbols: TIISymbol[] = []
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

  end(info: PointerInfo): TIISymbol[]
  {
    const updatedSymbols = this.continue(info)
    this.startSelectionPoint = undefined
    this.endSelectionPoint = undefined
    this.clearSelectingRect()
    this.drawSelectedGroup(this.model.symbolsSelected)
    this.editor.event.emitSelected(this.model.symbolsSelected)
    this.editor.menu.style.update()
    return updatedSymbols
  }

  protected async onContextMenu(info: PointerInfo): Promise<void>
  {
    let found = false
    let currentEl = info.target as HTMLElement | null
    const symbolTypesAllowed = [SymbolType.Edge.toString(), SymbolType.Shape.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()]
    while (currentEl && currentEl.tagName !== "svg" && !found) {
      if (symbolTypesAllowed.includes(currentEl.getAttribute("type") as string)) {
        found = true
      }
      else {
        currentEl = currentEl.parentElement
      }
    }
    this.editor.unselectAll()
    if (currentEl?.id) {
      this.model.selectSymbol(currentEl.id)
      this.renderer.drawSymbol(this.model.symbolsSelected[0])
      this.drawSelectedGroup(this.model.symbolsSelected)
      this.editor.updateLayerUI()
    }
    else {
      this.editor.menu.context.position.x = info.pointer.x + this.renderer.parent.clientLeft
      this.editor.menu.context.position.y = info.pointer.y + this.renderer.parent.clientTop
      this.editor.menu.context.show()
    }
  }
}
