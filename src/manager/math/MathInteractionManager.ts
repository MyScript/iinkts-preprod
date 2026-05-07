import { LoggerManager, LoggerCategory } from "../../logger"
import { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import { IIRecognizedMath, RecognizedKind, SymbolType } from "../../symbol"
import { MathOverlayManager } from "./MathOverlayManager"

/**
 * Configuration for math interaction features
 */
export type TMathInteractionConfig = {
  highlightOnHover: boolean
  highlightOnSelect: boolean
  showDependencyArrows: boolean
  dimOpacity: number
}

/**
 * Manages interactive highlighting and visual feedback for math dependencies:
 * - Hover highlighting (sources in green, dependents in orange)
 * - Selection highlighting with dimming
 * - Dependency arrows/lines between related blocks
 * - Recursive dependency tree traversal
 *
 * @group Manager
 */
export class MathInteractionManager {
  private static readonly DEFAULT_CONFIG: TMathInteractionConfig = {
    highlightOnHover: true,
    highlightOnSelect: true,
    showDependencyArrows: false,
    dimOpacity: 0.3,
  }

  private static readonly HIGHLIGHT_STYLES = {
    SOURCE_COLOR: "#4CAF50",      // Green for blocks this depends on
    DEPENDENT_COLOR: "#FF9800",   // Orange for blocks that depend on this
    HOVER_GLOW: "0 0 8px rgba(33, 150, 243, 0.6)",
    DASH_ARRAY: "5 3",
  }

  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #config: TMathInteractionConfig
  #hoveredSymbolId: string | null = null
  #selectedSymbolIds: Set<string> = new Set()

  editor: InteractiveInkEditor
  overlayManager: MathOverlayManager

  constructor(editor: InteractiveInkEditor, config: Partial<TMathInteractionConfig> = {}) {
    this.#logger.info("constructor")
    this.editor = editor
    this.overlayManager = editor.mathOverlays
    this.#config = { ...MathInteractionManager.DEFAULT_CONFIG, ...config }
  }

  /**
   * Update interaction configuration
   */
  updateConfig(config: Partial<TMathInteractionConfig>): void {
    this.#logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): TMathInteractionConfig {
    return { ...this.#config }
  }

  /**
   * Get all math symbols from the model
   */
  protected getMathSymbols(): IIRecognizedMath[] {
    return this.editor.model.symbols.filter(
      (s): s is IIRecognizedMath =>
        s.type === SymbolType.Recognized && s.kind === RecognizedKind.Math
    )
  }

  /**
   * Find math symbol by ID
   */
  protected findMathSymbol(symbolId: string): IIRecognizedMath | undefined {
    return this.getMathSymbols().find(s => s.id === symbolId)
  }

  /**
   * Get all source blocks (blocks this symbol depends on) recursively
   */
  getRecursiveSources(symbolId: string, visited: Set<string> = new Set()): Set<string> {
    const sources = new Set<string>()

    if (visited.has(symbolId)) {
      return sources // Avoid infinite loops
    }
    visited.add(symbolId)

    const mathSymbol = this.findMathSymbol(symbolId)
    if (!mathSymbol || !mathSymbol.variableSources) {
      return sources
    }

    // Add direct sources
    Object.values(mathSymbol.variableSources).forEach(sourceJiixId => {
      const sourceSymbol = this.editor.findMathSymbolByJiixId(sourceJiixId)
      if (sourceSymbol && !visited.has(sourceSymbol.id)) {
        sources.add(sourceSymbol.id)

        // Add recursive sources
        const recursiveSources = this.getRecursiveSources(sourceSymbol.id, visited)
        recursiveSources.forEach(id => sources.add(id))
      }
    })

    return sources
  }

  /**
   * Get all dependent blocks (blocks that depend on this symbol) recursively
   */
  getRecursiveDependents(symbolId: string, visited: Set<string> = new Set()): Set<string> {
    const dependents = new Set<string>()

    if (visited.has(symbolId)) {
      return dependents // Avoid infinite loops
    }
    visited.add(symbolId)

    const mathSymbol = this.findMathSymbol(symbolId)
    if (!mathSymbol || !mathSymbol.jiixId || !mathSymbol.dependentBlocks) {
      return dependents
    }

    // Add direct dependents
    mathSymbol.dependentBlocks.forEach(dependentJiixId => {
      const dependentSymbol = this.editor.findMathSymbolByJiixId(dependentJiixId)
      if (dependentSymbol && !visited.has(dependentSymbol.id)) {
        dependents.add(dependentSymbol.id)

        // Add recursive dependents
        const recursiveDependents = this.getRecursiveDependents(dependentSymbol.id, visited)
        recursiveDependents.forEach(id => dependents.add(id))
      }
    })

    return dependents
  }

  /**
   * Handle symbol hover
   */
  onSymbolHover(symbolId: string | null): void {
    if (!this.#config.highlightOnHover) {
      return
    }

    // Clear previous hover highlights
    if (this.#hoveredSymbolId) {
      this.clearHoverHighlights()
    }

    if (!symbolId) {
      this.#hoveredSymbolId = null
      this.clearHoverHighlights()
      return
    }

    this.#hoveredSymbolId = symbolId
    const mathSymbol = this.findMathSymbol(symbolId)
    if (!mathSymbol) {
      return
    }

    this.#logger.debug("onSymbolHover", { symbolId, label: mathSymbol.label })

    // Highlight sources (green)
    const sources = this.getRecursiveSources(symbolId)
    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol) {
        this.overlayManager.highlightAsSource(sourceSymbol)
      }
    })

    // Highlight dependents (orange)
    const dependents = this.getRecursiveDependents(symbolId)
    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol) {
        this.overlayManager.highlightAsDependent(dependentSymbol)
      }
    })

    // Add glow to hovered symbol
    this.overlayManager.addHoverGlow(mathSymbol)

    // Draw dependency arrows if enabled
    if (this.#config.showDependencyArrows) {
      this.drawDependencyArrows(symbolId, sources, dependents)
    }
  }

  /**
   * Clear hover highlights
   */
  protected clearHoverHighlights(): void {
    this.#logger.debug("clearHoverHighlights")
    this.overlayManager.clearHighlights()
    this.overlayManager.clearDependencyArrows()
  }

  /**
   * Handle symbol selection
   */
  onSymbolSelect(symbolIds: string[]): void {
    if (!this.#config.highlightOnSelect) {
      return
    }

    this.#selectedSymbolIds = new Set(symbolIds)

    if (symbolIds.length === 0) {
      this.clearSelectionHighlights()
      return
    }

    this.#logger.debug("onSymbolSelect", { symbolIds })

    // Get all related blocks
    const relatedBlocks = new Set<string>()
    symbolIds.forEach(id => {
      relatedBlocks.add(id)
      this.getRecursiveSources(id).forEach(sourceId => relatedBlocks.add(sourceId))
      this.getRecursiveDependents(id).forEach(depId => relatedBlocks.add(depId))
    })

    // Dim non-related blocks
    this.getMathSymbols().forEach(symbol => {
      if (!relatedBlocks.has(symbol.id)) {
        this.overlayManager.dimSymbol(symbol, this.#config.dimOpacity)
      }
    })

    // Highlight sources and dependents
    symbolIds.forEach(id => {
      const sources = this.getRecursiveSources(id)
      const dependents = this.getRecursiveDependents(id)

      sources.forEach(sourceId => {
        const sourceSymbol = this.findMathSymbol(sourceId)
        if (sourceSymbol) {
          this.overlayManager.highlightAsSource(sourceSymbol)
        }
      })

      dependents.forEach(dependentId => {
        const dependentSymbol = this.findMathSymbol(dependentId)
        if (dependentSymbol) {
          this.overlayManager.highlightAsDependent(dependentSymbol)
        }
      })
    })
  }

  /**
   * Clear selection highlights
   */
  protected clearSelectionHighlights(): void {
    this.#logger.debug("clearSelectionHighlights")
    this.overlayManager.clearHighlights()
    this.overlayManager.clearDimming()
  }

  /**
   * Draw dependency arrows between related blocks
   */
  protected drawDependencyArrows(
    symbolId: string,
    sources: Set<string>,
    dependents: Set<string>
  ): void {
    const symbol = this.findMathSymbol(symbolId)
    if (!symbol) {
      return
    }

    // Draw arrows from sources to this symbol
    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol) {
        this.overlayManager.drawDependencyArrow(
          sourceSymbol.id,
          symbol.id,
          MathInteractionManager.HIGHLIGHT_STYLES.SOURCE_COLOR
        )
      }
    })

    // Draw arrows from this symbol to dependents
    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol) {
        this.overlayManager.drawDependencyArrow(
          symbol.id,
          dependentSymbol.id,
          MathInteractionManager.HIGHLIGHT_STYLES.DEPENDENT_COLOR
        )
      }
    })
  }

  /**
   * Toggle dependency arrows visibility
   */
  toggleDependencyArrows(show: boolean): void {
    this.updateConfig({ showDependencyArrows: show })

    if (!show) {
      this.overlayManager.clearDependencyArrows()
    } else if (this.#hoveredSymbolId) {
      // Redraw arrows for currently hovered symbol
      const sources = this.getRecursiveSources(this.#hoveredSymbolId)
      const dependents = this.getRecursiveDependents(this.#hoveredSymbolId)
      this.drawDependencyArrows(this.#hoveredSymbolId, sources, dependents)
    }
  }

  /**
   * Clear all interaction highlights
   */
  clearAll(): void {
    this.#logger.info("clearAll")
    this.clearHoverHighlights()
    this.clearSelectionHighlights()
    this.#hoveredSymbolId = null
    this.#selectedSymbolIds.clear()
  }
}
