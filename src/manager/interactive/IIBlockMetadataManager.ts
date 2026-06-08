import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { TJIIXMathElement, TJIIXTextElement, TJIIXMathExpression } from "@/model"
import { Box, IIStroke, isRecognizedMath, TStrokeJIIXTextWordInfo, TStrokeJIIXTextCharInfo, TStrokeJIIXTextLineInfo } from "@/symbol"
import { convertMillimeterToPixel, convertBoundingBoxMillimeterToPixel } from "@/utils"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Text metadata for a block
 * @group Manager
 */
export type TBlockTextMetadata = {
  label?: string
  word?: TStrokeJIIXTextWordInfo
  char?: TStrokeJIIXTextCharInfo
  line?: TStrokeJIIXTextLineInfo
}

/**
 * Math metadata for a block
 * @group Manager
 */
export type TBlockMathMetadata = {
  label?: string
  expressions?: TJIIXMathExpression[]
  parent?: string
}

/**
 * @group Manager
 * @remarks Manager responsible for managing JIIX metadata on blocks (Text, Math, Node, Edge)
 * This includes word/char/line metadata for text blocks and dependencies for math blocks
 */
export class IIBlockMetadataManager extends IIAbstractManager
{
  protected managerName = "IIBlockMetadataManager"

  // Storage for text metadata by stroke ID
  #textMetadata = new Map<string, TBlockTextMetadata>()

  // Storage for math metadata by stroke ID
  #mathMetadata = new Map<string, TBlockMathMetadata>()

