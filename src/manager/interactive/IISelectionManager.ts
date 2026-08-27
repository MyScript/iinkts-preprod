import { RafCoalescer } from "@/browser"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { ResizeDirection, SELECTION_MARGIN, SvgElementRole } from "@/Constants"
import type { TBox, TPoint } from "@/core/geometry"
import { BoxOps } from "@/core/geometry"
import { OBBOps } from "@/core/geometry"
import type { TDraft } from "@/core/std"
import type { TPointerInfo } from "@/grabber"
import { PointerEventGrabber } from "@/grabber"
import { LoggerCategory } from "@/logger"
import { SVGBuilder } from "@/renderer"
import type { TDecorator, TEdge, TEdgeArc, TStroke, TSymbol } from "@/symbol"
import {
  EdgeKind,
  EdgeLineOps,
  EdgePolyLineOps,
  isDecorator,
  isRecognizedMath,
  isStroke,
  StrokeOps,
  SymbolType,
} from "@/symbol"
import { EdgeArcOps, reprojectArcMidpoint, stretchArcEndpoint } from "@/symbol/edge/Arc"
import { EdgeOps } from "@/symbol/edge/Edge"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"

import { IIAbstractManager } from "./IIAbstractManager"
import type { IIResizeManager } from "./transform/IIResizeManager"
import type { IIRotationManager } from "./transform/IIRotationManager"
import type { IITranslateManager } from "./transform/IITranslateManager"

/**
 * @group Manager
 * @remarks Level of text selection granularity
 */
export type TTextSelectionLevel = "element" | "word" | "char"

/**
 * @group Manager
 * @remarks Level of math selection granularity
 */
export type TMathSelectionLevel = "element" | "operand"

/**
 * @group Manager
 * @remarks Level of shape (Node/Edge) selection granularity
 */
export type TShapeSelectionLevel = "element" | "stroke"

/**
 * @group Manager
 * @remarks Level of symbol selection
 */
export type TSelectionConfig = {
  textLevel: TTextSelectionLevel
  mathLevel: TMathSelectionLevel
  shapeLevel: TShapeSelectionLevel
}

/**
 * @group Manager
 * @remarks Default values of symbol selection
 */
export const DefaultSelectionConfig: TSelectionConfig = {
  textLevel: "element",
  mathLevel: "element",
  shapeLevel: "element",
}

/**
 * @group Manager
 */
export class IISelectionManager extends IIAbstractManager {
  protected managerName = "IISelectionManager"

  grabber: PointerEventGrabber

