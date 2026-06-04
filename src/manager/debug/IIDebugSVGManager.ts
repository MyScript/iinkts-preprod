import { LoggerManager, LoggerCategory } from "@/logger"
import { IIModel, JIIXEdgeKind } from "@/model"
import { Box, TBox, TIISymbol, isText } from "@/symbol"
import { SVGRenderer, SVGRendererConst, SVGBuilder } from "@/renderer"
import { convertBoundingBoxMillimeterToPixel } from "@/utils"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"

/**
 * @group Manager
 */
export class IIDebugSVGManager
{
  // Constants for debug box styling
  private static readonly DEBUG_BOX_STYLES = {
    PADDING: 4,
    FONT_SIZE: 12,
    LINE_HEIGHT: 14,
    RECOGNITION_BOX_COLOR: "green",
    RECOGNITION_ITEM_BOX_COLOR: "blue"
  }

  #logger = LoggerManager.getLogger(LoggerCategory.SVGDEBUG)
  #snapPointsVisibility = false
  #verticesVisibility = false
  #boundingBoxVisibility = false
  #recognitionBoxVisibility = false
  #recognitionItemBoxVisibility = false
  #previousRecognitionBoxes: Map<string, string> = new Map()
  #previousRecognitionItemBoxes: Map<string, string> = new Map()

  editor: InteractiveInkEditor

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get snapPointsVisibility(): boolean
  {
    return this.#snapPointsVisibility
  }
  set snapPointsVisibility(show: boolean)
  {
    this.#snapPointsVisibility = show
    this.debugSnapPoints()
  }

  get verticesVisibility(): boolean
  {
    return this.#verticesVisibility
  }
  set verticesVisibility(show: boolean)
  {
    this.#verticesVisibility = show
    this.debugVertices()
  }

  get boundingBoxVisibility(): boolean
  {
    return this.#boundingBoxVisibility
  }
  set boundingBoxVisibility(show: boolean)
  {
    this.#boundingBoxVisibility = show
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.#boundingBoxVisibility ? this.showBoundingBox() : this.hideBoundingBox()
  }

  get recognitionBoxVisibility(): boolean
  {
    return this.#recognitionBoxVisibility
  }
  set recognitionBoxVisibility(show: boolean)
  {
    this.#recognitionBoxVisibility = show
    this.debugRecognitionBox()
  }

  get recognitionItemBoxVisibility(): boolean
  {
    return this.#recognitionItemBoxVisibility
  }
  set recognitionItemBoxVisibility(show: boolean)
  {
    this.#recognitionItemBoxVisibility = show
    this.debugRecognitionItemBox()
  }

  protected showSnapPoints(): void
  {
    this.#logger.info("showSnapPoints")
    if (this.model.currentSymbol) {
      this.model.currentSymbol.snapPoints.forEach(p => this.renderer.drawCircle(p, 2, { fill: "blue", "debug": "snap-points" }))
    }
    this.model.symbols.forEach(s => s.snapPoints.forEach(p => this.renderer.drawCircle(p, 2, { fill: "blue", "debug": "snap-points" })))
  }
  protected hideSnapPoints(): void
  {
    this.#logger.info("hideSnapPoints")
    this.renderer.clearElements({ attrs: { "debug": "snap-points" } })
  }
  debugSnapPoints(): void
  {
    this.hideSnapPoints()
    if (this.snapPointsVisibility) {
      this.showSnapPoints()
    }
  }

  protected showVertices(): void
  {
    this.#logger.info("showVertices")
    if (this.model.currentSymbol) {
      this.model.currentSymbol.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", "debug": "vertices" }))
    }
    this.model.symbols.forEach(s => s.vertices.forEach(p => this.renderer.drawCircle(p, 2, { fill: "red", "debug": "vertices" })))
  }
  protected hideVertices(): void
  {
    this.#logger.info("hideVertices")
    this.renderer.clearElements({ attrs: { "debug": "vertices" } })
  }
  debugVertices(): void
  {
    this.hideVertices()
    if (this.verticesVisibility) {
      this.showVertices()
    }
  }

