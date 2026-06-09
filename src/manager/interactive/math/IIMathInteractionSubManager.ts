import { IIAbstractManager } from "../IIAbstractManager"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { IIStroke, TBox, isStroke } from "@/symbol"
import { convertBoundingBoxMillimeterToPixel } from "@/utils"
import { TJIIXMathExpression, TJIIXMathElement } from "@/model/ExportMath"
import { ColorPaletteManager } from "../../base"

/**
 * Configuration for math interaction features
 * @group Manager
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
 * @group Manager
 */
export class IIMathInteractionSubManager extends IIAbstractManager
{
  protected managerName = "IIMathInteractionSubManager"

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

  #config: TMathInteractionConfig
  #hoveredSymbolId: string | null = null
  #selectedJiixBlockIds: Set<string> = new Set()
  #colorManager: ColorPaletteManager


  constructor(editor: InteractiveInkEditor, config: Partial<TMathInteractionConfig> = {})
  {
    super(editor)
    this.#colorManager = ColorPaletteManager.getInstance()
    this.#config = { ...IIMathInteractionSubManager.DEFAULT_CONFIG, ...config }
  }

  /**
   * Update interaction configuration
   */
  updateConfig(config: Partial<TMathInteractionConfig>): void {
    this.logger.debug("updateConfig", config)
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
  protected getMathSymbols(): IIStroke[] {
    return this.editor.model.symbols.filter(isStroke)
  }

  /**
   * Find math symbol by ID
   */
  protected findMathSymbol(symbolId: string): IIStroke | undefined {
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
    if (!mathSymbol || !mathSymbol.jiixBlockId) {
      return sources
    }

    // Get variable sources from computation manager
    const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
    if (!computation?.variableSources) {
      return sources
    }

    Object.values(computation.variableSources).forEach(sourceJiixId => {
      const sourceSymbol = this.editor.math.dependencies.findMathSymbolByJiixId(sourceJiixId)
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
    if (!mathSymbol || !mathSymbol.jiixBlockId) {
      return dependents
    }

    // Get dependent blocks from computation manager
    const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
    if (!computation?.dependentBlocks) {
      return dependents
    }

    computation.dependentBlocks.forEach(dependentJiixId => {
      const dependentSymbol = this.editor.math.dependencies.findMathSymbolByJiixId(dependentJiixId)
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

    this.logger.debug("onSymbolHover", { symbolId, label: this.editor.jiix.getLabelForStroke(mathSymbol.id) })

    const sources = this.getRecursiveSources(symbolId)
    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol) {
        this.editor.math.overlays.highlightAsSource(sourceSymbol)
      }
    })

    const dependents = this.getRecursiveDependents(symbolId)
    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol) {
        this.editor.math.overlays.highlightAsDependent(dependentSymbol)
      }
    })

