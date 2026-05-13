import { LoggerManager, LoggerCategory } from "../../logger"
import { SVGRenderer, SVGBuilder, SVGRendererConst } from "../../renderer"
import { IIModel } from "../../model"
import { TBox, TIISymbol, IIRecognizedMath, RecognizedKind, SymbolType } from "../../symbol"
import { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import { VariableColorManager } from "./VariableColorManager"

/**
 * Visual overlay configuration
 * @group Manager
 */
export type TMathOverlayConfig = {
  showBlockOverlays: boolean
  showResultPanels: boolean
  badgeSize: number
  borderWidth: number
  panelPadding: number
}

/**
 * Manages visual overlays for recognized math symbols (RecognizedKind.Math):
 * - Badges (∑ for math blocks)
 * - Borders around blocks
 * - Result panels with connection lines
 *
 * @group Manager
 */
export class MathOverlayManager {
  private static readonly DEFAULT_CONFIG: TMathOverlayConfig = {
    showBlockOverlays: false,
    showResultPanels: false,
    badgeSize: 20,
    borderWidth: 2,
    panelPadding: 8,
  }

  private static readonly BADGE_STYLES = {
    MATH: "∑",
    BACKGROUND: "#ffffff",
    BORDER: "#cccccc",
    FONT_SIZE: 14,
    OFFSET: 4,
  }

  private static readonly OVERLAY_PREFIXES = [
    "badge",
    "border",
    "result-panel",
    "result-connection",
    "hover-zone"
  ] as const

  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #config: TMathOverlayConfig
  #colorManager: VariableColorManager

  editor: InteractiveInkEditor
  renderer: SVGRenderer

  constructor(editor: InteractiveInkEditor, config: Partial<TMathOverlayConfig> = {}) {
    this.#logger.info("constructor")
    this.editor = editor
    this.renderer = editor.renderer
    this.#config = { ...MathOverlayManager.DEFAULT_CONFIG, ...config }
    this.#colorManager = VariableColorManager.getInstance()
  }

  get model(): IIModel {
    return this.editor.model
  }

  updateConfig(config: Partial<TMathOverlayConfig>): void {
    this.#logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
    this.refresh()
  }

  getConfig(): TMathOverlayConfig {
    return { ...this.#config }
  }

  protected drawBadge(box: TBox, id: string): void {
    const badgeId = `badge-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")

    this.renderer.removeSymbol(badgeId)

    if (!this.#config.showBlockOverlays) {
      return
    }

    const size = this.#config.badgeSize
    const offset = MathOverlayManager.BADGE_STYLES.OFFSET

    const badgeX = box.x - offset - size
    const badgeY = box.y - offset - size

    const badgeGroup = SVGBuilder.createGroup({
      id: badgeId,
      "data-overlay": "badge",
      "data-block-id": id
    })

    const circle = SVGBuilder.createCircle(
      { x: badgeX + size / 2, y: badgeY + size / 2 },
      size / 2,
      {
        fill: MathOverlayManager.BADGE_STYLES.BACKGROUND,
        stroke: MathOverlayManager.BADGE_STYLES.BORDER,
        "stroke-width": "1",
        style: SVGRendererConst.noSelection
      }
    )
    badgeGroup.appendChild(circle)

    const text = SVGBuilder.createText(
      { x: badgeX + size / 2, y: badgeY + size / 2 + 5 },
      MathOverlayManager.BADGE_STYLES.MATH,
      {
        fill: "#000000",
        "font-size": MathOverlayManager.BADGE_STYLES.FONT_SIZE.toString(),
        "font-weight": "bold",
        "text-anchor": "middle",
        style: SVGRendererConst.noSelection
      }
    )
    badgeGroup.appendChild(text)

    this.renderer.layer.appendChild(badgeGroup)
  }

  protected drawBorder(box: TBox, id: string, color: string = "#cccccc", dashArray?: string): void {
    const borderId = `border-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")

    this.renderer.removeSymbol(borderId)

    if (!this.#config.showBlockOverlays) {
      return
    }

    const attrs: Record<string, string> = {
      id: borderId,
      fill: "transparent",
      stroke: color,
      "stroke-width": this.#config.borderWidth.toString(),
      "data-overlay": "border",
      "data-block-id": id,
      style: SVGRendererConst.noSelection
    }

    if (dashArray) {
      attrs["stroke-dasharray"] = dashArray
    }

    const rect = SVGBuilder.createRect(box, attrs)
    this.renderer.layer.appendChild(rect)
  }

  protected drawResultPanel(box: TBox, id: string, resultText: string): void {
    const panelId = `result-panel-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    const connectionId = `result-connection-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")

    this.renderer.removeSymbol(panelId)
    this.renderer.removeSymbol(connectionId)

    if (!this.#config.showResultPanels || !resultText) {
      return
    }

    const padding = this.#config.panelPadding
    const fontSize = 14
    const lineHeight = 18

    const panelX = box.x + box.width + 20
    const panelY = box.y

    const panelGroup = SVGBuilder.createGroup({
      id: panelId,
      "data-overlay": "result-panel",
      "data-block-id": id
    })

    const textWidth = resultText.length * fontSize * 0.6
    const panelWidth = textWidth + padding * 2
    const panelHeight = lineHeight + padding * 2

    const panelRect = SVGBuilder.createRect(
      { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
      {
        fill: "#f0f8ff",
        stroke: "#4472C4",
        "stroke-width": "2",
        rx: "4",
        style: SVGRendererConst.noSelection
      }
    )
    panelGroup.appendChild(panelRect)

    const text = SVGBuilder.createText(
      { x: panelX + padding, y: panelY + padding + fontSize },
      resultText,
      {
        fill: "#000000",
        "font-size": fontSize.toString(),
        "font-family": "monospace",
        style: SVGRendererConst.noSelection
      }
    )
    panelGroup.appendChild(text)

    this.renderer.layer.appendChild(panelGroup)

    const connectionBox = {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight
    }

    this.renderer.drawConnectionBetweenBox(
      connectionId,
      box,
      connectionBox,
      "sides",
      {
        stroke: "#4472C4",
        "stroke-width": "1",
        "stroke-dasharray": "5 3",
        "data-overlay": "result-connection",
        "data-block-id": id
      }
    )
  }

  protected createHoverZone(mathSymbol: IIRecognizedMath): void {
    const id = `hover-zone-${mathSymbol.id}`

    this.renderer.removeSymbol(id)

    const attrs: Record<string, string> = {
      id,
      fill: "transparent",
      stroke: "transparent",
      "data-overlay": "hover-zone",
      "data-block-id": mathSymbol.id,
      style: "pointer-events: all;"
    }

    const hoverZone = SVGBuilder.createRect(mathSymbol.bounds, attrs)

    hoverZone.addEventListener("pointerenter", () => {
      this.#logger.debug("hover", `Pointer entered block ${mathSymbol.id}`)
      this.editor.mathInteractions.onSymbolHover(mathSymbol.id)
    })

    hoverZone.addEventListener("pointerleave", () => {
      this.#logger.debug("hover", `Pointer left block ${mathSymbol.id}`)
      this.editor.mathInteractions.onSymbolHover(null)
    })

    this.renderer.layer.appendChild(hoverZone)
  }

  refresh(): void {
    this.#logger.info("refresh", "Refreshing all overlays")

    if (!this.model) {
      this.#logger.warn("refresh", "Model not available, skipping overlay refresh")
      return
    }

    this.clearAll()

    this.model.symbols.forEach(symbol => {
      this.updateOverlaysForSymbol(symbol)
    })
  }

  protected getBlockColor(mathSymbol: IIRecognizedMath): string {
    const defaultColor = "#cccccc"

    if (mathSymbol.variableSources && Object.keys(mathSymbol.variableSources).length > 0) {
      const variableNames = Object.keys(mathSymbol.variableSources)
      const firstVariable = variableNames[0]
      const color = this.#colorManager.getColorForVariable(firstVariable)
      this.#logger.debug("getBlockColor", `Block ${mathSymbol.label} uses variable "${firstVariable}" → ${color}`)
      return color
    }

    this.#logger.debug("getBlockColor", `Block ${mathSymbol.label} has no variables → ${defaultColor}`)
    return defaultColor
  }

  updateOverlaysForSymbol(symbol: TIISymbol): void {
    if (symbol.type !== SymbolType.Recognized || symbol.kind !== RecognizedKind.Math) {
      return
    }

    const mathSymbol = symbol as IIRecognizedMath
    const blockColor = this.getBlockColor(mathSymbol)

    this.drawBadge(mathSymbol.bounds, mathSymbol.id)
    this.drawBorder(mathSymbol.bounds, mathSymbol.id, blockColor)

    if (mathSymbol.computedResult !== undefined || (mathSymbol.solverOutputStrokeIds && mathSymbol.solverOutputStrokeIds.length > 0)) {

      let resultText = "Result = "
      if (mathSymbol.computedResult !== undefined) {
        resultText += `${mathSymbol.computedResult}`
      }
      else {
        resultText += "N/A"
      }
      this.drawResultPanel(mathSymbol.bounds, mathSymbol.id, resultText)
    }

    this.createHoverZone(mathSymbol)
  }

  clearAll(): void {
    this.#logger.info("clearAll", "Clearing all overlays")
    this.renderer.clearElements({ attrs: { "data-overlay": "badge" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "border" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "result-panel" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "result-connection" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "hover-zone" } })
  }

  clearOverlaysForBlock(id: string): void {
    this.#logger.debug("clearOverlaysForBlock", { id })

    MathOverlayManager.OVERLAY_PREFIXES.forEach(prefix => {
      this.renderer.removeSymbol(`${prefix}-${id}`)
    })
  }

  /**
   * Generic method to draw a rectangle overlay on a math symbol
   * @param mathSymbol - The math symbol to draw overlay on
   * @param idPrefix - Prefix for the overlay ID
   * @param attrs - Additional SVG attributes
   */
  protected drawOverlayRect(
    mathSymbol: IIRecognizedMath,
    idPrefix: string,
    attrs: Partial<Record<string, string>>
  ): void {
    const id = `${idPrefix}-${mathSymbol.id}`
    this.renderer.removeSymbol(id)

    const finalAttrs: Record<string, string> = {
      id,
      fill: "transparent",
      "data-overlay": attrs["data-overlay"] || idPrefix,
      "data-block-id": mathSymbol.id,
      style: attrs.style || "pointer-events: none;",
      ...attrs
    }

    const rect = SVGBuilder.createRect(mathSymbol.bounds, finalAttrs)
    this.renderer.layer.appendChild(rect)
  }

  highlightAsSource(mathSymbol: IIRecognizedMath, color?: string): void {
    this.drawOverlayRect(mathSymbol, "highlight-source", {
      stroke: color || "#4CAF50",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight"
    })
  }

  highlightAsDependent(mathSymbol: IIRecognizedMath): void {
    this.drawOverlayRect(mathSymbol, "highlight-dependent", {
      stroke: "#FF9800",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight"
    })
  }

  /**
   * Highlight a specific variable box within an equation
   * @param box - Variable bounding box
   * @param symbolId - Parent symbol ID for unique identifier
   * @param variableName - Variable name for unique identifier and color assignment
   */
  highlightVariableBox(box: TBox, symbolId: string, variableName: string): void {
    const id = `highlight-var-${symbolId}-${variableName}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    this.renderer.removeSymbol(id)

    // Get unique color for this variable
    const color = this.#colorManager.getColorForVariable(variableName)

    const finalAttrs: Record<string, string> = {
      id,
      fill: "transparent",
      stroke: color,
      "stroke-width": "2",
      "data-overlay": "highlight",
      "data-block-id": symbolId,
      style: "pointer-events: none;"
    }

    const rect = SVGBuilder.createRect(box, finalAttrs)
    this.renderer.layer.appendChild(rect)
  }

  addHoverGlow(mathSymbol: IIRecognizedMath): void {
    this.drawOverlayRect(mathSymbol, "glow", {
      stroke: "#2196F3",
      "stroke-width": "2",
      "data-overlay": "glow",
      style: "pointer-events: none; filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.6));"
    })
  }

  dimSymbol(mathSymbol: IIRecognizedMath, opacity: number = 0.3): void {
    this.drawOverlayRect(mathSymbol, "dim", {
      fill: "#ffffff",
      opacity: (1 - opacity).toString(),
      "data-overlay": "dim"
    })
  }

  drawDependencyArrow(fromId: string, toId: string, color: string): void {
    const arrowId = `arrow-${fromId}-${toId}`
    this.renderer.removeSymbol(arrowId)

    const fromSymbol = this.model.symbols.find(s => s.id === fromId) as IIRecognizedMath | undefined
    const toSymbol = this.model.symbols.find(s => s.id === toId) as IIRecognizedMath | undefined

    if (!fromSymbol || !toSymbol) {
      return
    }

    const startX = fromSymbol.bounds.x + fromSymbol.bounds.width
    const startY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const endX = toSymbol.bounds.x
    const endY = toSymbol.bounds.y + toSymbol.bounds.height / 2

    const controlX = (startX + endX) / 2
    const path = `M ${startX} ${startY} Q ${controlX} ${startY}, ${controlX} ${(startY + endY) / 2} T ${endX} ${endY}`

    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    arrowPath.setAttribute("id", arrowId)
    arrowPath.setAttribute("d", path)
    arrowPath.setAttribute("stroke", color)
    arrowPath.setAttribute("stroke-width", "2")
    arrowPath.setAttribute("fill", "transparent")
    arrowPath.setAttribute("marker-end", "url(#arrowhead)")
    arrowPath.setAttribute("data-overlay", "arrow")
    arrowPath.setAttribute("style", "pointer-events: none;")

    this.renderer.layer.appendChild(arrowPath)

    this.ensureArrowheadMarker()
  }

  /**
   * Draw dependency arrow from a symbol to a specific variable box
   * @param fromId - Source symbol ID
   * @param fromBounds - Source symbol bounds
   * @param toId - Target symbol ID (for unique arrow ID)
   * @param toBox - Target variable bounding box
   * @param color - Arrow color
   */
  drawDependencyArrowToBox(fromId: string, fromBounds: TBox, toId: string, toBox: TBox, color: string): void {
    const arrowId = `arrow-${fromId}-${toId}`
    this.renderer.removeSymbol(arrowId)

    const startX = fromBounds.x + fromBounds.width
    const startY = fromBounds.y + fromBounds.height / 2
    const endX = toBox.x
    const endY = toBox.y + toBox.height / 2

    const controlX = (startX + endX) / 2
    const path = `M ${startX} ${startY} Q ${controlX} ${startY}, ${controlX} ${(startY + endY) / 2} T ${endX} ${endY}`

    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    arrowPath.setAttribute("id", arrowId)
    arrowPath.setAttribute("d", path)
    arrowPath.setAttribute("stroke", color)
    arrowPath.setAttribute("stroke-width", "2")
    arrowPath.setAttribute("fill", "transparent")
    arrowPath.setAttribute("marker-end", "url(#arrowhead)")
    arrowPath.setAttribute("data-overlay", "arrow")
    arrowPath.setAttribute("style", "pointer-events: none;")

    this.renderer.layer.appendChild(arrowPath)

    this.ensureArrowheadMarker()
  }

  protected ensureArrowheadMarker(): void {
    if (this.renderer.layer.querySelector("#arrowhead")) {
      return
    }

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
    marker.setAttribute("id", "arrowhead")
    marker.setAttribute("markerWidth", "10")
    marker.setAttribute("markerHeight", "10")
    marker.setAttribute("refX", "9")
    marker.setAttribute("refY", "3")
    marker.setAttribute("orient", "auto")

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    polygon.setAttribute("points", "0 0, 10 3, 0 6")
    polygon.setAttribute("fill", "currentColor")

    marker.appendChild(polygon)
    defs.appendChild(marker)
    this.renderer.layer.appendChild(defs)
  }

  clearHighlights(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "highlight" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "glow" } })
  }

  clearDimming(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "dim" } })
  }

  clearDependencyArrows(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "arrow" } })
  }

  toggleBlockOverlays(show: boolean): void {
    this.updateConfig({ showBlockOverlays: show })
  }

  toggleResultPanels(show: boolean): void {
    this.updateConfig({ showResultPanels: show })
  }
}