  protected drawBoundingBox(symbols: TIISymbol[]): void
  {
    const symbolAttrs = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "red",
      "stroke-width": "1",
      "stroke-dasharray": "5 5",
      "vector-effect": "non-scaling-stroke",
      "debug": "bounding-box"
    }
    const charAttrs = {
      style: "pointer-events: none",
      fill: "transparent",
      stroke: "orange",
      "stroke-width": "1",
      "stroke-dasharray": "0 5 0",
      "vector-effect": "non-scaling-stroke",
      "debug": "bounding-box"
    }
    symbols.forEach(s =>
    {
      const symEl = this.renderer.getElementById(s.id)
      if (symEl) {
        if (isText(s)) {
          let transform: string = ""
          if (s.rotation) {
            transform = `rotate(${ s.rotation.degree }, ${ s.rotation.center.x }, ${ s.rotation.center.y })`
          }
          s.chars.forEach(c =>
          {
            const ca = {
              ...charAttrs,
              char: c.label,
              transform
            }
            symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(c.bounds, ca))
          })
          const sa = {
            ...symbolAttrs,
            symbol: s.id,
            transform
          }
          symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.bounds, sa))
        }
        else {
          const sa = {
            ...symbolAttrs,
            symbol: s.id,
          }
          symEl.insertAdjacentElement("beforebegin", SVGBuilder.createRect(s.bounds, sa))
        }
      }
    })
  }
  protected showBoundingBox(): void
  {
    this.#logger.info("showBoundingBox")
    if (this.model.currentSymbol) {
      this.drawBoundingBox([this.model.currentSymbol])
    }
    this.drawBoundingBox(this.model.symbols)
  }
  protected hideBoundingBox(): void
  {
    this.#logger.info("hideBoundingBox")
    this.renderer.clearElements({ attrs: { "debug": "bounding-box" } })
  }
  debugBoundingBox(): void
  {
    this.hideBoundingBox()
    if (this.boundingBoxVisibility) {
      this.showBoundingBox()
    }
  }

  protected drawDebugBox(box: TBox, color: string, debugType: string, infos?: string[], boxId?: string): void
  {
    const { PADDING, FONT_SIZE, LINE_HEIGHT } = IIDebugSVGManager.DEBUG_BOX_STYLES
    const groupAttrs: Record<string, string> = { "debug": debugType }
    if (boxId) {
      groupAttrs["box-id"] = boxId
    }
    const group = SVGBuilder.createGroup(groupAttrs)

    const rect = SVGBuilder.createRect(box, { fill: "transparent", stroke: color, "stroke-width": "1", style: SVGRendererConst.noSelection })
    group.appendChild(rect)

    if (infos && infos.length > 0) {
      const textGroup = SVGBuilder.createGroup({})
      let currentY = box.y - PADDING

      infos.forEach((info) => {
        const textElement = SVGBuilder.createText(
          { x: box.x, y: currentY },
          info,
          {
            fill: color,
            "font-size": FONT_SIZE.toString(),
            "font-family": "monospace",
            style: SVGRendererConst.noSelection
          }
        )
        textGroup.appendChild(textElement)
        currentY -= LINE_HEIGHT
      })

      group.appendChild(textGroup)

      const textBBox = textGroup.getBBox()
      const bgRect = SVGBuilder.createRect(
        {
          x: textBBox.x - PADDING / 2,
          y: textBBox.y - PADDING / 2,
          width: textBBox.width + PADDING,
          height: textBBox.height + PADDING
        },
        {
          fill: "white",
          stroke: color,
          "stroke-width": "1",
          style: SVGRendererConst.noSelection
        }
      )
      group.insertBefore(bgRect, textGroup)
    }

    this.renderer.layer.appendChild(group)
  }

  protected trackAndDrawBox(
    boxId: string,
    box: TBox,
    infos: string[],
    debugType: string,
    color: string,
    currentBoxes: Map<string, string>,
    previousBoxes: Map<string, string>
  ): void
  {
    const boxData = JSON.stringify({ box, infos })
    currentBoxes.set(boxId, boxData)
    if (previousBoxes.get(boxId) !== boxData) {
      this.renderer.clearElements({ attrs: { "debug": debugType, "box-id": boxId } })
      this.drawDebugBox(box, color, debugType, infos, boxId)
    }
  }

  protected drawRecognitionBox(box: TBox, infos?: string[], boxId?: string): void
  {
    this.drawDebugBox(box, IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, "recognition-box", infos, boxId)
  }

  protected async showRecognitionBox(): Promise<void>
  {
    this.#logger.info("showRecognitionBox")
    await this.editor.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("showRecognitionBox", { jiix })
    if (jiix) {
      if (!jiix["bounding-box"]) {
        this.#logger.warn("drawRecognitionBox", "You must to enabled configuration.recognition.exports[\"bounding-box\"]")
        return
      }
      const currentBoxes = new Map<string, string>()
      jiix.elements?.forEach((el, elIndex) =>
      {
        switch (el.type) {
          case "Node": {
            if (el["bounding-box"]) {
              const boxId = `node-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`type: ${el.type}`, `kind: ${el.kind}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, currentBoxes, this.#previousRecognitionBoxes)
            }
            break
          }
          case "Text": {
            if (el["bounding-box"]) {
              const boxId = `text-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`type: ${el.type}`, `label: ${el.label || ""}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, currentBoxes, this.#previousRecognitionBoxes)
            }
            break
          }
          case "Math": {
            if (el["bounding-box"]) {
              const boxId = `math-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`type: ${el.type}`, `label: ${el.label || ""}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, currentBoxes, this.#previousRecognitionBoxes)
            }
            break
          }
          case "Edge": {
            if (el.kind === JIIXEdgeKind.PolyEdge) {
              const boxId = `edge-poly-${elIndex}`
              const infos = [`type: ${el.type}`, `kind: ${el.kind}`]
              const box = convertBoundingBoxMillimeterToPixel(Box.createFromBoxes(el.edges.map(e => e["bounding-box"] as TBox)))
              this.trackAndDrawBox(boxId, box, infos, "recognition-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, currentBoxes, this.#previousRecognitionBoxes)
            }
            else if (el["bounding-box"]) {
              const boxId = `edge-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`type: ${el.type}`, `kind: ${el.kind}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_BOX_COLOR, currentBoxes, this.#previousRecognitionBoxes)
            }
            break
          }
          default: {
            this.#logger.warn("drawRecognitionBox", `Unknown jiix element type: ${ (el as { type: string }).type }`)
            break
          }
        }
      })

      this.#previousRecognitionBoxes.forEach((_, boxId) => {
        if (!currentBoxes.has(boxId)) {
          this.renderer.clearElements({ attrs: { "debug": "recognition-box", "box-id": boxId } })
        }
      })
      this.#previousRecognitionBoxes = currentBoxes
    }
  }
  protected clearRecognitionBox(): void
  {
    this.#logger.info("clearRecognitionBox")
    this.renderer.clearElements({ attrs: { "debug": "recognition-box" } })
  }
  async debugRecognitionBox(): Promise<void>
  {
    if (this.#recognitionBoxVisibility) {
      await this.showRecognitionBox()
    } else {
      this.clearRecognitionBox()
      this.#previousRecognitionBoxes.clear()
    }
  }

  protected drawRecognitionItemBox(box: TBox, label?: string, chars?: string[], boxId?: string): void
  {
    const infoParts: string[] = []
    if (label) {
      infoParts.push(`label: ${label}`)
    }
    if (chars?.length) {
      infoParts.push(`[${chars.join(", ")}]`)
    }

    this.drawDebugBox(box, IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, "recognition-item-box", infoParts, boxId)
  }

  protected drawMathExpressions(expressions: { type: string; label?: string; "bounding-box"?: TBox; operands?: unknown[] }[], depth: number = 0, parentId: string = "", currentBoxes?: Map<string, string>): void
  {
    expressions?.forEach((expr, exprIndex) =>
    {
      if (expr?.["bounding-box"]) {
        const boxId = `${parentId}-expr-${depth}-${exprIndex}`
        const box = convertBoundingBoxMillimeterToPixel(expr["bounding-box"])
        const label = `${ expr.type }${ expr.label ? `: ${ expr.label }` : "" }`
        const infos = [`label: ${label}`]
        this.trackAndDrawBox(boxId, box, infos, "recognition-item-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, currentBoxes!, this.#previousRecognitionItemBoxes)
      }

      if (expr?.operands) {
        this.drawMathExpressions(expr.operands as { type: string; label?: string; "bounding-box"?: TBox; operands?: unknown[] }[], depth + 1, `${parentId}-expr-${depth}-${exprIndex}`, currentBoxes)
      }
    })
  }

  protected async showRecognitionItemBox(): Promise<void>
  {
    this.#logger.info("showRecognitionBoxItem")
    await this.editor.export(["application/vnd.myscript.jiix"])
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("showRecognitionBoxItem", { jiix })
    if (jiix) {
      const currentBoxes = new Map<string, string>()
      jiix.elements?.forEach((el, elIndex) =>
      {
        switch (el.type) {
          case "Text": {
            el.chars?.forEach((c, cIndex) =>
            {
              if (c?.["bounding-box"]) {
                const boxId = `text-${elIndex}-char-${cIndex}`
                const box = convertBoundingBoxMillimeterToPixel(c["bounding-box"])
                const infos: string[] = []
                if (c.label) {
                  infos.push(`label: ${c.label}`)
                }
                if (c.candidates?.length) {
                  infos.push(`[${c.candidates.join(", ")}]`)
                }
                this.trackAndDrawBox(boxId, box, infos, "recognition-item-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, currentBoxes, this.#previousRecognitionItemBoxes)
              }
            })
            break
          }
          case "Math": {
            if (el.expressions) {
              this.drawMathExpressions(el.expressions, 0, `math-${elIndex}`, currentBoxes)
            }
            break
          }
          case "Node": {
            if (el?.["bounding-box"]) {
              const boxId = `node-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`label: ${el.kind}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-item-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, currentBoxes, this.#previousRecognitionItemBoxes)
            }
            break
          }
          case "Edge": {
            if (el.kind === JIIXEdgeKind.PolyEdge) {
              el.edges.forEach((e, eIndex) =>
              {
                const boxId = `edge-poly-${elIndex}-sub-${eIndex}`
                const box = convertBoundingBoxMillimeterToPixel(e["bounding-box"])
                const infos = [`label: ${e.kind}`]
                this.trackAndDrawBox(boxId, box, infos, "recognition-item-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, currentBoxes, this.#previousRecognitionItemBoxes)
              })
            }
            else if (el["bounding-box"]) {
              const boxId = `edge-${elIndex}`
              const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
              const infos = [`label: ${el.kind}`]
              this.trackAndDrawBox(boxId, box, infos, "recognition-item-box", IIDebugSVGManager.DEBUG_BOX_STYLES.RECOGNITION_ITEM_BOX_COLOR, currentBoxes, this.#previousRecognitionItemBoxes)
            }
            break
          }
          default:
            this.#logger.warn("drawRecognitionBoxItem", `Unknown jiix element type: ${ (el as { type: string }).type }`)
            break
        }
      })
      this.#previousRecognitionItemBoxes.forEach((_, boxId) => {
        if (!currentBoxes.has(boxId)) {
          this.renderer.clearElements({ attrs: { "debug": "recognition-item-box", "box-id": boxId } })
        }
      })
      this.#previousRecognitionItemBoxes = currentBoxes
    }
  }
  protected clearRecognitionItemBox(): void
  {
    this.#logger.info("clearRecognitionBoxItem")
    this.renderer.clearElements({ attrs: { "debug": "recognition-item-box" } })
  }
  async debugRecognitionItemBox(): Promise<void>
  {
    if (this.#recognitionItemBoxVisibility) {
      await this.showRecognitionItemBox()
    } else {
      this.clearRecognitionItemBox()
      this.#previousRecognitionItemBoxes.clear()
    }
  }

  apply(): void
  {
    this.debugBoundingBox()
    this.debugVertices()
    this.debugSnapPoints()
    this.debugRecognitionBox()
    this.debugRecognitionItemBox()
  }
}
