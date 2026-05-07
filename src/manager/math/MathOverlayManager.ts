import { LoggerManager, LoggerCategory } from "../../logger"
import { SVGRenderer, SVGBuilder, SVGRendererConst } from "../../renderer"
import { IIModel } from "../../model"
import { TBox, TIISymbol, IIRecognizedMath, RecognizedKind, SymbolType } from "../../symbol"
import { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import { VariableColorManager } from "./VariableColorManager"

/**
 * Visual overlay configuration
 */
export type TMathOverlayConfig = {
  showBadges: boolean
  showBorders: boolean
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
    showBadges: false,
    showBorders: false,
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

  /**
   * Get the model from the editor
   */
  get model(): IIModel {
    return this.editor.model
  }

  /**
   * Update overlay configuration
   */
  updateConfig(config: Partial<TMathOverlayConfig>): void {
    this.#logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
    this.refresh()
  }

  /**
   * Get current configuration
   */
  getConfig(): TMathOverlayConfig {
    return { ...this.#config }
  }

  /**
   * Draw badge (∑) on top-left corner of a math block
   */
  protected drawBadge(box: TBox, blockId: string): void {
    const badgeId = `badge-${blockId}`

    // Remove existing badge
    this.renderer.removeSymbol(badgeId)

    if (!this.#config.showBadges) {
      return
    }

    const size = this.#config.badgeSize
    const offset = MathOverlayManager.BADGE_STYLES.OFFSET

    // Badge positioned at top-left with offset
    const badgeX = box.x - offset - size
    const badgeY = box.y - offset - size

    const badgeGroup = SVGBuilder.createGroup({
      id: badgeId,
      "data-overlay": "badge",
      "data-block-id": blockId
    })

    // Background circle
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

    // Badge text
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

  /**
   * Draw border around a block
   */
  protected drawBorder(box: TBox, blockId: string, color: string = "#cccccc", dashArray?: string): void {
    const borderId = `border-${blockId}`

    // Remove existing border
    this.renderer.removeSymbol(borderId)

    if (!this.#config.showBorders) {
      return
    }

    const attrs: Record<string, string> = {
      id: borderId,
      fill: "transparent",
      stroke: color,
      "stroke-width": this.#config.borderWidth.toString(),
      "data-overlay": "border",
      "data-block-id": blockId,
      style: SVGRendererConst.noSelection
    }

    if (dashArray) {
      attrs["stroke-dasharray"] = dashArray
    }

    const rect = SVGBuilder.createRect(box, attrs)
    this.renderer.layer.appendChild(rect)
  }

  /**
   * Draw result panel to the right of a math block
   */
  protected drawResultPanel(box: TBox, blockId: string, resultText: string): void {
    const panelId = `result-panel-${blockId}`
    const connectionId = `result-connection-${blockId}`

    // Remove existing panel and connection
    this.renderer.removeSymbol(panelId)
    this.renderer.removeSymbol(connectionId)

    if (!this.#config.showResultPanels || !resultText) {
      return
    }

    const padding = this.#config.panelPadding
    const fontSize = 14
    const lineHeight = 18

    // Position panel to the right of the block
    const panelX = box.x + box.width + 20
    const panelY = box.y

    const panelGroup = SVGBuilder.createGroup({
      id: panelId,
      "data-overlay": "result-panel",
      "data-block-id": blockId
    })

    // Calculate text dimensions (rough estimate)
    const textWidth = resultText.length * fontSize * 0.6
    const panelWidth = textWidth + padding * 2
    const panelHeight = lineHeight + padding * 2

    // Panel background
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

    // Result text
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

    // Draw connection line from block to panel
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
        "data-block-id": blockId
      }
    )
  }

  /**
   * Refresh all overlays for all symbols
   */
  refresh(): void {
    this.#logger.info("refresh", "Refreshing all overlays")

    // Check if model is available
    if (!this.model) {
      this.#logger.warn("refresh", "Model not available, skipping overlay refresh")
      return
    }

    // Clear all existing overlays
    this.clearAll()

    // Redraw overlays for all symbols
    this.model.symbols.forEach(symbol => {
      this.updateOverlaysForSymbol(symbol)
    })
  }

  /**
   * Determine the color for a math block based on its variables
   * Returns the color of the first variable source, or a default color
   */
  protected getBlockColor(mathSymbol: IIRecognizedMath): string {
    // Default color if no variables
    const defaultColor = "#cccccc"

    // If block uses variables, color by the first variable
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

  /**
   * Update overlays for a specific symbol
   * Only applies to RecognizedKind.Math symbols (IIRecognizedMath)
   */
  updateOverlaysForSymbol(symbol: TIISymbol): void {
    // Only process recognized math symbols
    if (symbol.type !== SymbolType.Recognized || symbol.kind !== RecognizedKind.Math) {
      return
    }

    const mathSymbol = symbol as IIRecognizedMath
    const blockColor = this.getBlockColor(mathSymbol)

    this.drawBadge(mathSymbol.bounds, mathSymbol.id)
    this.drawBorder(mathSymbol.bounds, mathSymbol.id, blockColor)

    // Draw result panel if solver output exists
    if (mathSymbol.solverOutputStrokeIds && mathSymbol.solverOutputStrokeIds.length > 0) {
      // TODO: Extract actual result text from solver output
      const resultText = "Result: [computed]"
      this.drawResultPanel(mathSymbol.bounds, mathSymbol.id, resultText)
    }
  }

  /**
   * Clear all overlays
   */
  clearAll(): void {
    this.#logger.info("clearAll", "Clearing all overlays")

    // Remove all overlay elements
    this.renderer.clearElements({ attrs: { "data-overlay": "badge" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "border" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "result-panel" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "result-connection" } })
  }

  /**
   * Clear overlays for a specific block
   */
  clearOverlaysForBlock(blockId: string): void {
    this.#logger.debug("clearOverlaysForBlock", { blockId })

    this.renderer.removeSymbol(`badge-${blockId}`)
    this.renderer.removeSymbol(`border-${blockId}`)
    this.renderer.removeSymbol(`result-panel-${blockId}`)
    this.renderer.removeSymbol(`result-connection-${blockId}`)
  }

  /**
   * Highlight symbol as a source (green dashed border)
   */
  highlightAsSource(mathSymbol: IIRecognizedMath): void {
    const highlightId = `highlight-source-${mathSymbol.id}`
    this.renderer.removeSymbol(highlightId)

    const attrs: Record<string, string> = {
      id: highlightId,
      fill: "transparent",
      stroke: "#4CAF50",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight",
      "data-block-id": mathSymbol.id,
      style: "pointer-events: none;"
    }

    const rect = SVGBuilder.createRect(mathSymbol.bounds, attrs)
    this.renderer.layer.appendChild(rect)
  }

  /**
   * Highlight symbol as a dependent (orange dashed border)
   */
  highlightAsDependent(mathSymbol: IIRecognizedMath): void {
    const highlightId = `highlight-dependent-${mathSymbol.id}`
    this.renderer.removeSymbol(highlightId)

    const attrs: Record<string, string> = {
      id: highlightId,
      fill: "transparent",
      stroke: "#FF9800",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight",
      "data-block-id": mathSymbol.id,
      style: "pointer-events: none;"
    }

    const rect = SVGBuilder.createRect(mathSymbol.bounds, attrs)
    this.renderer.layer.appendChild(rect)
  }

  /**
   * Add glow effect to hovered symbol
   */
  addHoverGlow(mathSymbol: IIRecognizedMath): void {
    const glowId = `glow-${mathSymbol.id}`
    this.renderer.removeSymbol(glowId)

    const attrs: Record<string, string> = {
      id: glowId,
      fill: "transparent",
      stroke: "#2196F3",
      "stroke-width": "2",
      "data-overlay": "glow",
      "data-block-id": mathSymbol.id,
      style: "pointer-events: none; filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.6));"
    }

    const rect = SVGBuilder.createRect(mathSymbol.bounds, attrs)
    this.renderer.layer.appendChild(rect)
  }

  /**
   * Dim a symbol (reduce opacity)
   */
  dimSymbol(mathSymbol: IIRecognizedMath, opacity: number = 0.3): void {
    const dimId = `dim-${mathSymbol.id}`
    this.renderer.removeSymbol(dimId)

    const attrs: Record<string, string> = {
      id: dimId,
      fill: "#ffffff",
      opacity: (1 - opacity).toString(),
      "data-overlay": "dim",
      "data-block-id": mathSymbol.id,
      style: "pointer-events: none;"
    }

    const rect = SVGBuilder.createRect(mathSymbol.bounds, attrs)
    this.renderer.layer.appendChild(rect)
  }

  /**
   * Draw an arrow between two math symbols
   */
  drawDependencyArrow(fromId: string, toId: string, color: string): void {
    const arrowId = `arrow-${fromId}-${toId}`
    this.renderer.removeSymbol(arrowId)

    const fromSymbol = this.model.symbols.find(s => s.id === fromId) as IIRecognizedMath | undefined
    const toSymbol = this.model.symbols.find(s => s.id === toId) as IIRecognizedMath | undefined

    if (!fromSymbol || !toSymbol) {
      return
    }

    // Calculate arrow start (right side of from box) and end (left side of to box)
    const startX = fromSymbol.bounds.x + fromSymbol.bounds.width
    const startY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const endX = toSymbol.bounds.x
    const endY = toSymbol.bounds.y + toSymbol.bounds.height / 2

    // Create curved path
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

    // Ensure arrowhead marker exists
    this.ensureArrowheadMarker()
  }

  /**
   * Ensure SVG arrowhead marker is defined
   */
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

  /**
   * Clear all highlight overlays
   */
  clearHighlights(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "highlight" } })
    this.renderer.clearElements({ attrs: { "data-overlay": "glow" } })
  }

  /**
   * Clear all dimming overlays
   */
  clearDimming(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "dim" } })
  }

  /**
   * Clear all dependency arrows
   */
  clearDependencyArrows(): void {
    this.renderer.clearElements({ attrs: { "data-overlay": "arrow" } })
  }

  /**
   * Toggle badges visibility
   */
  toggleBadges(show: boolean): void {
    this.updateConfig({ showBadges: show })
  }

  /**
   * Toggle borders visibility
   */
  toggleBorders(show: boolean): void {
    this.updateConfig({ showBorders: show })
  }

  /**
   * Toggle result panels visibility
   */
  toggleResultPanels(show: boolean): void {
    this.updateConfig({ showResultPanels: show })
  }
}
