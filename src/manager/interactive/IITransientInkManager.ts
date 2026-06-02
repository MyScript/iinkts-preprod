import { LoggerManager, LoggerCategory } from "@/logger"
import { SVGRenderer } from "@/renderer"
import { IIModel } from "@/model"

/**
 * Manages transient ink overlays (temporary solver results)
 * These are removed when source blocks are modified
 * @group Manager
 */
export class IITransientInkManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)

  // Map: sourceBlockId -> transient symbol IDs
  #transientSymbols: Map<string, string[]> = new Map()

  renderer: SVGRenderer
  model: IIModel

  constructor(renderer: SVGRenderer, model: IIModel) {
    this.#logger.info("constructor")
    this.renderer = renderer
    this.model = model
  }

  /**
   * Add a transient symbol (solver output) linked to a source block
   */
  addTransientSymbol(sourceBlockId: string, symbolId: string): void {
    this.#logger.debug("addTransientSymbol", { sourceBlockId, symbolId })

    if (!this.#transientSymbols.has(sourceBlockId)) {
      this.#transientSymbols.set(sourceBlockId, [])
    }

    const symbols = this.#transientSymbols.get(sourceBlockId)!
    if (!symbols.includes(symbolId)) {
      symbols.push(symbolId)
    }
  }

  /**
   * Remove all transient symbols associated with a source block
   */
  clearTransientsForBlock(sourceBlockId: string): void {
    this.#logger.debug("clearTransientsForBlock", { sourceBlockId })

    const symbolIds = this.#transientSymbols.get(sourceBlockId)
    if (!symbolIds) {
      return
    }

    // Remove from renderer
    symbolIds.forEach(id => {
      this.renderer.removeSymbol(id)
    })

    // Remove from model if symbols exist
    symbolIds.forEach(id => {
      const symbol = this.model.symbols.find(s => s.id === id)
      if (symbol) {
        this.model.removeSymbol(symbol.id)
      }
    })

    this.#transientSymbols.delete(sourceBlockId)
  }

  /**
   * Clear all transient symbols
   */
  clearAll(): void {
    this.#logger.info("clearAll", "Clearing all transient symbols")

    for (const sourceBlockId of this.#transientSymbols.keys()) {
      this.clearTransientsForBlock(sourceBlockId)
    }
  }

  /**
   * Get all transient symbol IDs for a block
   */
  getTransientsForBlock(sourceBlockId: string): string[] {
    return this.#transientSymbols.get(sourceBlockId) || []
  }

  /**
   * Check if a symbol is transient
   */
  isTransient(symbolId: string): boolean {
    for (const symbols of this.#transientSymbols.values()) {
      if (symbols.includes(symbolId)) {
        return true
      }
    }
    return false
  }

  /**
   * Get all transient symbols across all blocks
   */
  getAllTransients(): Map<string, string[]> {
    return new Map(this.#transientSymbols)
  }
}
