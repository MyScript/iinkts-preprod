import { IIAbstractManager } from "../IIAbstractManager"
import { IIStroke, TBox, Box, isStroke, isRecognizedMath } from "@/symbol"
import { convertBoundingBoxMillimeterToPixel } from "@/utils"
import { TJIIXMathExpression, TJIIXMathElement } from "@/model/ExportMath"
import { TMathVariable } from "@/recognizer"
import { ColorPaletteManager } from "../../base"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Type representing math symbol dependencies
 * @group Manager
 */
export type MathDependencies = {
  /**
   * Map of variable names to their source block IDs
   */
  variableSources?: { [variableName: string]: string }

  /**
   * Array of block IDs that depend on this block
   */
  dependentBlocks?: string[]
}

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
 * Unified sub-manager for math variable state, dependency tracking, and visual interactions.
 *
 * Responsibilities:
 * - Variable values: store, set, get per block
 * - Dependency graph: variable sources, dependent blocks, enrichment, cleanup
 * - Interaction visuals: hover highlighting, selection highlighting, dependency arrows
 *
 * @group Manager
 */
export class IIMathVariableSubManager extends IIAbstractManager
{
  protected managerName = "IIMathVariableSubManager"

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

  #dependencies: Map<string, MathDependencies> = new Map()
  #variableValues: Map<string, Record<string, number>> = new Map()

  #config: TMathInteractionConfig
  #hoveredJiixBlockId: string | null = null
  #selectedJiixBlockIds: Set<string> = new Set()
  #colorManager: ColorPaletteManager

  constructor(editor: InteractiveInkEditor, config: Partial<TMathInteractionConfig> = {})
  {
    super(editor)
    this.#colorManager = ColorPaletteManager.getInstance()
    this.#config = { ...IIMathVariableSubManager.DEFAULT_CONFIG, ...config }
  }

  // ==========================================
  // Interaction configuration
  // ==========================================

  updateConfig(config: Partial<TMathInteractionConfig>): void
  {
    this.logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
  }

  getConfig(): TMathInteractionConfig
  {
    return { ...this.#config }
  }

  // ==========================================
  // Symbol helpers
  // ==========================================

  protected getMathSymbols(): IIStroke[]
  {
    return this.editor.model.symbols.filter(isRecognizedMath)
  }

  findMathSymbolsByJiixId(jiixId: string): IIStroke[]
  {
    return this.editor.model.symbols.filter(s =>
      isStroke(s) && s.jiixBlockId === jiixId && s.jiixBlockType === "Math"
    ) as IIStroke[]
  }

  protected getBlockBounds(jiixBlockId: string): TBox | null
  {
    const strokes = this.findMathSymbolsByJiixId(jiixBlockId)
    if (!strokes.length) return null
    return Box.createFromBoxes(strokes.map(s => s.bounds))
  }

  protected findVariableBoxesInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox[]
  {
    const boxes: TBox[] = []
    for (const expr of expressions) {
      if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
        for (const operand of expr.operands) {
          if (!operand) continue
          if (operand.type === "variable" && "label" in operand && operand.label === variableName && operand["bounding-box"]) {
            boxes.push(convertBoundingBoxMillimeterToPixel(operand["bounding-box"]))
          }
          if ("operands" in operand && operand.operands && Array.isArray(operand.operands)) {
            boxes.push(...this.findVariableBoxesInExpressions([operand], variableName))
          }
        }
      }
    }
    return boxes
  }

  // ==========================================
  // Dependency graph
  // ==========================================

  getDependencies(blockId: string): MathDependencies | null
  {
    return this.#dependencies.get(blockId) ?? null
  }

