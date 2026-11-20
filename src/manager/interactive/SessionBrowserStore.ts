import type { CanvasEvent } from "@/canvas"
import { createUUID } from "@/core"
import type { Logger } from "@/logger"
import type { TSymbol } from "@/symbol"

import type { TSessionEnvelope } from "./SessionEnvelope"
import { parseSession, parseSymbols, serializeSession } from "./SessionEnvelope"
import { SessionLock } from "./SessionLock"
import type { TSavedSessionInfo } from "./SessionStorage"
import { SessionStorage } from "./SessionStorage"

// Writing the symbols waits for the changes to pause this long: a stroke is not a document
const SYMBOLS_WRITE_DELAY = 500

/**
 * Why the session is not saved in the browser:
 * - `unsupported` — no IndexedDB (private mode of some browsers, disabled storage)
 * - `locked` — another canvas, maybe in another tab, writes this document
 * - `lost` — another canvas took the document over while this page slept
 * - `error` — the storage failed (quota, blocked database)
 * @group Manager
 */
export type TSessionStorageUnavailableReason = "unsupported" | "locked" | "lost" | "error"

/** The document key when the integrator gives none: the page path and the canvas element */
function documentKeyOf(element: HTMLElement): string {
  return `${location.pathname}#${element.id || elementPath(element)}`
}

function elementPath(element: HTMLElement): string {
  const steps: string[] = []
  for (let node: Element | null = element; node?.parentElement; node = node.parentElement) {
    steps.unshift(`${node.tagName.toLowerCase()}:${Array.from(node.parentElement.children).indexOf(node)}`)
  }
  return steps.join(">")
}

/**
 * What a saved session holds: its latest symbols, and the snapshot its server package belongs to
 * @group Manager
 */
export type TSavedSession = { symbols: TSymbol[]; snapshot?: TSessionEnvelope }

/**
 * The session of one canvas saved in the browser, under its document key: one entry per page load,
 * written from the first change on, next to the entries earlier pages left.
 * @group Manager
 */
export class SessionBrowserStore {
  /** Sessions earlier pages saved for this document, most recent first */
  saved: TSavedSessionInfo[] = []
  protected storage?: SessionStorage
  protected lock?: SessionLock
  protected documentKey?: string
  /** Entry this canvas writes */
  protected readonly entryId = createUUID()
  protected writeTimer?: ReturnType<typeof setTimeout>

  constructor(
    protected event: CanvasEvent,
    protected logger: Logger,
    protected symbols: () => TSymbol[]
  ) {}

  /**
   * Takes the document, purges the storage and lists what earlier pages saved. Never throws: the
   * canvas works without it, the reason goes to the `session-storage-unavailable` event.
   */
  async start(options: { key?: string; root: HTMLElement; maxAge: number; maxSize: number }): Promise<void> {
    const factory = globalThis.indexedDB
    if (!factory) {
      this.event.emitSessionStorageUnavailable("unsupported")
      return
    }
    const storage = new SessionStorage(factory)
    const key = options.key ?? documentKeyOf(options.root)
    try {
      const lock = new SessionLock(storage, globalThis.navigator?.locks, () => this.stop("lost"))
      if (!(await lock.acquire(key, this.entryId))) {
        storage.close()
        this.event.emitSessionStorageUnavailable("locked")
        return
      }
      await storage.purge({ maxAge: options.maxAge, maxSize: options.maxSize, now: Date.now(), keep: this.entryId })
      this.saved = await storage.list(key)
      this.storage = storage
      this.lock = lock
      this.documentKey = key
    } catch (error) {
      this.logger.warn("start", "Session storage unavailable", error)
      storage.close()
      this.event.emitSessionStorageUnavailable("error")
      return
    }
    if (this.saved.length) {
      this.event.emitSavedSessionsAvailable(this.saved)
    }
  }

  /** Writes the symbols once the changes pause */
  scheduleWrite(): void {
    if (!this.storage) {
      return
    }
    clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => void this.flush(), SYMBOLS_WRITE_DELAY)
  }

  /** Writes the symbols now if a write waits; an empty canvas deletes its entry */
  async flush(): Promise<void> {
    if (this.writeTimer === undefined) {
      return
    }
    clearTimeout(this.writeTimer)
    this.writeTimer = undefined
    const symbols = this.symbols()
    await this.write((storage, key) =>
      symbols.length
        ? storage.writeSymbols({
            id: this.entryId,
            key,
            symbols: JSON.stringify(symbols),
            symbolCount: symbols.length,
            now: Date.now(),
          })
        : storage.delete(this.entryId)
    )
  }

  async writeSnapshot(snapshot: TSessionEnvelope): Promise<void> {
    if (!this.symbols().length) {
      // Its entry is deleted: a snapshot alone would bring it back, without symbols
      return
    }
    await this.write((storage, key) =>
      storage.writeSnapshot({ id: this.entryId, key, snapshot: serializeSession(snapshot), now: Date.now() })
    )
  }

  protected async write(write: (storage: SessionStorage, key: string) => Promise<void>): Promise<void> {
    if (!this.storage || !this.documentKey) {
      return
    }
    try {
      await write(this.storage, this.documentKey)
    } catch (error) {
      this.logger.warn("write", "Session not saved in the browser", error)
    }
  }

  /** @throws when no session `id` is saved */
  async read(id: string): Promise<TSavedSession> {
    const stored = await this.storage?.read(id)
    if (!stored) {
      throw new Error(`No saved session ${id}`)
    }
    return {
      symbols: parseSymbols(stored.symbols),
      snapshot: stored.snapshot ? parseSession(stored.snapshot) : undefined,
    }
  }

  /** Deletes a saved session, or all those earlier pages saved for this document */
  async discard(id?: string): Promise<void> {
    const ids = id ? [id] : this.saved.map((s) => s.id)
    await Promise.all(ids.map((i) => this.storage?.delete(i)))
    this.saved = this.saved.filter((s) => !ids.includes(s.id))
  }

  /** Stops writing; with a reason, tells it */
  stop(reason?: TSessionStorageUnavailableReason): void {
    clearTimeout(this.writeTimer)
    this.writeTimer = undefined
    this.lock?.release()
    this.storage?.close()
    this.lock = this.storage = this.documentKey = undefined
    if (reason) {
      this.event.emitSessionStorageUnavailable(reason)
    }
  }
}
