import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { TJIIXStrokeItem, TJIIXMathElement, TJIIXMathExpression, TJIIXTextElement, TJIIXNodeElement, TJIIXEdgeElement, TJIIXEdgeLine, JIIXELementType, JIIXEdgeKind } from "@/model"
import { IIStroke, isStroke } from "@/symbol"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 * @remarks Simplified synchronizer that only manages JIIX block IDs and stroke lifecycle
 */
export class IISynchronizerManager extends IIAbstractManager
{
  protected managerName = "IISynchronizerManager"

  #synchronizePromise?: Promise<void>
  // True when synchronize() was called while a sync was already running.
  // The running sync will re-run once to capture strokes added during it.
  #dirtyDuringSync = false

  static readonly SYNCHRONIZE_TIMEOUT = 30000
  static readonly MAX_RETRY_ATTEMPTS = 3

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
    this.logger.info("constructor", "IISynchronizerManager")
  }

  #createTimeoutPromise(timeoutMs: number): Promise<never>
  {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Synchronization timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  async synchronize(): Promise<void>
  {
    if (this.#synchronizePromise) {
      this.logger.debug("synchronize", "Synchronization already in progress, will re-run after")
      this.#dirtyDuringSync = true
      await this.#synchronizePromise
      return
    }

    this.editor.layers.updateState(false)
    this.#synchronizePromise = this.#syncLoop()

    try {
      await this.#synchronizePromise
    } finally {
      this.#synchronizePromise = undefined
      this.editor.layers.updateState(true)
    }
  }

  async #syncLoop(): Promise<void>
  {
    do {
      this.#dirtyDuringSync = false
      await this.#synchronizeWithRetry()
    } while (this.#dirtyDuringSync)
  }

  async #synchronizeWithRetry(): Promise<void>
  {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= IISynchronizerManager.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          this.logger.warn("synchronize", `Retry attempt ${attempt}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS}`)
        }

        await Promise.race([
          this.#doSynchronize(),
          this.#createTimeoutPromise(IISynchronizerManager.SYNCHRONIZE_TIMEOUT)
        ])

        if (attempt > 1) {
          this.logger.info("synchronize", `Synchronization succeeded on attempt ${attempt}`)
        }
        return

      } catch (error) {
        lastError = error as Error
        const isTimeout = error instanceof Error && error.message.includes("timeout")

        if (isTimeout) {
          this.logger.error("synchronize", `Timeout on attempt ${attempt}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS}:`, error)
          if (attempt < IISynchronizerManager.MAX_RETRY_ATTEMPTS) {
            this.logger.warn("synchronize", `Will retry synchronization (attempt ${attempt + 1}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS})`)
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }
        } else {
          // Non-timeout error - don't retry, fail immediately
          this.logger.error("synchronize", "Synchronization failed with non-timeout error:", error)
          throw error
        }
      }
    }

    this.logger.error("synchronize", `Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`)
    throw lastError || new Error(`Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`)
  }

  async #doSynchronize(): Promise<void>
  {
    try {
      await this.editor.export(["application/vnd.myscript.jiix"])
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to export JIIX:", error)
      throw error
    }

    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.logger.debug("synchronize", "JIIX elements:", jiix?.elements)

    if (!jiix) {
      this.logger.warn("synchronize", "No JIIX export available")
      return
    }

    // Collect all stroke IDs present in JIIX
    const jiixStrokeIds = new Set<string>()
    const now = Date.now()

    // Process each element — strokes are reference types, so in-place mutation is
    // immediately visible in model.symbols without calling the O(n) updateSymbol()
    for (const el of jiix.elements || []) {
      try {
        const items = this.#getElementItems(el)
        items.forEach(item => {
          if (item["full-id"]) {
            jiixStrokeIds.add(item["full-id"])
          }
        })

        const strokes = this.#getStrokesFromItems(items)
        for (const stroke of strokes) {
          this.#updateBlockMetadata(stroke, el)

          if (el.type === JIIXELementType.Text) {
            this.editor.jiix.updateTextMetadata(stroke, el)
          }

          stroke.modificationDate = now
        }
      } catch (error) {
        this.logger.error("#doSynchronize", `Failed to synchronize element of type ${el.type}:`, error)
      }
    }

    // Mark model modified once instead of N×O(n) via updateSymbol()
    this.model.modificationDate = now
    this.model.converts = undefined
    this.model.exports = undefined

    // Yield to event loop so pointer events can be processed before math enrichment
    await Promise.resolve()

    // Delete strokes not present in JIIX
    // this.#deleteOrphanedStrokes(jiixStrokeIds)

    // Save JIIX export and update history
    this.model.mergeExport({ "application/vnd.myscript.jiix": jiix })
    this.editor.jiix.invalidateIndex()
    this.editor.history.update(this.model)

    // Enrich math blocks with dependencies — one call per unique jiix block
    const mathBlockIds = this.model.getMathBlocks().map(mb => mb.id)

    for (const blockId of mathBlockIds) {
      try {
        await this.editor.math.enrichMathDependencies(blockId)
      } catch (err) {
        this.logger.error("synchronize", "Error enriching math dependencies:", err)
      }
    }

    // Cleanup invalid math dependencies
    try {
      this.editor.math.cleanupMathDependencies(mathBlockIds)
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to cleanup math dependencies:", error)
    }

    // Refresh math overlays
    try {
      this.editor.math.refreshOverlays()
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to refresh math overlays:", error)
    }

    this.editor.event.emitSynchronized()
  }

  /**
   * Get all stroke items from a JIIX element
   */
  #getElementItems(element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

    switch (element.type) {
      case JIIXELementType.Text:
        // Collect all word items (including those with refs - embedded math)
        element.words?.forEach(word => {
          if (word.items) {
            items.push(...word.items)
          }
        })
        break

      case JIIXELementType.Math:
        // Collect items from expressions
        if (element.items) {
          items.push(...element.items)
        }
        if (element.expressions) {
          element.expressions.forEach(expr => {
            items.push(...this.#collectMathExpressionItems(expr))
          })
        }
        break

      case JIIXELementType.Node:
        if (element.items) {
          items.push(...element.items)
        }
        break

      case JIIXELementType.Edge:
        if (element.kind === JIIXEdgeKind.PolyEdge) {
          element.edges?.forEach((edge: TJIIXEdgeLine) => {
            if (edge.items) {
              items.push(...edge.items)
            }
          })
        } else if (element.items) {
          items.push(...element.items)
        }
        break
    }

    return items
  }

  /**
   * Recursively collect items from math expressions
   */
  #collectMathExpressionItems(expr: TJIIXMathExpression): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

    if (!expr) {
      return items
    }

    if ("items" in expr && expr.items && Array.isArray(expr.items)) {
      items.push(...expr.items)
    }

    if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
      expr.operands.forEach((operand: TJIIXMathExpression) => {
        items.push(...this.#collectMathExpressionItems(operand))
      })
    }

    return items
  }

  /**
   * Get strokes from JIIX items
   */
  #getStrokesFromItems(items: TJIIXStrokeItem[]): IIStroke[]
  {
    const strokes: IIStroke[] = []
    const seen = new Set<string>()

    for (const item of items) {
      const strokeId = item["full-id"]
      if (!strokeId || seen.has(strokeId)) continue
      seen.add(strokeId)
      const symbol = this.model.getRootSymbol(strokeId)
      if (symbol && isStroke(symbol)) {
        strokes.push(symbol)
      }
    }

    return strokes
  }

  /**
   * Update block metadata (jiixBlockId, jiixBlockType ONLY)
   */
  #updateBlockMetadata(
    stroke: IIStroke,
    element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement
  ): void
  {
    stroke.jiixBlockId = element.id

    switch (element.type) {
      case JIIXELementType.Text:
        stroke.jiixBlockType = "Text"
        break
      case JIIXELementType.Math:
        stroke.jiixBlockType = "Math"
        break
      case JIIXELementType.Node:
        stroke.jiixBlockType = "Node"
        break
      case JIIXELementType.Edge:
        stroke.jiixBlockType = "Edge"
        break
    }

    this.logger.debug("#updateBlockMetadata", `Updated ${stroke.id}: jiixBlockId=${element.id}, jiixBlockType=${stroke.jiixBlockType}`)
  }

  // TODO broken when jiix is not up to date
  // /**
  //  * Delete strokes that are not present in JIIX
  //  */
  // #deleteOrphanedStrokes(jiixStrokeIds: Set<string>): void
  // {
  //   const strokesToDelete: string[] = []

  //   this.model.symbols.forEach(symbol => {
  //     if (isStroke(symbol) && !jiixStrokeIds.has(symbol.id)) {
  //       // This stroke is not in JIIX - mark for deletion
  //       strokesToDelete.push(symbol.id)
  //     }
  //   })

  //   if (strokesToDelete.length > 0) {
  //     this.logger.info("#deleteOrphanedStrokes", `Deleting ${strokesToDelete.length} strokes not present in JIIX`)
  //     strokesToDelete.forEach(strokeId => {
  //       this.model.removeSymbol(strokeId)
  //       this.editor.renderer.removeSymbol(strokeId)
  //     })
  //   }
  // }
}