  async enrichMathDependencies(jiixBlockId: string): Promise<void>
  {
    try {
      this.logger.info("enrichMathDependencies", `Starting enrichment for "${jiixBlockId}"`)

      const variables = await this.editor.getMathVariables(jiixBlockId)

      if (!variables || variables.length === 0) {
        this.logger.debug("enrichMathDependencies", `No variables in "${jiixBlockId}"`)

        const existing = this.#dependencies.get(jiixBlockId)
        if (existing?.variableSources && Object.keys(existing.variableSources).length > 0) {
          this.#dependencies.set(jiixBlockId, { ...existing, variableSources: {} })
        }
        return
      }

      this.logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}

      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          const sourceDeps = this.#dependencies.get(variable.sourceId) ?? {}
          const currentDependentBlocks = sourceDeps.dependentBlocks ?? []

          if (!currentDependentBlocks.includes(jiixBlockId)) {
            this.#dependencies.set(variable.sourceId, {
              ...sourceDeps,
              dependentBlocks: [...currentDependentBlocks, jiixBlockId]
            })
            this.logger.info("enrichMathDependencies", `Added "${jiixBlockId}" to dependentBlocks of source block ${variable.sourceId}`)
          }
        } else {
          this.logger.debug("enrichMathDependencies", `Variable "${variable.name}" sourceType "${variable.sourceType}", skipping`)
        }
      }

      const existing = this.#dependencies.get(jiixBlockId) ?? {}
      this.#dependencies.set(jiixBlockId, {
        ...existing,
        variableSources: newVariableSources
      })

      this.logger.info("enrichMathDependencies", `Enriched "${jiixBlockId}" with variableSources:`, newVariableSources)
      this.editor.event.emitChanged(this.editor.history.context)
    }
    catch (error) {
      this.logger.error("enrichMathDependencies", { error })
    }
  }

  cleanupMathDependencies(jiixBlockIds: string[]): void
  {
    const existingJiixIds = new Set(jiixBlockIds)

    for (const [id] of this.#dependencies) {
      if (!existingJiixIds.has(id)) {
        this.#dependencies.delete(id)
      }
    }

    for (const jiixBlockId of jiixBlockIds) {
      let needsUpdate = false
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps) continue

      let updatedDependentBlocks = deps.dependentBlocks
      let updatedVariableSources = deps.variableSources

      if (deps.dependentBlocks && deps.dependentBlocks.length > 0) {
        const filtered = deps.dependentBlocks.filter(id => existingJiixIds.has(id))
        const removedCount = deps.dependentBlocks.length - filtered.length
        if (removedCount > 0) {
          this.logger.info("cleanupMathDependencies", `Removed ${removedCount} deleted dependent(s) from block ${jiixBlockId}`)
          updatedDependentBlocks = filtered
          needsUpdate = true
        }
      }

      if (deps.variableSources && Object.keys(deps.variableSources).length > 0) {
        const stale = Object.entries(deps.variableSources)
          .filter(([, sourceId]) => !existingJiixIds.has(sourceId))
          .map(([varName]) => varName)
        if (stale.length > 0) {
          updatedVariableSources = { ...deps.variableSources }
          stale.forEach(varName => delete updatedVariableSources![varName])
          this.logger.info("cleanupMathDependencies", `Removed ${stale.length} stale variable source(s) from block ${jiixBlockId}`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.#dependencies.set(jiixBlockId, { ...deps, dependentBlocks: updatedDependentBlocks, variableSources: updatedVariableSources })
      }
    }

    const blockToSources = new Map<string, Set<string>>()
    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      blockToSources.set(
        jiixBlockId,
        deps?.variableSources ? new Set(Object.values(deps.variableSources)) : new Set()
      )
    }

    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) continue

      const filtered = deps.dependentBlocks.filter(depId => {
        const sources = blockToSources.get(depId)
        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not in blockToSources, keeping`)
          return true
        }
        return sources.has(jiixBlockId)
      })

      const removedCount = deps.dependentBlocks.length - filtered.length
      if (removedCount > 0) {
        this.logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent(s) from block ${jiixBlockId}`)
        this.#dependencies.set(jiixBlockId, { ...deps, dependentBlocks: filtered })
      }
    }
  }

  // ==========================================
  // Variable values
  // ==========================================

  async getVariables(jiixBlockId: string): Promise<TMathVariable[]>
  {
    if (!jiixBlockId) {
      this.logger.warn("getVariables", "jiixBlockId is empty, returning empty array")
      return []
    }

    this.logger.info("getVariables", { jiixBlockId })
    return await this.editor.recognizer.getVariables(jiixBlockId)
  }

  async getVariableValue(jiixBlockId: string, variableName: string): Promise<number>
  {
    this.logger.info("getVariableValue", { jiixBlockId, variableName })
    return this.editor.recognizer.getVariableValue(jiixBlockId, variableName)
  }

  async setVariableValue(
    jiixBlockId: string,
    variableName: string,
    variableValue: number
  ): Promise<void>
  {
    this.logger.info("setVariableValue", { jiixBlockId, variableName, variableValue })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    await this.editor.recognizer.setVariableValue(jiixBlockId, variableName, variableValue)

    const existing = this.#variableValues.get(jiixBlockId) ?? {}
    this.#variableValues.set(jiixBlockId, { ...existing, [variableName]: variableValue })
  }

  getStoredVariableValues(jiixBlockId: string): Record<string, number> | undefined
  {
    return this.#variableValues.get(jiixBlockId)
  }

  // ==========================================
  // Recursive source/dependent traversal (jiixBlockId-based)
  // ==========================================

  getRecursiveSources(jiixBlockId: string, visited: Set<string> = new Set()): Set<string>
  {
    const sources = new Set<string>()

    if (visited.has(jiixBlockId)) return sources
    visited.add(jiixBlockId)

    const deps = this.getDependencies(jiixBlockId)
    if (!deps?.variableSources) return sources

    Object.values(deps.variableSources).forEach(sourceJiixId => {
      if (!visited.has(sourceJiixId)) {
        sources.add(sourceJiixId)
        this.getRecursiveSources(sourceJiixId, visited).forEach(id => sources.add(id))
      }
    })

    return sources
  }

  getRecursiveDependents(jiixBlockId: string, visited: Set<string> = new Set()): Set<string>
  {
    const dependents = new Set<string>()

    if (visited.has(jiixBlockId)) return dependents
    visited.add(jiixBlockId)

    const deps = this.getDependencies(jiixBlockId)
    if (!deps?.dependentBlocks) return dependents

    deps.dependentBlocks.forEach(dependentJiixId => {
      if (!visited.has(dependentJiixId)) {
        dependents.add(dependentJiixId)
        this.getRecursiveDependents(dependentJiixId, visited).forEach(id => dependents.add(id))
      }
    })

    return dependents
  }

  // ==========================================
  // Interaction visuals
  // ==========================================

  onSymbolHover(jiixBlockId: string | null): void
  {
    if (!this.#config.showDependencyOnHover) {
      return
    }

    if (this.#hoveredJiixBlockId) {
      this.clearHoverHighlights()
    }

    if (!jiixBlockId) {
      this.#hoveredJiixBlockId = null
      return
    }

    this.#hoveredJiixBlockId = jiixBlockId
    this.logger.debug("onSymbolHover", { jiixBlockId })

    const sources = this.getRecursiveSources(jiixBlockId)
    sources.forEach(sourceJiixId => {
      const bounds = this.getBlockBounds(sourceJiixId)
      if (bounds) this.editor.math.overlays.highlightAsSource(sourceJiixId, bounds)
    })

    const dependents = this.getRecursiveDependents(jiixBlockId)
    dependents.forEach(dependentJiixId => {
      const bounds = this.getBlockBounds(dependentJiixId)
      if (bounds) this.editor.math.overlays.highlightAsDependent(dependentJiixId, bounds)
    })

    const hoveredBounds = this.getBlockBounds(jiixBlockId)
    if (hoveredBounds) this.editor.math.overlays.addHoverGlow(jiixBlockId, hoveredBounds)

    this.drawDependencyArrows(jiixBlockId, sources, dependents)
  }

  protected clearHoverHighlights(): void
  {
    this.logger.debug("clearHoverHighlights")
    this.editor.math.overlays.clearHighlights()
    this.editor.math.overlays.clearDependencyArrows()
  }

  selectBlock(jiixBlockId: string): void
  {
    this.clearSelectionHighlights()

    this.#selectedJiixBlockIds = new Set([jiixBlockId])

    if (!this.#config.highlightOnSelect) {
      return
    }

    this.logger.debug("selectBlock", { jiixBlockId })

    const sources = this.getRecursiveSources(jiixBlockId)
    const dependents = this.getRecursiveDependents(jiixBlockId)

    const relatedJiixIds = new Set<string>([jiixBlockId])
    sources.forEach(id => relatedJiixIds.add(id))
    dependents.forEach(id => relatedJiixIds.add(id))

    const allJiixIds = new Set<string>()
    this.getMathSymbols().forEach(s => {
      if (s.jiixBlockId) allJiixIds.add(s.jiixBlockId)
    })
    allJiixIds.forEach(jid => {
      if (!relatedJiixIds.has(jid)) {
        const bounds = this.getBlockBounds(jid)
        if (bounds) this.editor.math.overlays.dimSymbol(jid, bounds, this.#config.dimOpacity)
      }
    })

    sources.forEach(sourceJiixId => {
      const bounds = this.getBlockBounds(sourceJiixId)
      if (bounds) this.editor.math.overlays.highlightAsSource(sourceJiixId, bounds)
    })

    dependents.forEach(dependentJiixId => {
      const bounds = this.getBlockBounds(dependentJiixId)
      if (bounds) this.editor.math.overlays.highlightAsDependent(dependentJiixId, bounds)
    })

    this.drawDependencyArrows(jiixBlockId, sources, dependents)
  }

  clearBlockSelection(): void
  {
    this.clearSelectionHighlights()
    this.#selectedJiixBlockIds.clear()
  }

  protected clearSelectionHighlights(): void
  {
    this.logger.debug("clearSelectionHighlights")
    this.editor.math.overlays.clearHighlights()
    this.editor.math.overlays.clearDimming()
  }

  protected drawDependencyArrows(
    jiixBlockId: string,
    sources: Set<string>,
    dependents: Set<string>
  ): void
  {
    const hoveredBounds = this.getBlockBounds(jiixBlockId)
    if (!hoveredBounds) return

    // Any stroke of the hovered block shares the same JIIX — use first for expression lookup
    const hoveredFirstStroke = this.findMathSymbolsByJiixId(jiixBlockId)[0]

    sources.forEach(sourceJiixId => {
      const sourceBounds = this.getBlockBounds(sourceJiixId)
      if (!sourceBounds) return

      const deps = this.getDependencies(jiixBlockId)
      if (!deps?.variableSources) return

      for (const [variableName, depSourceJiixId] of Object.entries(deps.variableSources)) {
        if (depSourceJiixId !== sourceJiixId) continue

        const mathExpressions = hoveredFirstStroke
          ? (this.editor.jiix.getElementForStroke(hoveredFirstStroke.id) as TJIIXMathElement | undefined)?.expressions
          : undefined

        if (mathExpressions) {
          const variableBoxes = this.findVariableBoxesInExpressions(mathExpressions, variableName)
          if (variableBoxes.length > 0) {
            const variableColor = this.#colorManager.getColorForVariable(variableName)
            this.editor.math.overlays.highlightAsSource(sourceJiixId, sourceBounds, variableColor)
            variableBoxes.forEach((variableBox, i) => {
              this.editor.math.overlays.highlightVariableBox(variableBox, `${jiixBlockId}-occ${i}`, variableName)
              this.editor.math.overlays.drawDependencyArrowToBox(
                `${sourceJiixId}-occ${i}`,
                sourceBounds,
                `${jiixBlockId}-occ${i}`,
                variableBox,
                variableColor
              )
            })
            continue
          }
        }

        this.editor.math.overlays.drawDependencyArrowToBox(
          sourceJiixId,
          sourceBounds,
          jiixBlockId,
          hoveredBounds,
          IIMathVariableSubManager.HIGHLIGHT_STYLES.SOURCE_COLOR
        )
      }
    })

    dependents.forEach(dependentJiixId => {
      const depBounds = this.getBlockBounds(dependentJiixId)
      if (!depBounds) return

      const depDeps = this.getDependencies(dependentJiixId)
      if (!depDeps?.variableSources) return

      const depFirstStroke = this.findMathSymbolsByJiixId(dependentJiixId)[0]

      for (const [variableName, sourceJiixId] of Object.entries(depDeps.variableSources)) {
        if (sourceJiixId !== jiixBlockId) continue

        const depMathExpressions = depFirstStroke
          ? (this.editor.jiix.getElementForStroke(depFirstStroke.id) as TJIIXMathElement | undefined)?.expressions
          : undefined

        if (depMathExpressions) {
          const variableBoxes = this.findVariableBoxesInExpressions(depMathExpressions, variableName)
          if (variableBoxes.length > 0) {
            const variableColor = this.#colorManager.getColorForVariable(variableName)
            variableBoxes.forEach((variableBox, i) => {
              this.editor.math.overlays.highlightVariableBox(variableBox, `${dependentJiixId}-occ${i}`, variableName)
              this.editor.math.overlays.drawDependencyArrowToBox(
                `${jiixBlockId}-occ${i}`,
                hoveredBounds,
                `${dependentJiixId}-occ${i}`,
                variableBox,
                variableColor
              )
            })
            continue
          }
        }

        this.editor.math.overlays.drawDependencyArrowToBox(
          jiixBlockId,
          hoveredBounds,
          dependentJiixId,
          depBounds,
          IIMathVariableSubManager.HIGHLIGHT_STYLES.DEPENDENT_COLOR
        )
      }
    })
  }

  clearAll(): void
  {
    this.logger.info("clearAll")
    this.clearHoverHighlights()
    this.clearSelectionHighlights()
    this.#hoveredJiixBlockId = null
    this.#selectedJiixBlockIds.clear()
  }

  // ==========================================
  // Lifecycle
  // ==========================================

  clear(): void
  {
    this.#dependencies.clear()
    this.#variableValues.clear()
  }

  protected onDestroy(): void
  {
    this.clear()
  }
}