  #selectingId = "selecting-rect"
  startSelectionPoint?: TPoint
  endSelectionPoint?: TPoint
  selectedGroup?: SVGGElement

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.SELECTION)
    this.logger.info("constructor")
    this.grabber = new PointerEventGrabber(canvas.configuration.grabber)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
    this.grabber.onContextMenu = this.onContextMenu.bind(this)
  }

  get rotation(): IIRotationManager {
    return this.canvas.transform.rotation
  }

  get translate(): IITranslateManager {
    return this.canvas.transform.translate
  }

  get resize(): IIResizeManager {
    return this.canvas.transform.resize
  }

  get selectionBox(): TBox | undefined {
    if (this.startSelectionPoint && this.endSelectionPoint) {
      return BoxOps.createFromPoints([this.startSelectionPoint, this.endSelectionPoint])
    }
    return
  }

  attach(layer: HTMLElement): void {
    this.removeSelectedGroup()
    this.grabber.attach(layer)
  }

  detach(): void {
    this.removeSelectedGroup()
    this.grabber.detach()
  }

  drawSelectingRect(box: TBox): void {
    this.clearSelectingRect()
    const attrs = {
      id: this.#selectingId,
      fill: "transparent",
      stroke: "grey",
      opacity: "0.25",
    }
    this.renderer.appendElement(SVGBuilder.createRect(box, attrs))
  }

  clearSelectingRect(): void {
    this.renderer.clearElements({
      attrs: { id: this.#selectingId },
    })
  }

  protected getPoint(ev: PointerEvent): TPoint {
    const svgElement = this.renderer.layer
    const ctm = svgElement.getScreenCTM()

    if (ctm) {
      const point = svgElement.createSVGPoint()
      point.x = ev.clientX
      point.y = ev.clientY
      const transformedPoint = point.matrixTransform(ctm.inverse())
      return {
        x: transformedPoint.x,
        y: transformedPoint.y,
      }
    } else {
      // Fallback si getScreenCTM() échoue
      const { clientLeft, scrollLeft, clientTop, scrollTop } = this.renderer.parent
      const rect: DOMRect = this.renderer.parent.getBoundingClientRect()
      return {
        x: ev.clientX - rect.left - clientLeft + scrollLeft,
        y: ev.clientY - rect.top - clientTop + scrollTop,
      }
    }
  }

  /**
   * Wires the pointerdown → pointermove/pointerup/pointercancel/pointerleave dance shared by
   * every drag handle in this file (translate/resize/rotate rect+group handles, edge resize
   * points, arc handles): on a primary-button `pointerdown`, hide the interact overlay and run
   * `onStart`, then listen for the 4 continuation events on `renderer.layer`; on any of those,
   * run `onEnd` and remove all 4 listeners. `onContinue` runs on every `pointermove` in between.
   */
  #bindPointerDrag(
    el: SVGElement,
    onStart: (ev: PointerEvent) => void,
    onContinue: (ev: PointerEvent) => void,
    onEnd: (ev: PointerEvent) => void
  ): void {
    const handler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      onContinue(ev)
    }
    const endHandler = (ev: PointerEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      onEnd(ev)
      this.renderer.layer.removeEventListener("pointermove", handler)
      this.renderer.layer.removeEventListener("pointercancel", endHandler)
      this.renderer.layer.removeEventListener("pointerleave", endHandler)
      this.renderer.layer.removeEventListener("pointerup", endHandler)
    }
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || ev.buttons !== 1) {
        return
      }
      ev.preventDefault()
      ev.stopPropagation()
      this.hideInteractElements()
      onStart(ev)
      this.renderer.layer.addEventListener("pointermove", handler)
      this.renderer.layer.addEventListener("pointercancel", endHandler)
      this.renderer.layer.addEventListener("pointerleave", endHandler)
      this.renderer.layer.addEventListener("pointerup", endHandler)
    })
  }

  protected createTranslateRect(box: TBox): SVGRectElement {
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
      y: box.y,
    }
    const translateEl = SVGBuilder.createRect(boxWithMarge, attrs)
    this.#bindPointerDrag(
      translateEl,
      (ev) => {
        this.translate.start(ev.target as Element, this.getPoint(ev))
        this.renderer.layer.style.cursor = "move"
      },
      (ev) => this.translate.continue(this.getPoint(ev)),
      (ev) => {
        this.translate.end(this.getPoint(ev))
        this.renderer.layer.style.cursor = ""
        this.redrawSelectedGroup()
      }
    )
    return translateEl
  }

  protected createRotateGroup(box: TBox): SVGGElement {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Rotate,
      "vector-effect": "non-scaling-size",
      style: "cursor:pointer;",
      opacity: "1",
    })
    const radius = 8
    const center: TPoint = {
      x: box.x + box.width / 2,
      y: box.y - 4 * SELECTION_MARGIN,
    }
    const attrs1 = {
      role: SvgElementRole.Rotate,
      "stroke-width": "2",
      stroke: "black",
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
      "stroke-width": "2",
    }
    group.appendChild(
      SVGBuilder.createLine(
        { x: center.x, y: center.y + radius },
        {
          x: center.x,
          y: box.y - SELECTION_MARGIN,
        },
        attrs3
      )
    )

    this.#bindPointerDrag(
      group,
      (ev) => this.rotation.start(ev.target as Element, this.getPoint(ev)),
      (ev) => this.rotation.continue(this.getPoint(ev)),
      (ev) => {
        this.rotation.end(this.getPoint(ev))
        this.drawSelectedGroup(this.model.symbolsSelected)
      }
    )
    return group
  }

  protected createResizeGroup(box: TBox): SVGGElement {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Resize,
      "vector-effect": "non-scaling-size",
      "stroke-width": "4",
      stroke: "#3e68ff",
    })
    const P_NW: TPoint = {
      x: box.x - SELECTION_MARGIN,
      y: box.y - SELECTION_MARGIN,
    }
    const P_NE: TPoint = {
      x: box.x + box.width + SELECTION_MARGIN,
      y: box.y - SELECTION_MARGIN,
    }
    const P_SE: TPoint = {
      x: box.x + box.width + SELECTION_MARGIN,
      y: box.y + box.height + SELECTION_MARGIN,
    }
    const P_SW: TPoint = {
      x: box.x - SELECTION_MARGIN,
      y: box.y + box.height + SELECTION_MARGIN,
    }

    const bindEl = (el: SVGElement, transformOrigin: TPoint, cursor: string) => {
      this.#bindPointerDrag(
        el,
        (ev) => {
          this.renderer.layer.style.cursor = cursor
          this.resize.start(ev.target as Element, transformOrigin)
        },
        (ev) => this.resize.continue(this.getPoint(ev)),
        (ev) => {
          this.resize.end(this.getPoint(ev))
          this.renderer.layer.style.cursor = ""
          this.drawSelectedGroup(this.model.symbolsSelected)
        }
      )
    }

    const sideResizeDefs = [
      {
        direction: ResizeDirection.North,
        p1: P_NW,
        p2: P_NE,
        transformOrigin: {
          x: box.x + box.width / 2,
          y: box.y + box.height,
        },
      },
      {
        direction: ResizeDirection.East,
        p1: P_NE,
        p2: P_SE,
        transformOrigin: {
          x: box.x,
          y: box.y + box.height / 2,
        },
      },
      {
        direction: ResizeDirection.South,
        p1: P_SW,
        p2: P_SE,
        transformOrigin: {
          x: box.x + box.width / 2,
          y: box.y,
        },
      },
      {
        direction: ResizeDirection.West,
        p1: P_NW,
        p2: P_SW,
        transformOrigin: {
          x: box.x + box.width,
          y: box.y + box.height / 2,
        },
      },
    ]
    sideResizeDefs.forEach((def) => {
      const attrs = {
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        style: `cursor:${def.direction};`,
      }
      const lineResize = SVGBuilder.createLine(def.p1, def.p2, attrs)
      bindEl(lineResize, def.transformOrigin, def.direction)
      group.appendChild(lineResize)
    })
    const cornerResizeDefs = [
      {
        direction: ResizeDirection.NorthWest,
        p: P_NW,
        transformOrigin: {
          x: box.x + box.width,
          y: box.y + box.height,
        },
      },
      {
        direction: ResizeDirection.NorthEast,
        p: P_NE,
        transformOrigin: {
          x: box.x,
          y: box.y + box.height,
        },
      },
      {
        direction: ResizeDirection.SouthEast,
        p: P_SE,
        transformOrigin: { x: box.x, y: box.y },
      },
      {
        direction: ResizeDirection.SouthWest,
        p: P_SW,
        transformOrigin: {
          x: box.x + box.width,
          y: box.y,
        },
      },
    ]
    cornerResizeDefs.forEach((def) => {
      const attrs = {
        "stroke-width": "4",
        role: SvgElementRole.Resize,
        "resize-direction": def.direction,
        "transform-origin": JSON.stringify(def.transformOrigin),
        transform: "scale(1, 1)",
        fill: "white",
        style: `cursor:${def.direction};`,
      }
      const cornerResize = SVGBuilder.createCircle(def.p, 5, attrs)
      bindEl(cornerResize, def.transformOrigin, def.direction)
      group.appendChild(cornerResize)
    })
    return group
  }

  protected createInteractElementsGroup(symbols: TSymbol[]): SVGGElement | undefined {
    this.logger.info("createInteractElementsGroup", { symbols })

    if (!symbols.length) {
      return
    }

    const box1 = BoxOps.createFromBoxes(
      symbols.map((s) => {
        const b = OBBOps.toBox(s.bounds)
        return {
          x: b.x - (s.style.width || 1),
          y: b.y - (s.style.width || 1),
          height: b.height + (s.style.width || 1) * 2,
          width: b.width + (s.style.width || 1) * 2,
        }
      })
    )

    const box2 = BoxOps.createFromPoints(symbols.flatMap((s) => s.vertices))
    const ghostBoxes = this.getGhostBoxesForSelectedMath(symbols)
    const box = BoxOps.createFromBoxes([box1, box2, ...ghostBoxes])

    const attrs = {
      id: `selected-${Date.now()}`,
      role: SvgElementRole.InteractElementsGroup,
    }
    const surroundGroup = SVGBuilder.createGroup(attrs)
    surroundGroup.appendChild(this.createTranslateRect(box))
    surroundGroup.appendChild(this.createResizeGroup(box))
    surroundGroup.appendChild(this.createRotateGroup(box))
    return surroundGroup
  }

  /**
   * In "element" mode, bounds of any active ghost preview for a selected math block —
   * merged into the selection rectangle even though ghost strokes aren't real model symbols.
   */
  private getGhostBoxesForSelectedMath(symbols: TSymbol[]): TBox[] {
    if (this.canvas.configuration.selection.mathLevel !== "element") {
      return []
    }
    const jiixBlockIds = new Set<string>()
    symbols.forEach((s) => {
      if (isRecognizedMath(s) && s.jiixBlockId) {
        jiixBlockIds.add(s.jiixBlockId)
      }
    })
    const boxes: TBox[] = []
    jiixBlockIds.forEach((id) => {
      const bounds = this.canvas.math.getGhostBounds(id)
      if (bounds) {
        boxes.push(bounds)
      }
    })
    return boxes
  }

  /**
   * The resize handles drag `edge` in place across the whole gesture and commit it on every frame,
   * so it takes a draft: one draft per drag, mutated per `pointermove`, committed per frame.
   */
  protected createEdgeResizeGroup(edge: TDraft<TEdge>): SVGGElement {
    const group = SVGBuilder.createGroup({
      role: SvgElementRole.Resize,
      "vector-effect": "non-scaling-size",
      "stroke-width": "4",
      stroke: "#3e68ff",
    })

    const radius = 5
    const attrs = {
      role: SvgElementRole.Resize,
      "stroke-width": "4",
      stroke: "#3e68ff",
      fill: "white",
      style: `cursor:grab;`,
    }
    const bindEl = (el: SVGCircleElement, pointIndex: number) => {
      this.#bindPointerDrag(
        el,
        () => {
          this.renderer.layer.style.cursor = "grabbing"
        },
        (ev) => {
          const point = this.getPoint(ev)
          const { x, y } = this.canvas.snaps.snapResize(point)
          edge.vertices[pointIndex].x = x
          edge.vertices[pointIndex].y = y
          EdgeOps.updateEdgeDerivedFields(edge)
          this.model.updateSymbol(edge)
          this.renderer.drawSymbol(edge)
          this.canvas.connector.showAnchorHint({ x, y }, edge.id)
        },
        (ev) => {
          const point = this.getPoint(ev)
          const { x, y } = this.canvas.snaps.snapResize(point)
          edge.vertices[pointIndex].x = x
          edge.vertices[pointIndex].y = y
          EdgeOps.updateEdgeDerivedFields(edge)
          this.canvas.connector.clearAnchorHint()
          this.canvas.connector.applyEndpointAnchor(edge, pointIndex, { x, y })
          this.renderer.layer.style.cursor = ""
          this.canvas.updateSymbol(edge)
          this.canvas.snaps.clearSnapToElementLines()
          this.drawSelectedGroup(this.model.symbolsSelected)
        }
      )
    }
    if (edge.kind === EdgeKind.Arc) {
      const arc = edge as TDraft<TEdgeArc>
      const bindArcEl = (el: SVGCircleElement, isStart: boolean, isEnd: boolean) => {
        const updateArc = (x: number, y: number) => {
          if (isStart) {
            // Free stretch: lets the ellipse resize to reach the dragged point, rather than
            // sliding the endpoint's angle around the existing (unchanged-size) ellipse.
            Object.assign(arc, stretchArcEndpoint(arc, "start", { x, y }))
          } else if (isEnd) {
            Object.assign(arc, stretchArcEndpoint(arc, "end", { x, y }))
          } else {
            // Keeps both endpoints (and phi, and the radiusX:radiusY ratio) exactly fixed —
            // dragging this handle only changes the arc's bulge, not where it's anchored.
            Object.assign(arc, reprojectArcMidpoint(arc, { x, y }))
          }
        }
        // Midpoint drag (reprojectArcMidpoint) runs a ~280-sample golden-section search per
        // call — coalescing to one commit per animation frame, instead of one per native
        // pointermove, keeps that search from running far more often than it can be seen.
        const dragCoalescer = new RafCoalescer()
        const runHandler = (ev: PointerEvent) => {
          const point = this.getPoint(ev)
          const { x, y } = this.canvas.snaps.snapResize(point)
          updateArc(x, y)
          EdgeArcOps.updateDerivedFields(arc)
          this.model.updateSymbol(arc)
          this.renderer.drawSymbol(arc)
          if (isStart || isEnd) {
            this.canvas.connector.showAnchorHint({ x, y }, arc.id)
          }
        }
        this.#bindPointerDrag(
          el,
          () => {
            this.renderer.layer.style.cursor = "grabbing"
          },
          (ev) => dragCoalescer.schedule(() => runHandler(ev)),
          (ev) => {
            dragCoalescer.cancel()
            const point = this.getPoint(ev)
            const { x, y } = this.canvas.snaps.snapResize(point)
            updateArc(x, y)
            EdgeArcOps.updateDerivedFields(arc)
            this.canvas.connector.clearAnchorHint()
            if (isStart || isEnd) {
              // Recomputed fresh, not the vertexIndex captured before this drag: updateDerivedFields
              // just re-tessellated the arc, and the vertex COUNT can change with the new radius/
              // sweep — a stale index could silently miss applyEndpointAnchor's own isEnd check.
              const currentIndex = isStart ? 0 : arc.vertices.length - 1
              this.canvas.connector.applyEndpointAnchor(arc, currentIndex, { x, y })
            }
            this.renderer.layer.style.cursor = ""
            this.canvas.updateSymbol(arc)
            this.canvas.snaps.clearSnapToElementLines()
            this.drawSelectedGroup(this.model.symbolsSelected)
          }
        )
      }
      EdgeArcOps.getResizePoints(arc).forEach(({ point, vertexIndex }) => {
        const initialVertexCount = arc.vertices.length
        const isStart = vertexIndex === 0
        const isEnd = vertexIndex === initialVertexCount - 1
        const pointEl = SVGBuilder.createCircle(point, radius, attrs)
        bindArcEl(pointEl, isStart, isEnd)
        group.appendChild(pointEl)
      })
    } else {
      EdgeOps.getEdgeResizePoints(edge).forEach(({ point, vertexIndex }) => {
        const pointEl = SVGBuilder.createCircle(point, radius, attrs)
        bindEl(pointEl, vertexIndex)
        group.appendChild(pointEl)
      })
    }

    return group
  }

  /**
   * Path-based hit area for line/polyline edges — narrow stroke aligned with edge geometry,
   * avoiding the AABB problem where diagonal edges have an oversized clickable rectangle.
   */
  protected createEdgeTranslatePath(edge: TEdge): SVGPathElement {
    let d: string
    switch (edge.kind) {
      case EdgeKind.Arc:
        d = EdgeArcOps.getSVGPath(edge)
        break
      case EdgeKind.Line:
        d = EdgeLineOps.getSVGPath(edge)
        break
      case EdgeKind.PolyEdge:
        d = EdgePolyLineOps.getSVGPath(edge)
        break
    }
    const translateEl = SVGBuilder.createPath({
      role: SvgElementRole.Translate,
      style: "cursor:move",
      fill: "none",
      stroke: "transparent",
      "stroke-width": "16",
      "stroke-linecap": "round",
      d,
    })
    this.#bindPointerDrag(
      translateEl,
      (ev) => {
        this.translate.start(ev.target as Element, this.getPoint(ev))
        this.renderer.layer.style.cursor = "move"
      },
      (ev) => this.translate.continue(this.getPoint(ev)),
      (ev) => {
        this.translate.end(this.getPoint(ev))
        this.renderer.layer.style.cursor = ""
        this.drawSelectedGroup(this.model.symbolsSelected)
      }
    )
    return translateEl
  }

  protected createInteractEdgeGroup(edge: TEdge): SVGGElement | undefined {
    this.logger.info("createInteractEdgeGroup", {
      edge,
    })
    const attrs = {
      id: `selected-${Date.now()}`,
      role: SvgElementRole.InteractElementsGroup,
    }
    const surroundGroup = SVGBuilder.createGroup(attrs)
    const translateEl = this.createEdgeTranslatePath(edge)
    surroundGroup.appendChild(translateEl)
    const resizeDraft = this.model.draftSymbol(edge.id)
    if (resizeDraft && EdgeOps.isEdge(resizeDraft)) {
      surroundGroup.appendChild(this.createEdgeResizeGroup(resizeDraft as TDraft<TEdge>))
    }
    return surroundGroup
  }

  drawSelectedGroup(symbols: TSymbol[]): void {
    if (!symbols.length) {
      return
    }
    this.removeSelectedGroup()
    if (symbols.length === 1 && EdgeOps.isEdge(symbols[0])) {
      this.selectedGroup = this.createInteractEdgeGroup(symbols[0])
    } else {
      this.selectedGroup = this.createInteractElementsGroup(symbols)
    }
    if (this.selectedGroup) {
      this.renderer.layer.appendChild(this.selectedGroup)
      const groupBox = this.selectedGroup.getBBox()

      // Convert SVG coordinates to client coordinates for menu positioning
      const svgElement = this.renderer.layer
      const ctm = svgElement.getScreenCTM()
      if (ctm) {
        const point = svgElement.createSVGPoint()
        point.x = groupBox.x + groupBox.width / 2
        point.y = groupBox.y + groupBox.height
        const screenPoint = point.matrixTransform(ctm)

        const menuParent = this.canvas.menu.context.wrapper?.parentElement
        if (menuParent) {
          const rect = menuParent.getBoundingClientRect()
          this.canvas.menu.context.position.x = screenPoint.x - rect.left
          this.canvas.menu.context.position.y = screenPoint.y - rect.top
        } else {
          this.canvas.menu.context.position.x = screenPoint.x
          this.canvas.menu.context.position.y = screenPoint.y
        }
      }
      this.canvas.menu.context.show()
    }
    this.canvas.menu.update()
  }

  removeSelectedGroup(): void {
    this.logger.info("removeSelectedGroup")
    this.canvas.menu.context.hide()
    this.selectedGroup?.remove()
    this.selectedGroup = undefined
  }

  redrawSelectedGroup(): void {
    this.drawSelectedGroup(this.canvas.model.symbolsSelected)
  }

  hideInteractElements(): void {
    this.canvas.menu.context.hide()
    const query = `[role=${SvgElementRole.Resize}],[role=${SvgElementRole.Rotate}],[role=${SvgElementRole.Translate}]`
    this.selectedGroup?.querySelectorAll(query).forEach((el) => {
      el.setAttribute("visibility", "hidden")
    })
  }

  /**
   * Build selected/covered stroke ID sets from a batch of JIIX groups: `covered` is every stroke
   * the groups account for, `selected` is those in a group overlapping the selection box.
   * Returns null when there are no groups, which callers read as "fall back to stroke overlap".
   */
  #buildGroupSets(
    groups: Array<{ strokeIds: string[]; bounds: TBox }>,
    selectionBox: TBox
  ): { selected: Set<string>; covered: Set<string> } | null {
    if (groups.length === 0) {
      return null
    }

    const selected = new Set<string>()
    const covered = new Set<string>()

    for (const group of groups) {
      group.strokeIds.forEach((id) => covered.add(id))
      if (BoxOps.overlaps(group.bounds, selectionBox)) {
        group.strokeIds.forEach((id) => selected.add(id))
      }
    }

    return { selected, covered }
  }

  /**
   * Build selected/covered stroke ID sets from JIIX text groups.
   * Returns null when no JIIX groups exist (fallback to stroke overlap).
   */
  protected getTextGroupSets(selectionBox: TBox): {
    selected: Set<string>
    covered: Set<string>
  } | null {
    return this.#buildGroupSets(
      this.canvas.jiix.getTextSelectionGroups(this.canvas.configuration.selection.textLevel),
      selectionBox
    )
  }

  /**
   * Build selected/covered stroke ID sets from JIIX math groups.
   * Returns null when no JIIX groups exist (fallback to stroke overlap).
   */
  protected getMathGroupSets(selectionBox: TBox): {
    selected: Set<string>
    covered: Set<string>
  } | null {
    return this.#buildGroupSets(
      this.canvas.jiix.getMathSelectionGroups(this.canvas.configuration.selection.mathLevel),
      selectionBox
    )
  }

  /**
   * Build selected/covered stroke ID sets from JIIX shape (Node/Edge) groups.
   * Returns null when level is "stroke" or no groups exist (fallback to stroke overlap).
   */
  protected getShapeGroupSets(selectionBox: TBox): {
    selected: Set<string>
    covered: Set<string>
  } | null {
    return this.#buildGroupSets(
      this.canvas.jiix.getShapeSelectionGroups(this.canvas.configuration.selection.shapeLevel),
      selectionBox
    )
  }

  start(info: TPointerInfo): void {
    this.removeSelectedGroup()
    this.startSelectionPoint = info.pointer
    this.endSelectionPoint = info.pointer
    this.drawSelectingRect(this.selectionBox!)
  }

  continue(info: TPointerInfo): TSymbol[] {
    if (!this.startSelectionPoint) {
      throw new Error("You need to call startSelectionByBox before")
    }
    this.endSelectionPoint = info.pointer
    const selectionBox = this.selectionBox!
    const updatedSymbols: TSymbol[] = []

    const textSets = this.getTextGroupSets(selectionBox)
    const mathSets = this.getMathGroupSets(selectionBox)
    const shapeSets = this.getShapeGroupSets(selectionBox)

    this.model.symbols.forEach((s) => {
      // Standalone decorators are never directly selectable — selecting one only ever
      // happens by redirect to its targetIds (see onContextMenu).
      if (isDecorator(s)) {
        return
      }

      let shouldBeSelected: boolean

      if (s.type === SymbolType.Stroke) {
        const stroke = s as TStroke
        if (stroke.jiixBlockType === "Text") {
          if (textSets && textSets.covered.has(stroke.id)) {
            shouldBeSelected = textSets.selected.has(stroke.id)
          } else {
            shouldBeSelected = StrokeOps.overlaps(s, selectionBox)
          }
        } else if (stroke.jiixBlockType === "Math") {
          if (mathSets && mathSets.covered.has(stroke.id)) {
            shouldBeSelected = mathSets.selected.has(stroke.id)
          } else {
            shouldBeSelected = StrokeOps.overlaps(s, selectionBox)
          }
        } else if (stroke.jiixBlockType === "Node" || stroke.jiixBlockType === "Edge") {
          if (shapeSets && shapeSets.covered.has(stroke.id)) {
            shouldBeSelected = shapeSets.selected.has(stroke.id)
          } else {
            shouldBeSelected = StrokeOps.overlaps(s, selectionBox)
          }
        } else {
          shouldBeSelected = StrokeOps.overlaps(s, selectionBox)
        }
      } else {
        shouldBeSelected = symbolRegistry.getUtil(s.type)?.overlaps(s, selectionBox) ?? false
      }

      const wasSelected = this.model.selectedIds.has(s.id)
      if (wasSelected !== shouldBeSelected) {
        if (shouldBeSelected) {
          this.model.selectSymbol(s.id)
        } else {
          this.model.unselectSymbol(s.id)
        }
        updatedSymbols.push(s)
        this.renderer.updateSelectedState(s, shouldBeSelected)
      }
    })

    this.drawSelectingRect(selectionBox)
    return updatedSymbols
  }

  /**
   * JIIX block IDs currently qualifying as "selected".
   * In "element" mode: a block qualifies if any of its strokes are selected.
   * In "operand" mode: a block qualifies only if ALL its strokes are selected.
   */
  private getQualifyingMathBlockIds(): string[] {
    const mathLevel = this.canvas.configuration.selection.mathLevel
    const selectedMathStrokes = this.model.symbolsSelected.filter(isRecognizedMath) as TStroke[]

    if (selectedMathStrokes.length === 0) {
      return []
    }

    const blockGroups = new Map<string, TStroke[]>()
    selectedMathStrokes.forEach((stroke) => {
      if (!stroke.jiixBlockId) {
        return
      }
      const group = blockGroups.get(stroke.jiixBlockId) ?? []
      group.push(stroke)
      blockGroups.set(stroke.jiixBlockId, group)
    })

    const qualifyingBlockIds: string[] = []
    for (const [jiixBlockId, strokes] of blockGroups) {
      if (mathLevel === "element") {
        qualifyingBlockIds.push(jiixBlockId)
      } else {
        const allBlockStrokeIds = this.canvas.jiix.getStrokesForElement(jiixBlockId)
        const selectedIds = new Set(strokes.map((s) => s.id))
        if (allBlockStrokeIds.length > 0 && allBlockStrokeIds.every((id) => selectedIds.has(id))) {
          qualifyingBlockIds.push(jiixBlockId)
        }
      }
    }

    return qualifyingBlockIds
  }

  /**
   * Find the JIIX block ID of the single fully-selected math block, if any.
   * Returns undefined when zero or more than one block qualifies.
   */
  getSelectedMathJiixBlockId(): string | undefined {
    const qualifyingBlockIds = this.getQualifyingMathBlockIds()
    return qualifyingBlockIds.length === 1 ? qualifyingBlockIds[0] : undefined
  }

  /**
   * Whether the given math block currently qualifies as selected.
   * Reuses the same per-block coverage rule as {@link getSelectedMathJiixBlockId},
   * without the single-block constraint (supports multi-block selection).
   */
  isMathBlockSelected(jiixBlockId: string): boolean {
    return this.getQualifyingMathBlockIds().includes(jiixBlockId)
  }

  /**
   * In "element" mode, grows the current selection to include, for every math block that has
   * at least one selected source stroke, all of that block's sibling source strokes plus its
   * frozen draw result stroke (if any). No-op in "operand" mode.
   */
  expandSelectionForMathBlocks(): void {
    if (this.canvas.configuration.selection.mathLevel !== "element") {
      return
    }

    const idsToAdd = new Set<string>()
    this.getQualifyingMathBlockIds().forEach((jiixBlockId) => {
      this.canvas.jiix.getStrokesForElement(jiixBlockId).forEach((id) => idsToAdd.add(id))
      this.canvas.math.getStoredSolverOutputs(jiixBlockId)?.forEach((id) => idsToAdd.add(id))
    })

    idsToAdd.forEach((id) => {
      if (this.model.selectedIds.has(id)) {
        return
      }
      this.model.selectSymbol(id)
      const symbol = this.model.symbols.find((s) => s.id === id)
      if (symbol) {
        this.renderer.updateSelectedState(symbol, true)
      }
    })
  }

  /**
   * For every selected stroke that belongs to a Node or Edge JIIX block, pull in all sibling
   * strokes of that block — unconditionally (unlike expandSelectionForMathBlocks, this doesn't
   * gate on selection.mathLevel; shape/edge blocks always move as one rigid group so that
   * connected-edge live-follow has a consistent group bounds to work with).
   */
  expandSelectionForBlocks(): void {
    const blockIds = new Set<string>()
    this.model.symbolsSelected.forEach((s) => {
      if (isStroke(s) && s.jiixBlockId && (s.jiixBlockType === "Node" || s.jiixBlockType === "Edge")) {
        blockIds.add(s.jiixBlockId)
      }
    })
    blockIds.forEach((blockId) => {
      this.canvas.jiix.getStrokesForElement(blockId).forEach((id) => {
        if (!this.model.selectedIds.has(id)) {
          const sym = this.model.getRootSymbol(id)
          if (sym) {
            this.model.selectSymbol(id)
            this.renderer.updateSelectedState(sym, true)
          }
        }
      })
    })
  }

  end(info: TPointerInfo): TSymbol[] {
    const updatedSymbols = this.continue(info)
    this.expandSelectionForMathBlocks()
    this.expandSelectionForBlocks()
    this.startSelectionPoint = undefined
    this.endSelectionPoint = undefined
    this.clearSelectingRect()
    this.drawSelectedGroup(this.model.symbolsSelected)
    this.canvas.menu.style.update()

    // Notify math interactions system of selection changes
    const selectedMathJiixBlockId = this.getSelectedMathJiixBlockId()
    if (selectedMathJiixBlockId) {
      this.canvas.math.selectBlock(selectedMathJiixBlockId)
    } else {
      this.canvas.math.clearBlockSelection()
    }

    // Defer external event so synchronous user callbacks don't block pointer-up completion
    setTimeout(() => this.canvas.event.emitSelected(this.model.symbolsSelected), 0)
    return updatedSymbols
  }

  protected async onContextMenu(info: TPointerInfo): Promise<void> {
    let found = false
    let currentEl = info.target as HTMLElement | null
    const symbolTypesAllowed = [
      SymbolType.Decorator,
      SymbolType.Edge,
      SymbolType.Shape,
      SymbolType.Stroke,
      SymbolType.Text,
    ]
    while (currentEl && currentEl.tagName !== "svg" && !found) {
      if (symbolTypesAllowed.includes(currentEl.getAttribute("type") as SymbolType)) {
        found = true
      } else {
        currentEl = currentEl.parentElement
      }
    }
    this.canvas.unselectAll()
    if (currentEl?.id) {
      const sym = this.canvas.model.symbols.find((s) => s.id === currentEl!.id)
      if (sym && isDecorator(sym)) {
        this.canvas.select((sym as TDecorator).targetIds)
      } else {
        this.canvas.select([currentEl.id])
      }
    } else {
      // Use clientX/clientY relative to the menu's parent container
      // The menu is attached to the UI layer, so we need its bounding rect
      const menuParent = this.canvas.menu.context.wrapper?.parentElement
      if (menuParent) {
        const rect = menuParent.getBoundingClientRect()
        this.canvas.menu.context.position.x = info.clientX - rect.left
        this.canvas.menu.context.position.y = info.clientY - rect.top
      } else {
        // Fallback: use viewport coordinates directly
        this.canvas.menu.context.position.x = info.clientX
        this.canvas.menu.context.position.y = info.clientY
      }
      this.canvas.menu.context.show()
    }
  }
}
