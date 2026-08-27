import type { TBaseSymbol } from "@/symbol"

/**
 * Where a symbol sits relative to its neighbours, for {@link SymbolStore.changeOrder}.
 * @group Store
 */
export type TSymbolOrder = "first" | "last" | "forward" | "backward"

/**
 * The document's records, keyed by id and kept in stacking order.
 *
 * Generic on purpose: the constraint is {@link TBaseSymbol} because that is the type carrying `id`,
 * so the same store serves the full `TSymbol` union and any narrower record set.
 *
 * The store hands out **the records themselves**, never copies. Callers read them; to change one,
 * ask for a draft and commit it back.
 * @group Store
 */
export class SymbolStore<T extends TBaseSymbol> {
  #records = new Map<string, T>()
  #version = 0

  /**
   * Bumped by every change to the document. Lets a derived value — a cache, an index, an in-flight
   * export — tell whether what it was computed from is still current.
   */
  get version(): number {
    return this.#version
  }

  get size(): number {
    return this.#records.size
  }

  /** The records in stacking order. */
  list(): T[] {
    return Array.from(this.#records.values())
  }

  get(id: string): T | undefined {
    return this.#records.get(id)
  }

  has(id: string): boolean {
    return this.#records.has(id)
  }

  add(record: T): void {
    if (this.#records.has(record.id)) {
      throw new Error(`Symbol id already exist: ${record.id}`)
    }
    this.#records.set(record.id, record)
    this.#bump()
  }

  /**
   * Replaces the record stored under `record.id`. Unknown ids are ignored rather than inserted, so a
   * stale caller cannot resurrect a deleted symbol.
   */
  update(record: T, markDirty = true): void {
    if (!this.#records.has(record.id)) {
      return
    }
    this.#records.set(record.id, record)
    if (markDirty) {
      this.#bump()
    }
  }

  /** Swaps one record for several, in the position the original held. */
  replace(id: string, records: T[]): void {
    if (!this.#records.has(id)) {
      return
    }
    this.#records.delete(id)
    records.forEach((r) => this.#records.set(r.id, r))
    this.#bump()
  }

  remove(id: string): void {
    if (this.#records.delete(id)) {
      this.#bump()
    }
  }

  /**
   * Moves a record within the stacking order. A `Map` has no reordering primitive, so the entries are
   * rebuilt in the new order — which is also why order has to be maintained here rather than by a
   * caller splicing a list it was handed.
   */
  changeOrder(id: string, position: TSymbolOrder): void {
    const entries = Array.from(this.#records.entries())
    const fromIndex = entries.findIndex(([key]) => key === id)
    if (fromIndex === -1) {
      return
    }
    const last = entries.length - 1
    const toIndex = {
      first: 0,
      last,
      forward: Math.min(fromIndex + 1, last),
      backward: Math.max(fromIndex - 1, 0),
    }[position]
    if (toIndex === fromIndex) {
      return
    }
    const [entry] = entries.splice(fromIndex, 1)
    entries.splice(toIndex, 0, entry)
    this.#records = new Map(entries)
    this.#bump()
  }

  clear(): void {
    this.#records.clear()
    this.#bump()
  }

  #bump(): void {
    this.#version++
  }
}
