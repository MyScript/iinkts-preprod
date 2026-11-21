import type { TInteractiveInkCanvas } from "@/canvas"
import { base64ToBytes, bytesToBase64 } from "@/core"
import { readBlobAsText } from "@/dom"
import { LoggerCategory } from "@/logger"
import type { TStroke, TSymbol } from "@/symbol"
import { cloneSymbol, isStrokeSolverOutput } from "@/symbol"

import { IIAbstractManager } from "./IIAbstractManager"
import { SessionBrowserStore } from "./SessionBrowserStore"
import type { TSessionEnvelope } from "./SessionEnvelope"
import { createSessionEnvelope, parseSession } from "./SessionEnvelope"
import type { TSavedSessionInfo } from "./SessionStorage"

/**
 * @group Manager
 */
export type TPersistenceConfiguration = {
  /**
   * Milliseconds after the last change before the session is saved in memory, to resume it once the
   * server has lost it (it expires after about an hour without activity); `0` never saves it.
   * The session is also saved when the page is hidden. Needs server 4.6.0 or later.
   */
  snapshotDelay: number
  /**
   * Saves the session in the browser (IndexedDB) to resume it after the page is reloaded: see
   * `canvas.session.saved` and the `saved-sessions-available` event
   */
  storage: boolean
  /** Document the session belongs to; by default the page path and the canvas element id */
  key?: string
  /** Milliseconds a session saved in the browser and not written since is kept */
  maxAge: number
  /** Characters kept in the browser for all documents; the oldest sessions go first */
  maxSize: number
}

/**
 * @group Manager
 * @source
 */
export const DefaultPersistenceConfiguration: TPersistenceConfiguration = {
  snapshotDelay: 5000,
  storage: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  maxSize: 50 * 1024 * 1024,
}

/**
 * How {@link IISessionManager.restore} opened the server session: from the saved package, or as a
 * new session the strokes were sent to again (no package, server older than 4.6.0, package refused).
 * @group Manager
 */
export type TSessionRestoreMode = "imported" | "replayed"

/** Strokes the server has to be told about, ink only: a solver output would come back as ink */
const inkStrokes = (canvas: TInteractiveInkCanvas, symbols: TSymbol[]): TStroke[] =>
  canvas.extractStrokesFromSymbols(symbols).filter((s) => !isStrokeSolverOutput(s))

/** What changed from `before` to `after`: a stroke changed in place keeps its id, not its date */
function diffStrokes(before: TStroke[], after: TStroke[]): { removedIds: string[]; newStrokes: TStroke[] } {
  const previous = new Map(before.map((s) => [s.id, s]))
  const current = new Set(after.map((s) => s.id))
  const changed = after.filter((s) => previous.has(s.id) && previous.get(s.id)!.modificationDate !== s.modificationDate)
  const added = after.filter((s) => !previous.has(s.id))
  return {
    removedIds: [...before.filter((s) => !current.has(s.id)).map((s) => s.id), ...changed.map((s) => s.id)],
    newStrokes: [...changed, ...added],
  }
}

/**
 * Saves the canvas session to resume it later, even once the server session has expired: the
 * symbols and, from server 4.6.0, the server session as a `.iink` package.
 *
 * It also keeps the last one in memory, taken a while after the changes stop
 * (`configuration.persistence`): when the server has lost the session, the client starts a new one
 * from it and this manager sends what changed since.
 *
 * Access via `canvas.session`; `canvas.exportAs("session")` and `canvas.download("session")` give the
 * same content as a `.iinkts` file.
 * @group Manager
 */