  // Storage for block labels by stroke ID (for all block types)
  #labels = new Map<string, string>()

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
    this.logger.info("constructor", "IIBlockMetadataManager")
  }

  /**
   * Get label for a stroke
   */
  getLabel(strokeId: string): string | undefined
  {
    return this.#labels.get(strokeId)
  }

  /**
   * Set label for a stroke
   */
  setLabel(strokeId: string, label: string | undefined): void
  {
    if (label) {
      this.#labels.set(strokeId, label)
    } else {
      this.#labels.delete(strokeId)
    }
  }

  /**
   * Get text metadata for a stroke
   */
  getTextMetadata(strokeId: string): TBlockTextMetadata | undefined
  {
    return this.#textMetadata.get(strokeId)
  }

  /**
   * Get math metadata for a stroke
   */
  getMathMetadata(strokeId: string): TBlockMathMetadata | undefined
  {
    return this.#mathMetadata.get(strokeId)
  }

  /**
   * Clear metadata for a stroke (when deleted)
   */
  clearMetadata(strokeId: string): void
  {
    this.#textMetadata.delete(strokeId)
    this.#mathMetadata.delete(strokeId)
    this.#labels.delete(strokeId)
  }

  /**
   * Update text metadata on a stroke (words, chars, lines)
   */
  updateTextMetadata(stroke: IIStroke, element: TJIIXTextElement): void
  {
    this.logger.debug("updateTextMetadata", `Updating text metadata for stroke ${stroke.id}`)

    const metadata: TBlockTextMetadata = {
      label: element.label
    }

    // Update first word metadata if available
    if (element.words && element.words.length > 0) {
      const firstWord = element.words[0]
      metadata.word = {
        label: firstWord.label,
        bounds: firstWord["bounding-box"]
          ? new Box(convertBoundingBoxMillimeterToPixel(firstWord["bounding-box"]))
          : undefined
      }
    }

    // Update first char metadata if available
    if (element.chars && element.chars.length > 0) {
      const firstChar = element.chars[0]
      metadata.char = {
        label: firstChar.label,
        word: firstChar.word,
        bounds: firstChar["bounding-box"]
          ? new Box(convertBoundingBoxMillimeterToPixel(firstChar["bounding-box"]))
          : undefined
      }
    }

    // Update line metadata if available
    if (element.lines && element.lines.length > 0) {
      const firstLine = element.lines[0]
      metadata.line = {
        baseline: convertMillimeterToPixel(firstLine["baseline-y"]),
        xHeight: convertMillimeterToPixel(firstLine["x-height"])
      }
    }

    this.#textMetadata.set(stroke.id, metadata)
  }

  /**
   * Update math metadata on a stroke (expressions, parent)
   */
  updateMathMetadata(stroke: IIStroke, element: TJIIXMathElement): void
  {
    this.logger.debug("updateMathMetadata", `Updating math metadata for stroke ${stroke.id}`)

    const metadata: TBlockMathMetadata = {
      label: element.label,
      expressions: element.expressions,
      parent: element.parent
    }

    this.#mathMetadata.set(stroke.id, metadata)
  }

  /**
   * Enrich math dependencies by calling getVariables and updating variable sources
   */
  async enrichMathDependencies(mathSymbol: IIStroke): Promise<void>
  {
    try {
      if (!mathSymbol.jiixBlockId) {
        this.logger.warn("enrichMathDependencies", "Math symbol has no jiixBlockId")
        return
      }

      const originalJiixId = mathSymbol.jiixBlockId

      const symbolExists = this.editor.model.symbols.some(s => s.id === mathSymbol.id)
      if (!symbolExists) {
        this.logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} (${originalJiixId}) no longer exists in model, skipping enrichment`)
        return
      }

      // Re-check jiixBlockId before making async call - it may have been cleared by concurrent operations
      if (!mathSymbol.jiixBlockId || mathSymbol.jiixBlockId !== originalJiixId) {
        this.logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} jiixBlockId changed from ${originalJiixId} to ${mathSymbol.jiixBlockId}, skipping enrichment`)
        return
      }

      this.logger.info("enrichMathDependencies", `Starting enrichment for ${this.getLabel(mathSymbol.id)} (${originalJiixId})`)

      // Use originalJiixId instead of mathSymbol.jiixBlockId to avoid race condition
      const variables = await this.editor.getVariables(originalJiixId)

      // Get the CURRENT symbol from model - it may have been recreated during the async getVariables call
      const currentSymbol = this.editor.model.symbols.find(s =>
        isRecognizedMath(s) && s.jiixBlockId === originalJiixId
      ) as IIStroke | undefined

      if (!currentSymbol) {
        this.logger.debug("enrichMathDependencies", `Symbol with jiixBlockId ${originalJiixId} no longer exists in model after getVariables, aborting enrichment`)
        return
      }

      // Use currentSymbol instead of mathSymbol for all subsequent operations
      mathSymbol = currentSymbol

      if (!variables || variables.length === 0) {
        this.logger.debug("enrichMathDependencies", `No variables found in ${this.getLabel(mathSymbol.id)}`)

        // Clear variable sources in computation manager if they exist
        const computation = this.editor.math.computation.getMathBlock(originalJiixId)
        if (computation?.variableSources && Object.keys(computation.variableSources).length > 0) {
          this.editor.math.computation.updateDependencies(originalJiixId, computation.dependentBlocks, {})
        }
        return
      }

      this.logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}
      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          this.logger.info("enrichMathDependencies", `Variable "${variable.name}" in "${this.getLabel(mathSymbol.id)}" sources from block "${variable.sourceId}"`)
          const sourceMathSymbol = this.editor.findMathSymbolByJiixId(variable.sourceId!)

          if (sourceMathSymbol && sourceMathSymbol.jiixBlockId) {
            // Get current dependent blocks from computation manager
            const sourceComputation = this.editor.math.computation.getMathBlock(sourceMathSymbol.jiixBlockId)
            const currentDependentBlocks = sourceComputation?.dependentBlocks || []

            // Add this block as dependent if not already present
            if (!currentDependentBlocks.includes(mathSymbol.jiixBlockId!)) {
              const updatedDependentBlocks = [...currentDependentBlocks, mathSymbol.jiixBlockId!]
              this.editor.math.computation.updateDependencies(
                sourceMathSymbol.jiixBlockId,
                updatedDependentBlocks,
                sourceComputation?.variableSources
              )
              this.logger.info("enrichMathDependencies", `Added "${this.getLabel(mathSymbol.id)}" (${mathSymbol.jiixBlockId}) to dependentBlocks of "${this.getLabel(sourceMathSymbol.id)}" (${sourceMathSymbol.jiixBlockId})`)
            } else {
              this.logger.debug("enrichMathDependencies", `"${this.getLabel(mathSymbol.id)}" already in dependentBlocks of "${this.getLabel(sourceMathSymbol.id)}"`)
            }
          } else {
            this.logger.warn("enrichMathDependencies", `Source block "${variable.sourceId}" not found`)
          }
        } else {
          this.logger.debug("enrichMathDependencies", `Variable "${variable.name}" has sourceType "${variable.sourceType}", skipping`)
        }
      }

      // Update computation manager with new variable sources
      const computation = this.editor.math.computation.getMathBlock(originalJiixId)
      this.editor.math.computation.updateDependencies(
        originalJiixId,
        computation?.dependentBlocks,
        newVariableSources
      )

      await this.editor.model.updateSymbol(mathSymbol)

      this.logger.info("enrichMathDependencies", `Enriched "${this.getLabel(mathSymbol.id)}" with variableSources:`, newVariableSources)

      this.editor.event.emitChanged(this.editor.history.context)
    }
    catch (error) {
      this.logger.error("enrichMathDependencies", { error })
      // Don't throw, just log - dependencies are optional
    }
  }

  /**
   * Cleanup math dependencies - remove invalid references
   */
  cleanupMathDependencies(mathSymbols: IIStroke[]): void
  {
    const existingJiixIds = new Set(mathSymbols.map(s => s.jiixBlockId).filter(Boolean))

    // First pass: cleanup invalid dependent blocks and variable sources
    mathSymbols.forEach(mathSymbol =>
    {
      if (!mathSymbol.jiixBlockId) return

      let needsUpdate = false
      const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)

      if (!computation) {
        // No computation data yet, skip cleanup for this block
        return
      }

      let updatedDependentBlocks = computation.dependentBlocks
      let updatedVariableSources = computation.variableSources

      // Cleanup dependent blocks
      if (computation.dependentBlocks && computation.dependentBlocks.length > 0) {
        const originalLength = computation.dependentBlocks.length

        updatedDependentBlocks = computation.dependentBlocks.filter(id =>
          existingJiixIds.has(id)
        )

        const removedCount = originalLength - updatedDependentBlocks.length
        if (removedCount > 0) {
          this.logger.info("cleanupMathDependencies", `Cleaned up ${removedCount} invalid dependent block(s) from "${this.getLabel(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)
          needsUpdate = true
        }
      }

      // Cleanup variable sources
      if (computation.variableSources && Object.keys(computation.variableSources).length > 0) {
        const invalidVariables: string[] = []

        Object.entries(computation.variableSources).forEach(([varName, sourceId]) => {
          if (!existingJiixIds.has(sourceId)) {
            invalidVariables.push(varName)
          }
        })

        if (invalidVariables.length > 0) {
          updatedVariableSources = { ...computation.variableSources }
          invalidVariables.forEach(varName => {
            delete updatedVariableSources![varName]
          })
          this.logger.info("cleanupMathDependencies", `Cleaned up ${invalidVariables.length} invalid variable source(s) from "${this.getLabel(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        // Update computation manager
        this.editor.math.computation.updateDependencies(
          mathSymbol.jiixBlockId,
          updatedDependentBlocks,
          updatedVariableSources
        )
      }
    })

    // Second pass: verify bidirectional consistency
    const blockToSources = new Map<string, Set<string>>()
    mathSymbols.forEach(mathSymbol => {
      if (mathSymbol.jiixBlockId) {
        const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
        const sources = computation?.variableSources
          ? new Set(Object.values(computation.variableSources))
          : new Set<string>()
        blockToSources.set(mathSymbol.jiixBlockId, sources)
      }
    })

    mathSymbols.forEach(mathSymbol => {
      if (!mathSymbol.jiixBlockId) return

      const computation = this.editor.math.computation.getMathBlock(mathSymbol.jiixBlockId)
      if (!computation?.dependentBlocks || computation.dependentBlocks.length === 0) return

      const originalLength = computation.dependentBlocks.length

      const updatedDependentBlocks = computation.dependentBlocks.filter(depId => {
        const sources = blockToSources.get(depId)

        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not found in blockToSources map, keeping it in dependentBlocks`)
          return true
        }

        const hasReference = sources.has(mathSymbol.jiixBlockId!)

        if (!hasReference) {
          this.logger.info("cleanupMathDependencies", `Removing "${depId}" from dependentBlocks of "${this.getLabel(mathSymbol.id)}" (${mathSymbol.jiixBlockId}) - block doesn't reference it as a source`)
        }

        return hasReference
      })

      const removedCount = originalLength - updatedDependentBlocks.length
      if (removedCount > 0) {
        this.logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent block(s) from "${this.getLabel(mathSymbol.id)}" (${mathSymbol.jiixBlockId})`)

        // Update computation manager
        this.editor.math.computation.updateDependencies(
          mathSymbol.jiixBlockId,
          updatedDependentBlocks,
          computation.variableSources
        )
      }
    })
  }

  /**
   * Clear solver outputs for dependent blocks
   */
  async clearDependentBlocksSolverOutputs(dependentBlockIds: string[]): Promise<void>
  {
    for (const dependentBlockId of dependentBlockIds) {
      const dependentMathSymbol = this.editor.findMathSymbolByJiixId(dependentBlockId)

      if (!dependentMathSymbol) {
        this.logger.warn("clearDependentBlocksSolverOutputs", `Dependent block not found: ${dependentBlockId}`)
        continue
      }

      await this.editor.math.actions.clearSolverOutputs(dependentMathSymbol.jiixBlockId!)
      this.editor.renderer.drawSymbol(dependentMathSymbol)
    }
    this.editor.event.emitChanged(this.editor.history.context)
  }
}
