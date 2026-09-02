import { mergeExports } from "@/core/std"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"

import type { TExport, TJIIXMathElement, TJIIXTextElement } from "./Export"
import { JIIXElementType } from "./Export"

/**
 * @group Model
 */
export class IIModel {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #symbolsMap = new Map<string, TSymbol>()
  #version = 0
  readonly creationTime: number
  modificationDate: number
  exports?: TExport
  selectedIds: Set<string>

  constructor(creationDate = Date.now()) {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.exports = undefined
    this.selectedIds = new Set()
  }

  /**
   * Bumped on every mutation that invalidates `exports` (add/remove/update/replace/clear).
   * Lets an in-flight export request detect that the model changed while it was waiting
   * for a server response, so a now-stale response isn't cached as if it were current.
   */
  get version(): number {
    return this.#version
  }

  /**
   * A fresh, deep-cloned array on every access. Never pass it to a logger: the arguments of
   * `logger.debug` are evaluated whether or not the level is enabled, so a per-mutation
   * `debug("…", this.symbols)` clones the whole document once per mutation and turns any loop over
   * symbols into O(n^2). That is what it used to do in addSymbol/updateSymbol/removeSymbol.
   */
  get symbols(): TSymbol[] {
    return Array.from(this.#symbolsMap.values(), cloneSymbol)
  }

  get symbolsSelected(): TSymbol[] {
    return this.symbols.filter((s) => this.selectedIds.has(s.id))
  }

  /**
   * Get all Text blocks from JIIX export
   * @returns Array of Text elements from the JIIX export, or empty array if no export available
   */
  get textBlocks(): TJIIXTextElement[] {
    const jiixExport = this.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXTextElement => el.type === JIIXElementType.Text)
  }

  /**
   * Get all Math blocks from JIIX export
   * @returns Array of Math elements from the JIIX export, or empty array if no export available
   */
  get mathBlocks(): TJIIXMathElement[] {
    const jiixExport = this.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXMathElement => el.type === JIIXElementType.Math)
  }

  selectSymbol(id: string): void {
    this.selectedIds.add(id)
  }

  unselectSymbol(id: string): void {
    this.selectedIds.delete(id)
  }

  resetSelection(): void {
    this.selectedIds.clear()
  }

  getRootSymbol(id: string): TSymbol | undefined {
    const s = this.#symbolsMap.get(id)
    return s ? cloneSymbol(s) : undefined
  }

  addSymbol(symbol: TSymbol): void {
    this.#logger.info("addSymbol", { symbol })
    if (this.#symbolsMap.has(symbol.id)) {
      throw new Error(`Symbol id already exist: ${symbol.id}`)
    }
    this.#symbolsMap.set(symbol.id, symbol)
    this.#markDirty()
    this.#logger.debug("addSymbol", { count: this.#symbolsMap.size })
  }

  updateSymbol(updatedSymbol: TSymbol, markDirty: boolean = true): void {
    this.#logger.info("updateSymbol", {
      updatedSymbol,
      markDirty,
    })
    if (this.#symbolsMap.has(updatedSymbol.id)) {
      if (markDirty) {
        updatedSymbol.modificationDate = Date.now()
      }
      this.#symbolsMap.set(updatedSymbol.id, updatedSymbol)
      if (markDirty) {
        this.#markDirty()
      }
    }
    this.#logger.debug("updateSymbol", { count: this.#symbolsMap.size })
  }

  replaceSymbol(id: string, symbols: TSymbol[]): void {
    if (this.#symbolsMap.delete(id)) {
      symbols.forEach((s) => this.#symbolsMap.set(s.id, s))
      this.#markDirty()
    }
  }

  // TODO fix ordre add attribut on TSymbol to define
  changeOrderSymbol(id: string, position: "first" | "last" | "forward" | "backward") {
    const fromIndex = this.symbols.findIndex((s) => s.id === id)
    if (fromIndex > -1) {
      let toIndex = fromIndex
      switch (position) {
        case "first":
          toIndex = 0
          break
        case "last":
          toIndex = this.symbols.length - 1
          break
        case "forward":
          toIndex = Math.min(toIndex + 1, this.symbols.length - 1)
          break
        case "backward":
          toIndex = Math.max(toIndex - 1, 0)
          break
      }
      const sym = this.symbols.splice(fromIndex, 1)[0]
      this.symbols.splice(toIndex, 0, sym)
    }
  }

  removeSymbol(id: string): void {
    this.#logger.info("removeSymbol", { id })
    if (this.#symbolsMap.delete(id)) {
      this.#markDirty()
    }
    this.#logger.debug("removeSymbol", { count: this.#symbolsMap.size })
  }

  /**
   * Force `exports` to be considered stale (e.g. after a language change), without
   * going through a symbol mutation.
   */
  invalidateExports(): void {
    this.#markDirty()
  }

  #markDirty(): void {
    this.modificationDate = Date.now()
    this.exports = undefined
    this.#version++
  }

  mergeExport(exports: TExport) {
    this.#logger.info("mergeExport", { exports })
    this.exports = mergeExports(this.exports, exports)
    this.#logger.debug("mergeExport", this.exports)
  }

  clear(): void {
    this.#logger.info("clear")
    this.#symbolsMap.clear()
    this.#markDirty()
  }
}
