import { LoggerManager, LoggerCategory } from "@/logger"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { IIRecognizedMath, TBox } from "@/symbol"
import { isRecognizedMathSymbol } from "@/symbol"
import { convertBoundingBoxMillimeterToPixel } from "@/utils"
import { TJIIXMathExpression } from "@/model/ExportMath"
import { IIMathOverlayManager } from "./IIMathOverlayManager"
import { ColorPaletteManager } from "../base"

/**
 * Configuration for math interaction features
 * @group Manager/Math
 */
export type TMathInteractionConfig = {
  showDependencyOnHover: boolean
  highlightOnSelect: boolean
  dimOpacity: number
}

/**
 * Manages interactive highlighting and visual feedback for math dependencies:
 * - Hover highlighting (sources in green, dependents in orange)
 * - Selection highlighting with dimming
 * - Dependency arrows/lines between related blocks
 * - Recursive dependency tree traversal
 *
 * @group Manager/Math
 */
export class IIMathInteractionManager {
  private static readonly DEFAULT_CONFIG: TMathInteractionConfig = {
    showDependencyOnHover: false,
    highlightOnSelect: false,
    dimOpacity: 0.3,
  }

  private static readonly HIGHLIGHT_STYLES = {
    SOURCE_COLOR: "#4CAF50",
    DEPENDENT_COLOR: "#FF9800",
    HOVER_GLOW: "0 0 8px rgba(33, 150, 243, 0.6)",
    DASH_ARRAY: "5 3",
  }

  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #config: TMathInteractionConfig
  #hoveredSymbolId: string | null = null
  #selectedSymbolIds: Set<string> = new Set()
  #colorManager: ColorPaletteManager

  editor: InteractiveInkEditor
  overlayManager: IIMathOverlayManager

  constructor(editor: InteractiveInkEditor, config: Partial<TMathInteractionConfig> = {}) {
    this.#logger.info("constructor")
    this.editor = editor
    this.overlayManager = editor.mathOverlays
    this.#colorManager = ColorPaletteManager.getInstance()
    this.#config = { ...IIMathInteractionManager.DEFAULT_CONFIG, ...config }
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
    return this.editor.model.symbols.filter(isRecognizedMathSymbol)
  }

  /**
   * Find math symbol by ID
   */
  protected findMathSymbol(symbolId: string): IIRecognizedMath | undefined {
    return this.getMathSymbols().find(s => s.id === symbolId)
  }

