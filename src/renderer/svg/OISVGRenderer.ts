import { SvgElementRole } from "../../Constants"
import { TRenderingConfiguration } from "../../configuration"
import { LoggerClass, LoggerManager } from "../../logger"
import { TOISymbol, TPoint, TBoundingBox, Box, OIEraser } from "../../primitive"
import { getClosestPoints } from "../../utils"
import { OISVGRendererEraserUtil } from "./OISVGRendererEraserUtil"
import { OISVGRendererUtil } from "./OISVGRendererUtil"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export const NO_SELECTION = "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group Renderer
 */
export class OISVGRenderer
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)
  groupGuidesId = "guides-wrapper"
  selectionFilterId = "selection-filter"
  removalFilterId = "removal-filter"
  arrowHeadStartMarker = "arrow-head-start"
  arrowHeadEndMaker = "arrow-head-end"
  crossMarker = "cross-head"

  configuration: TRenderingConfiguration
  parent!: HTMLElement
  layer!: SVGElement
  definitionGroup!: SVGGElement

  util: OISVGRendererUtil

  eraserUtil: OISVGRendererEraserUtil

  verticalGuides: number[] = []
  horizontalGuides: number[] = []

  constructor(configuration: TRenderingConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration

    this.util = new OISVGRendererUtil(this.selectionFilterId, this.removalFilterId, this.arrowHeadStartMarker, this.arrowHeadEndMaker)

    this.eraserUtil = new OISVGRendererEraserUtil()
  }

  protected initLayer(): void
  {
    const width = Math.max(this.configuration.minWidth, this.parent.clientWidth)
    const height = Math.max(this.configuration.minHeight, this.parent.clientHeight)
    this.layer = SVGBuilder.createLayer({ x: 0, y: 0, width, height })
    this.layer.style.setProperty("height", "auto")
    this.layer.style.setProperty("width", "auto")
    this.layer.appendChild(this.createSVGTools())
    this.parent.style.setProperty("overflow", "auto")
    this.parent.appendChild(this.layer)
  }

  protected createDefs(): SVGDefsElement
  {
    const defs = SVGBuilder.createDefs()

    const SIZE = 5
    const REFX = SIZE - 1, REFY = SIZE / 2
    const arrowHeadMarkerAttrs = {
      style: NO_SELECTION,
      fill: "context-stroke",
      markerWidth: SIZE.toString(),
      markerHeight: SIZE.toString(),
      refX: REFX.toString(),
      refY: REFY.toString(),
    }

    const arrowHeadStart = SVGBuilder.createMarker(this.arrowHeadStartMarker, { ...arrowHeadMarkerAttrs, orient: "auto-start-reverse" })
    arrowHeadStart.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadStart)

    const arrowHeadEnd = SVGBuilder.createMarker(this.arrowHeadEndMaker, { ...arrowHeadMarkerAttrs, orient: "auto" })
    arrowHeadEnd.appendChild(SVGBuilder.createPolygon([0, 0, SIZE, REFY, 0, SIZE], arrowHeadMarkerAttrs))
    defs.appendChild(arrowHeadEnd)

    const crossMarkerAttrs = {
      style: NO_SELECTION,
      markerWidth: "5",
      markerHeight: "5",
      refX: "0",
      refY: "0",
      viewBox: "-5 -5 10 10"
    }
    const cross = SVGBuilder.createMarker(this.crossMarker, crossMarkerAttrs)
    cross.appendChild(SVGBuilder.createPath({ d: "M -4,-4 L 4,4 M -4,4 L 4,-4", stroke: "white", "stroke-width": "3" }))
    cross.appendChild(SVGBuilder.createPath({ d: "M -4,-4 L 4,4 M -4,4 L 4,-4", stroke: "context-stroke", "stroke-width": "2" }))
    defs.appendChild(cross)

    return defs
  }

  protected createFilters(): SVGGElement
  {
    const filtersGroup = SVGBuilder.createGroup({ id: "definition-group" })
    const removalFilter = SVGBuilder.createFilter(this.removalFilterId, { filterUnits: "userSpaceOnUse" })
    const bfeComponentTransfer = SVGBuilder.createComponentTransfert()
    const bfeFuncA = SVGBuilder.createTransfertFunctionTable("feFuncA", "0 0.25")
    bfeComponentTransfer.appendChild(bfeFuncA)
    removalFilter.appendChild(bfeComponentTransfer)
    filtersGroup.appendChild(removalFilter)

    const selectionFilter = SVGBuilder.createFilter(this.selectionFilterId, { filterUnits: "userSpaceOnUse" })
    selectionFilter.appendChild(SVGBuilder.createDropShadow({ dx: -1, dy: -1, deviation: 1 }))
    filtersGroup.appendChild(selectionFilter)

    return filtersGroup
  }

  protected drawGuides(): void
  {
    this.verticalGuides = []
    this.horizontalGuides = []
    const height = Number(this.layer.getAttribute("height")?.replace("px", ""))
    const width = Number(this.layer.getAttribute("width")?.replace("px", ""))
    const offSet = this.configuration.guides.gap
    const subOffSet = this.configuration.guides.gap / 5
    const attrs = {
      id: this.groupGuidesId,
      stroke: "grey",
      opacity: "0.5",
      style: NO_SELECTION,
      role: SvgElementRole.Guide
    }
    const guidesGroup = SVGBuilder.createGroup(attrs)
    switch (this.configuration.guides.type) {
      case "line":
        for (let y = offSet; y < height; y += offSet) {
          const begin: TPoint = { x: offSet, y }
          const end: TPoint = { x: width - offSet, y }
          this.horizontalGuides.push(y)
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
        }
        break
      case "grid":
        for (let y = 0; y < height; y += offSet) {
          const begin: TPoint = { x: 0, y }
          const end: TPoint = { x: width, y }
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
          this.horizontalGuides.push(y)
          for (let subY = y + subOffSet; subY < y + offSet; subY += subOffSet) {
            this.horizontalGuides.push(subY)
            const svgLine = SVGBuilder.createLine({ x: 0, y: subY }, { x: width, y: subY }, { "stroke-width": "0.25", style: NO_SELECTION })
            guidesGroup.appendChild(svgLine)
          }
        }
        for (let x = 0; x < width; x += offSet) {
          const begin: TPoint = { x, y: 0 }
          const end: TPoint = { x, y: height }
          const svgLine = SVGBuilder.createLine(begin, end, { "stroke-width": "1", style: NO_SELECTION })
          guidesGroup.appendChild(svgLine)
          this.verticalGuides.push(x)
          for (let subX = x + subOffSet; subX < x + offSet; subX += subOffSet) {
            this.verticalGuides.push(subX)
            const svgLine = SVGBuilder.createLine({ x: subX, y: 0 }, { x: subX, y: height }, { "stroke-width": "0.25", style: NO_SELECTION })
            guidesGroup.appendChild(svgLine)
          }
        }
        break
      case "point":
        for (let x = offSet; x < width; x += offSet) {
          this.verticalGuides.push(x)
          for (let y = offSet; y < height; y += offSet) {
            this.horizontalGuides.push(y)
            const svgPoint = SVGBuilder.createCircle({ x, y }, 1)
            guidesGroup.appendChild(svgPoint)
          }
        }
        break
      default:
        this.#logger.error("drawGuides", `Guide type unknow: ${ this.configuration.guides.type }`)
        break
    }
    this.horizontalGuides = [...new Set(this.horizontalGuides)]
    this.verticalGuides = [...new Set(this.verticalGuides)]
    this.definitionGroup.appendChild(guidesGroup)
  }

  protected removeGuides(): void
  {
    this.verticalGuides = []
    this.horizontalGuides = []
    this.layer.querySelector(`#${ this.groupGuidesId }`)?.remove()
  }

  protected createSVGTools(): SVGGElement
  {
    this.definitionGroup = SVGBuilder.createGroup({ id: "definition-group" })
    this.definitionGroup.appendChild(this.createDefs())
    this.definitionGroup.appendChild(this.createFilters())
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
    return this.definitionGroup
  }

  init(element: HTMLElement): void
  {
    this.#logger.info("init", { element })
    this.parent = element
    this.parent.oncontextmenu = () => false
    this.initLayer()
  }

  getAttribute(id: string, name: string): string
  {
    const element = this.layer.querySelector(`#${ id }`) as HTMLElement | null
    return element?.getAttribute(name) as string
  }

  setAttribute(id: string, name: string, value: string): void
  {
    const element = this.layer.querySelector(`#${ id }`) as HTMLElement | null
    element?.setAttribute(name, value)
  }

  prependElement(el: Element): void
  {
    this.layer.prepend(el)
  }

  changeOrderSymbol(symbolToMove: TOISymbol, position: "first" | "last" | "forward" | "backward"): void
  {
    const moveEl = this.layer.querySelector(`#${ symbolToMove.id }`)
    if (!moveEl) return
    switch (position) {
      case "first":
        this.definitionGroup.insertAdjacentElement("afterend", moveEl)
        break
      case "last":
        this.layer.insertAdjacentElement("beforeend", moveEl)
        break
      case "forward":
        moveEl.nextElementSibling?.insertAdjacentElement("afterend", moveEl)
        break
      case "backward":
        if (moveEl.previousElementSibling !== this.definitionGroup) {
          moveEl.previousElementSibling?.insertAdjacentElement("beforebegin", moveEl)
        }
        break
    }
  }

  appendElement(el: Element): void
  {
    this.layer.appendChild(el)
  }

  removeElement(id: string): void
  {
    this.#logger.debug("Element", { id })
    const oldStroke = this.layer.querySelector(`#${ id }`)
    if (oldStroke) {
      oldStroke.remove()
    }
  }

  drawSymbol(symbol: TOISymbol | OIEraser): SVGGraphicsElement | undefined
  {
    this.#logger.debug("drawSymbol", { symbol })
    const oldNode = this.layer.querySelector(`#${ symbol?.id }`)
    const svgEl = this.util.getSymbolElement(symbol)

    if (svgEl) {
      if (oldNode) {
        oldNode.replaceWith(svgEl)
      }
      else {
        this.layer.appendChild(svgEl)
      }
    }
    return svgEl
  }

  replaceSymbol(id: string, symbols: TOISymbol[]): SVGGraphicsElement[] | undefined
  {
    this.#logger.debug("drawSymbol", { symbols })
    const oldNode = this.layer.querySelector(`#${ id }`)
    const elements = symbols.map(s => this.util.getSymbolElement(s)).filter(x => !!x) as SVGGraphicsElement[]

    if (elements.length) {
      if (oldNode) {
        elements.forEach(e => oldNode.insertAdjacentElement("beforebegin", e))
        oldNode.remove()
      }
      else {
        elements.forEach(e => this.layer.appendChild(e))
      }
    }
    return elements
  }

  removeSymbol(id: string): void
  {
    this.#logger.debug("removeSymbol", { id })
    this.removeElement(id)
  }

  drawCircle(point: TPoint, radius: number, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawCircle", { point, radius, attrs })
    this.layer.appendChild(SVGBuilder.createCircle(point, radius, attrs))
  }

  drawRect(box: TBoundingBox, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawCircle", { box, attrs })
    this.layer.appendChild(SVGBuilder.createRect(box, attrs))
  }

  drawLine(p1: TPoint, p2: TPoint, attrs: { [key: string]: string } = {}): void
  {
    this.#logger.info("drawLine", { p1, p2, attrs })
    const line = SVGBuilder.createLine(p1, p2, attrs)
    this.layer.appendChild(line)
  }

  drawConnectionBetweenBox(id: string, box1: TBoundingBox, box2: TBoundingBox, attrs?: { [key: string]: string }): void
  {
    const points1: TPoint[] = new Box(box1).corners
    const points2: TPoint[] = new Box(box2).corners
    const { p1, p2 } = getClosestPoints(points1, points2)
    const attrsLine = {
      id,
      fill: "transparent",
      style: NO_SELECTION,
      ...attrs
    }
    this.drawLine(p1, p2, attrsLine)
  }

  resize(height: number, width: number): void
  {
    this.#logger.info("resize", { height, width })
    this.layer.setAttribute("width", `${ width }px`)
    this.layer.setAttribute("height", `${ height }px`)
    this.layer.setAttribute("viewBox", `0, 0, ${ width }, ${ height }`)
    this.removeGuides()
    if (this.configuration.guides.enable) {
      this.drawGuides()
    }
  }

  getElementById(id: string): SVGGraphicsElement | null
  {
    return this.layer.querySelector(`#${ id }`) as SVGGraphicsElement | null
  }

  getElements({ tagName, attrs }: { tagName?: string, attrs?: { [key: string]: string } }): NodeListOf<Element>
  {
    this.#logger.info("getElements", { tagName, attrs })
    let query = tagName || "*"
    if (attrs) {
      Object.keys(attrs).forEach(k =>
      {
        query += `[${ k }=${ attrs[k] }]`
      })
    }
    return this.layer.querySelectorAll(query)
  }

  clearElements({ tagName, attrs }: { tagName?: string, attrs?: { [key: string]: string } }): void
  {
    this.#logger.info("clearElements", { tagName, attrs })
    this.getElements({ tagName, attrs })
      .forEach(e => e.remove())
  }

  clear(): void
  {
    this.#logger.info("clear")
    while (this.layer.firstChild) {
      this.layer.firstChild.remove()
    }
    this.layer.appendChild(this.createSVGTools())
  }

  destroy(): void
  {
    if (this.parent) {
      while (this.parent.firstChild) {
        this.parent.firstChild.remove()
      }
    }
  }
}