export class IISessionManager extends IIAbstractManager {
  protected managerName = "IISessionManager"
  /** Last session saved in memory, what an automatic resume starts from */
  protected snapshot?: TSessionEnvelope
  protected changedSinceSnapshot = false
  protected snapshotTimer?: ReturnType<typeof setTimeout>
  /** While restoring, the content is not the session's yet */
  protected restoring = false
  protected browserStore: SessionBrowserStore

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
    // Here rather than in onInit: the base constructor calls it before the fields above are set
    this.client.setSessionRecovery({
      package: () => this.snapshotPackage(),
      recover: (imported) => this.recover(imported),
    })
    this.browserStore = new SessionBrowserStore(this.canvas.event, this.logger, () => this.model.symbols)
    this.canvas.event.addChangedListener(() => this.onChanged())
    document.addEventListener("visibilitychange", this.onVisibilityChange)
  }

  /** Sessions earlier pages saved in the browser for this document, most recent first */
  get saved(): TSavedSessionInfo[] {
    return this.browserStore.saved
  }

  /**
   * Starts saving the session in the browser, once the canvas is connected: called by
   * `initialize()`. Never throws.
   */
  async start(): Promise<void> {
    const { storage, key, maxAge, maxSize } = this.configuration.persistence
    if (storage) {
      await this.browserStore.start({ key, root: this.canvas.layers.root, maxAge, maxSize })
    }
  }

  protected get supportsPackage(): boolean {
    return this.client.sessionPackageSupported
  }

  protected get snapshotDelay(): number {
    return this.configuration.persistence.snapshotDelay
  }

  /** The canvas symbols and the server session, as they are now */
  async save(): Promise<TSessionEnvelope> {
    this.logger.info("save")
    return createSessionEnvelope(this.model.symbols.map(cloneSymbol), await this.exportPackage())
  }

  protected async exportPackage(): Promise<TSessionEnvelope["package"]> {
    const partId = this.client.partId
    if (!partId || !this.supportsPackage) {
      return undefined
    }
    try {
      const bytes = await this.client.exportPackage()
      return bytes && { partId, data: bytesToBase64(bytes) }
    } catch (error) {
      // Without package the session still resumes, by sending the strokes again
      this.logger.warn("save", "Session package not exported", error)
      return undefined
    }
  }

  /**
   * Replaces the canvas content and its server session with a saved one; the history starts over.
   * The canvas is read-only meanwhile.
   * @param source - A `.iinkts` file or its text, or what {@link save} resolved with
   * @throws when the source is not a session; the content is then left as it was
   */
  async restore(source: Blob | string | TSessionEnvelope): Promise<TSessionRestoreMode> {
    const envelope = await this.read(source)
    return this.restoreContent(envelope.symbols, envelope)
  }

  /**
   * Restores a session an earlier page saved in the browser (see {@link saved}); this canvas then
   * writes it on as its own, the saved one is removed.
   * @throws when no session `id` is saved
   */
  async restoreSaved(id: string): Promise<TSessionRestoreMode> {
    const { symbols, snapshot } = await this.browserStore.read(id)
    const mode = await this.restoreContent(symbols, snapshot)
    await this.browserStore.discard(id)
    return mode
  }

  /** Deletes a session an earlier page saved in the browser, or all of them */
  discard(id?: string): Promise<void> {
    return this.browserStore.discard(id)
  }

  /**
   * Shows `symbols` and opens the server session from the package of `snapshot` if any, then sends
   * the server what changed from the snapshot symbols; without package, sends every stroke.
   */
  protected async restoreContent(
    symbols: TSymbol[],
    snapshot: TSessionEnvelope | undefined
  ): Promise<TSessionRestoreMode> {
    this.logger.info("restore", { symbols: symbols.length, withPackage: !!snapshot?.package })
    const wasReadOnly = this.canvas.readOnly
    this.canvas.readOnly = true
    this.canvas.layers.showLoader()
    this.restoring = true
    try {
      this.replaceContent(symbols)
      const mode = await this.openSession(snapshot?.package)
      // Imported, the package is what the server session now holds: an automatic resume can start
      // from it. Replayed, replay() already dropped the snapshot of the previous content
      if (mode === "imported" && snapshot) {
        this.resetSnapshot(snapshot)
        await this.sendChanges(snapshot.symbols, this.model.symbols)
      }
      this.onChanged()
      return mode
    } finally {
      this.restoring = false
      this.canvas.readOnly = wasReadOnly
      this.canvas.layers.hideLoader()
    }
  }

  protected async read(source: Blob | string | TSessionEnvelope): Promise<TSessionEnvelope> {
    if (source instanceof Blob) {
      return parseSession(await readBlobAsText(source))
    }
    return typeof source === "string" ? parseSession(source) : source
  }

  protected replaceContent(symbols: TSymbol[]): void {
    this.canvas.unselectAll()
    this.renderer.clear()
    this.model.clear()
    symbols.forEach((symbol) => {
      this.model.addSymbol(symbol)
      this.renderer.drawSymbol(symbol)
    })
    this.canvas.history.clear()
    this.canvas.history.init(this.model)
  }

  protected async openSession(sessionPackage: TSessionEnvelope["package"]): Promise<TSessionRestoreMode> {
    if (sessionPackage && this.supportsPackage) {
      try {
        await this.client.importPackage(base64ToBytes(sessionPackage.data), sessionPackage.partId)
        return "imported"
      } catch (error) {
        this.logger.warn("restore", "Session package not imported, the strokes are sent again", error)
      }
    }
    await this.replay()
    return "replayed"
  }

  /**
   * Opens a new session with the canvas configuration and sends it every stroke, but the solver
   * outputs: being strokes, they would come back as ink.
   */
  async replay(): Promise<void> {
    await this.client.newSession(this.configuration)
    this.resetSnapshot(undefined)
    await this.sendChanges([], this.model.symbols)
    this.onChanged()
  }

  /** Brings the new session the client opened, once the server lost the previous one, up to date */
  protected async recover(imported: boolean): Promise<void> {
    this.logger.info("recover", { imported })
    const resumedFrom = imported ? (this.snapshot?.symbols ?? []) : []
    await this.sendChanges(resumedFrom, this.model.symbols)
    this.model.invalidateExports()
    // The snapshot no longer matches the new session: take one of it
    this.resetSnapshot(undefined)
    this.onChanged()
  }

  /** Sends the server what changed from the symbols it has to the canvas ones */
  protected async sendChanges(serverSymbols: TSymbol[], canvasSymbols: TSymbol[]): Promise<void> {
    const { removedIds, newStrokes } = diffStrokes(
      inkStrokes(this.canvas, serverSymbols),
      inkStrokes(this.canvas, canvasSymbols)
    )
    if (!removedIds.length && !newStrokes.length) {
      // Nothing for the server to recognize: an operation of the previous session would stay lit
      this.canvas.clearOperation("Recognizing")
      return
    }
    this.canvas.startOperation("Recognizing")
    if (!removedIds.length) {
      await this.client.addStrokes(newStrokes, false)
    } else if (!newStrokes.length) {
      await this.client.eraseStrokes(removedIds)
    } else {
      await this.client.replaceStrokes(removedIds, newStrokes)
    }
  }

  protected snapshotPackage(): { data: Uint8Array; partId: string } | undefined {
    const sessionPackage = this.snapshot?.package
    return sessionPackage && { data: base64ToBytes(sessionPackage.data), partId: sessionPackage.partId }
  }

  protected resetSnapshot(snapshot: TSessionEnvelope | undefined): void {
    this.clearSnapshotTimer()
    this.snapshot = snapshot
    this.changedSinceSnapshot = !snapshot
  }

  protected onChanged(): void {
    this.browserStore.scheduleWrite()
    if (this.snapshotDelay <= 0) {
      return
    }
    this.changedSinceSnapshot = true
    this.clearSnapshotTimer()
    this.snapshotTimer = setTimeout(() => this.takeSnapshot(), this.snapshotDelay)
  }

  protected onVisibilityChange = (): void => {
    if (document.visibilityState !== "hidden") {
      return
    }
    void this.browserStore.flush()
    if (this.snapshotDelay > 0) {
      void this.takeSnapshot()
    }
  }

  /** Saves the session in memory, if it changed since and can be saved now */
  protected async takeSnapshot(): Promise<void> {
    this.clearSnapshotTimer()
    // An empty canvas has nothing to resume
    if (
      !this.changedSinceSnapshot ||
      this.restoring ||
      this.client.isOffline ||
      !this.supportsPackage ||
      !this.model.symbols.length
    ) {
      return
    }
    this.changedSinceSnapshot = false
    try {
      this.snapshot = await this.save()
      await this.browserStore.writeSnapshot(this.snapshot)
    } catch (error) {
      this.changedSinceSnapshot = true
      this.logger.warn("takeSnapshot", "Session not saved in memory", error)
    }
  }

  protected clearSnapshotTimer(): void {
    clearTimeout(this.snapshotTimer)
    this.snapshotTimer = undefined
  }

  protected onDestroy(): void {
    this.clearSnapshotTimer()
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    this.client.setSessionRecovery(undefined)
    this.browserStore.stop()
  }
}