  /**
   * Find variable bounding box in JIIX expressions recursively
   * @param expressions - Array of JIIX expressions to search
   * @param variableName - Name of the variable to find (e.g., "x", "y")
   * @returns Bounding box in pixels, or null if not found
   */
  protected findVariableBoxInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox | null {
    for (const expr of expressions) {
      // Check operands if they exist
      if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
        for (const operand of expr.operands) {
          // Direct variable match
          if (operand.type === "variable" && "label" in operand && operand.label === variableName && operand["bounding-box"]) {
            return convertBoundingBoxMillimeterToPixel(operand["bounding-box"])
          }

          // Recursive search in nested operands
          if ("operands" in operand && operand.operands && Array.isArray(operand.operands)) {
            const result = this.findVariableBoxInExpressions([operand], variableName)
            if (result) {
              return result
            }
          }
        }
      }
    }
    return null
  }

  /**
   * Get all source blocks recursively
   * @param symbolId - Symbol ID to get sources for
   * @param visited - Set of already visited symbols to prevent infinite loops
   * @returns Set of source symbol IDs
   */
  getRecursiveSources(symbolId: string, visited: Set<string> = new Set()): Set<string> {
    const sources = new Set<string>()

    if (visited.has(symbolId)) {
      return sources
    }
    visited.add(symbolId)

    const mathSymbol = this.findMathSymbol(symbolId)
    if (!mathSymbol || !mathSymbol.variableSources) {
      return sources
    }

    Object.values(mathSymbol.variableSources).forEach(sourceJiixId => {
      const sourceSymbol = this.editor.findMathSymbolByJiixId(sourceJiixId)
      if (sourceSymbol && !visited.has(sourceSymbol.id)) {
        sources.add(sourceSymbol.id)
        const recursiveSources = this.getRecursiveSources(sourceSymbol.id, visited)
        recursiveSources.forEach(id => sources.add(id))
      }
    })

    return sources
  }

  /**
   * Get all dependent blocks recursively
   * @param symbolId - Symbol ID to get dependents for
   * @param visited - Set of already visited symbols to prevent infinite loops
   * @returns Set of dependent symbol IDs
   */
  getRecursiveDependents(symbolId: string, visited: Set<string> = new Set()): Set<string> {
    const dependents = new Set<string>()

    if (visited.has(symbolId)) {
      return dependents
    }
    visited.add(symbolId)

    const mathSymbol = this.findMathSymbol(symbolId)
    if (!mathSymbol || !mathSymbol.jiixId || !mathSymbol.dependentBlocks) {
      return dependents
    }

    mathSymbol.dependentBlocks.forEach(dependentJiixId => {
      const dependentSymbol = this.editor.findMathSymbolByJiixId(dependentJiixId)
      if (dependentSymbol && !visited.has(dependentSymbol.id)) {
        dependents.add(dependentSymbol.id)
        const recursiveDependents = this.getRecursiveDependents(dependentSymbol.id, visited)
        recursiveDependents.forEach(id => dependents.add(id))
      }
    })

    return dependents
  }

  /**
   * Handle symbol hover event
   * @param symbolId - Symbol ID being hovered, or null to clear hover
   */
  onSymbolHover(symbolId: string | null): void {
    if (!this.#config.showDependencyOnHover) {
      return
    }

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

    const sources = this.getRecursiveSources(symbolId)
    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol) {
        this.overlayManager.highlightAsSource(sourceSymbol)
      }
    })

    const dependents = this.getRecursiveDependents(symbolId)
    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol) {
        this.overlayManager.highlightAsDependent(dependentSymbol)
      }
    })

    this.overlayManager.addHoverGlow(mathSymbol)
    this.drawDependencyArrows(symbolId, sources, dependents)
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
   * @param symbolIds - Array of selected symbol IDs
   */
  onSymbolSelect(symbolIds: string[]): void {
    this.clearSelectionHighlights()

    this.#selectedSymbolIds = new Set(symbolIds)

    if (!this.#config.highlightOnSelect || symbolIds.length === 0) {
      return
    }

    this.#logger.debug("onSymbolSelect", { symbolIds })

    const relatedBlocks = new Set<string>()
    symbolIds.forEach(id => {
      relatedBlocks.add(id)
      this.getRecursiveSources(id).forEach(sourceId => relatedBlocks.add(sourceId))
      this.getRecursiveDependents(id).forEach(depId => relatedBlocks.add(depId))
    })

    this.getMathSymbols().forEach(symbol => {
      if (!relatedBlocks.has(symbol.id)) {
        this.overlayManager.dimSymbol(symbol, this.#config.dimOpacity)
      }
    })

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
   * Clear all selection highlights and dimming
   */
  protected clearSelectionHighlights(): void {
    this.#logger.debug("clearSelectionHighlights")
    this.overlayManager.clearHighlights()
    this.overlayManager.clearDimming()
  }

  /**
   * Draw dependency arrows between symbol and its sources/dependents
   * @param symbolId - Central symbol ID
   * @param sources - Set of source symbol IDs
   * @param dependents - Set of dependent symbol IDs
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

    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol && sourceSymbol.jiixId && symbol.variableSources) {
        for (const [variableName, sourceJiixId] of Object.entries(symbol.variableSources)) {
          if (sourceJiixId === sourceSymbol.jiixId && symbol.expressions) {
            const variableBox = this.findVariableBoxInExpressions(symbol.expressions, variableName)
            if (variableBox) {
              const variableColor = this.#colorManager.getColorForVariable(variableName)
              this.overlayManager.highlightAsSource(sourceSymbol, variableColor)
              this.overlayManager.highlightVariableBox(
                variableBox,
                symbol.id,
                variableName
              )
              this.overlayManager.drawDependencyArrowToBox(
                sourceSymbol.id,
                sourceSymbol.bounds,
                symbol.id,
                variableBox,
                variableColor
              )
            } else {
              this.overlayManager.drawDependencyArrow(
                sourceSymbol.id,
                symbol.id,
                IIMathInteractionManager.HIGHLIGHT_STYLES.SOURCE_COLOR
              )
            }
          }
        }
      }
    })

    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol && dependentSymbol.variableSources && symbol.jiixId) {
        for (const [variableName, sourceJiixId] of Object.entries(dependentSymbol.variableSources)) {
          if (sourceJiixId === symbol.jiixId && dependentSymbol.expressions) {
            const variableBox = this.findVariableBoxInExpressions(dependentSymbol.expressions, variableName)
            if (variableBox) {
              const variableColor = this.#colorManager.getColorForVariable(variableName)
              this.overlayManager.highlightVariableBox(
                variableBox,
                dependentSymbol.id,
                variableName
              )
              this.overlayManager.drawDependencyArrowToBox(
                symbol.id,
                symbol.bounds,
                dependentSymbol.id,
                variableBox,
                variableColor
              )
            } else {
              this.overlayManager.drawDependencyArrow(
                symbol.id,
                dependentSymbol.id,
                IIMathInteractionManager.HIGHLIGHT_STYLES.DEPENDENT_COLOR
              )
            }
          }
        }
      }
    })
  }

  /**
   * Clear all highlights and reset state
   */
  clearAll(): void {
    this.#logger.info("clearAll")
    this.clearHoverHighlights()
    this.clearSelectionHighlights()
    this.#hoveredSymbolId = null
    this.#selectedSymbolIds.clear()
  }
}