    this.editor.math.overlays.addHoverGlow(mathSymbol)
    this.drawDependencyArrows(symbolId, sources, dependents)
  }

  /**
   * Clear hover highlights
   */
  protected clearHoverHighlights(): void {
    this.logger.debug("clearHoverHighlights")
    this.editor.math.overlays.clearHighlights()
    this.editor.math.overlays.clearDependencyArrows()
  }

  /**
   * Handle math block selection by JIIX block ID.
   * Resets highlights and applies dependency visualization for the selected block.
   * @param jiixBlockId - JIIX block ID of the selected math block
   */
  onMathBlockSelected(jiixBlockId: string): void {
    this.clearSelectionHighlights()

    this.#selectedJiixBlockIds = new Set([jiixBlockId])

    if (!this.#config.highlightOnSelect) {
      return
    }

    this.logger.debug("onMathBlockSelected", { jiixBlockId })

    const symbol = this.editor.math.dependencies.findMathSymbolByJiixId(jiixBlockId)
    if (!symbol) {
      this.logger.warn("onMathBlockSelected", `No symbol found for jiixBlockId: ${jiixBlockId}`)
      return
    }

    const sources = this.getRecursiveSources(symbol.id)
    const dependents = this.getRecursiveDependents(symbol.id)

    const relatedBlocks = new Set<string>([symbol.id])
    sources.forEach(id => relatedBlocks.add(id))
    dependents.forEach(id => relatedBlocks.add(id))

    this.getMathSymbols().forEach(s => {
      if (!relatedBlocks.has(s.id)) {
        this.editor.math.overlays.dimSymbol(s, this.#config.dimOpacity)
      }
    })

    sources.forEach(sourceId => {
      const sourceSymbol = this.findMathSymbol(sourceId)
      if (sourceSymbol) {
        this.editor.math.overlays.highlightAsSource(sourceSymbol)
      }
    })

    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (dependentSymbol) {
        this.editor.math.overlays.highlightAsDependent(dependentSymbol)
      }
    })

    this.drawDependencyArrows(symbol.id, sources, dependents)
  }

  /**
   * Clear math block selection highlights and state
   */
  clearMathBlockSelection(): void {
    this.clearSelectionHighlights()
    this.#selectedJiixBlockIds.clear()
  }

  /**
   * Clear all selection highlights and dimming
   */
  protected clearSelectionHighlights(): void {
    this.logger.debug("clearSelectionHighlights")
    this.editor.math.overlays.clearHighlights()
    this.editor.math.overlays.clearDimming()
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
      if (!sourceSymbol || !sourceSymbol.jiixBlockId || !symbol.jiixBlockId) {
        return
      }

      // Get variable sources from computation manager
      const computation = this.editor.math.computation.getMathBlock(symbol.jiixBlockId)
      if (computation?.variableSources) {
        for (const [variableName, sourceJiixId] of Object.entries(computation.variableSources)) {
          const mathExpressions = (this.editor.jiix.getElementForStroke(symbol.id) as TJIIXMathElement | undefined)?.expressions
          if (sourceJiixId === sourceSymbol.jiixBlockId && mathExpressions) {
            const variableBox = this.findVariableBoxInExpressions(mathExpressions, variableName)
            if (variableBox) {
              const variableColor = this.#colorManager.getColorForVariable(variableName)
              this.editor.math.overlays.highlightAsSource(sourceSymbol, variableColor)
              this.editor.math.overlays.highlightVariableBox(
                variableBox,
                symbol.id,
                variableName
              )
              this.editor.math.overlays.drawDependencyArrowToBox(
                sourceSymbol.id,
                sourceSymbol.bounds,
                symbol.id,
                variableBox,
                variableColor
              )
            } else {
              this.editor.math.overlays.drawDependencyArrow(
                sourceSymbol.id,
                symbol.id,
                IIMathInteractionSubManager.HIGHLIGHT_STYLES.SOURCE_COLOR
              )
            }
          }
        }
      }
    })

    dependents.forEach(dependentId => {
      const dependentSymbol = this.findMathSymbol(dependentId)
      if (!dependentSymbol || !dependentSymbol.jiixBlockId || !symbol.jiixBlockId) {
        return
      }

      // Get variable sources from computation manager for the dependent symbol
      const computation = this.editor.math.computation.getMathBlock(dependentSymbol.jiixBlockId)
      if (computation?.variableSources) {
        for (const [variableName, sourceJiixId] of Object.entries(computation.variableSources)) {
          const dependentMathExpressions = (this.editor.jiix.getElementForStroke(dependentSymbol.id) as TJIIXMathElement | undefined)?.expressions
          if (sourceJiixId === symbol.jiixBlockId && dependentMathExpressions) {
            const variableBox = this.findVariableBoxInExpressions(dependentMathExpressions, variableName)
            if (variableBox) {
              const variableColor = this.#colorManager.getColorForVariable(variableName)
              this.editor.math.overlays.highlightVariableBox(
                variableBox,
                dependentSymbol.id,
                variableName
              )
              this.editor.math.overlays.drawDependencyArrowToBox(
                symbol.id,
                symbol.bounds,
                dependentSymbol.id,
                variableBox,
                variableColor
              )
            } else {
              this.editor.math.overlays.drawDependencyArrow(
                symbol.id,
                dependentSymbol.id,
                IIMathInteractionSubManager.HIGHLIGHT_STYLES.DEPENDENT_COLOR
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
    this.logger.info("clearAll")
    this.clearHoverHighlights()
    this.clearSelectionHighlights()
    this.#hoveredSymbolId = null
    this.#selectedJiixBlockIds.clear()
  }
}
