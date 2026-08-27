import { mergeExports } from "@/core/std"
import { LoggerCategory, LoggerManager } from "@/logger"
import { SymbolStore, type TSymbolOrder } from "@/store"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"

import type { TExport, TJIIXMathElement, TJIIXTextElement } from "./Export"
import { JIIXElementType } from "./Export"

/**
 * @group Model
 */
export class IIModel {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #store = new SymbolStore<TSymbol>()
  #selectedIds = new Set<string>()
  #modificationDate: number
  #exports?: TExport
  readonly creationTime: number

  constructor(creationDate = Date.now()) {
    this.creationTime = creationDate
    this.#modificationDate = creationDate
  }

  /**
   * Bumped on every mutation that invalidates `exports` (add/remove/update/replace/order/clear).
   * Lets an in-flight export request detect that the model changed while it was waiting
   * for a server response, so a now-stale response isn't cached as if it were current.
   */
  get version(): number {
    return this.#store.version
  }

  get modificationDate(): number {
    return this.#modificationDate
  }

  get exports(): TExport | undefined {
    return this.#exports
  }

  /** The ids of the selected symbols. Change the selection through {@link selectSymbol} and friends. */
  get selectedIds(): ReadonlySet<string> {
    return this.#selectedIds
  }

  /** How many symbols the document holds, without building — and cloning — the list to count it. */
  get symbolCount(): number {
    return this.#store.size
  }

  /**
   * A fresh, deep-cloned array on every access. Never pass it to a logger: the arguments of
   * `logger.debug` are evaluated whether or not the level is enabled, so a per-mutation
   * `debug("…", this.symbols)` clones the whole document once per mutation and turns any loop over
   * symbols into O(n^2). That is what it used to do in addSymbol/updateSymbol/removeSymbol.
   */
  get symbols(): TSymbol[] {
    return this.#store.list().map(cloneSymbol)
  }

  get symbolsSelected(): TSymbol[] {
    return this.#store
      .list()
      .filter((s) => this.#selectedIds.has(s.id))
      .map(cloneSymbol)
  }

  /**
   * Get all Text blocks from JIIX export
   * @returns Array of Text elements from the JIIX export, or empty array if no export available
   */
  get textBlocks(): TJIIXTextElement[] {
    const jiixExport = this.#exports?.["application/vnd.myscript.jiix"]
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
    const jiixExport = this.#exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }
    return jiixExport.elements.filter((el): el is TJIIXMathElement => el.type === JIIXElementType.Math)
  }

  selectSymbol(id: string): void {
    this.#selectedIds.add(id)
  }

  unselectSymbol(id: string): void {
    this.#selectedIds.delete(id)
  }

  resetSelection(): void {
    this.#selectedIds.clear()
  }

  getRootSymbol(id: string): TSymbol | undefined {
    const s = this.#store.get(id)
    return s ? cloneSymbol(s) : undefined
  }

  addSymbol(symbol: TSymbol): void {
    this.#logger.info("addSymbol", { symbol })
    this.#commit(() => this.#store.add(symbol))
  }

  updateSymbol(updatedSymbol: TSymbol, markDirty: boolean = true): void {
    this.#logger.info("updateSymbol", { updatedSymbol, markDirty })
    if (markDirty && this.#store.has(updatedSymbol.id)) {
      updatedSymbol.modificationDate = Date.now()
    }
    this.#commit(() => this.#store.update(updatedSymbol, markDirty))
  }

  replaceSymbol(id: string, symbols: TSymbol[]): void {
    this.#commit(() => this.#store.replace(id, symbols))
  }

  changeOrderSymbol(id: string, position: TSymbolOrder): void {
    this.#commit(() => this.#store.changeOrder(id, position))
  }

  removeSymbol(id: string): void {
    this.#logger.info("removeSymbol", { id })
    this.#commit(() => this.#store.remove(id))
  }

  /**
   * Stamps the model as changed without going through a mutator.
   *
   * Its one caller mutates committed records in place and needs the change to be visible downstream.
   * That pattern is what IIC-1970 converts to draft-then-commit and IIC-1974 makes impossible, and
   * this method goes with it.
   */
  touch(): void {
    this.#modificationDate = Date.now()
  }

  /**
   * Force `exports` to be considered stale (e.g. after a language change), without
   * going through a symbol mutation.
   */
  invalidateExports(): void {
    this.#modificationDate = Date.now()
    this.#exports = undefined
  }

  mergeExport(exports: TExport) {
    this.#logger.info("mergeExport", { exports })
    this.#exports = mergeExports(this.#exports, exports)
    this.#logger.debug("mergeExport", this.#exports)
  }

  clear(): void {
    this.#logger.info("clear")
    this.#commit(() => this.#store.clear())
  }

  /**
   * Runs a store mutation and applies the model-level consequences — but only if the store says
   * something actually changed. The store's version is the single source of truth for that, so a
   * no-op (an unknown id, a move that was already at the edge) does not invalidate an export.
   */
  #commit(mutate: () => void): void {
    const before = this.#store.version
    mutate()
    if (this.#store.version !== before) {
      this.#modificationDate = Date.now()
      this.#exports = undefined
    }
  }
}
