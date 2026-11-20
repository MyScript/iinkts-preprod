import type { TInteractiveInkCanvas } from "@/canvas"
import { supportsSessionPackage } from "@/client"
import { base64ToBytes, bytesToBase64 } from "@/core"
import { readBlobAsText } from "@/dom"
import { LoggerCategory } from "@/logger"
import type { TStroke, TSymbol } from "@/symbol"
import { cloneSymbol, isStrokeSolverOutput } from "@/symbol"

import { IIAbstractManager } from "./IIAbstractManager"
import type { TSessionEnvelope } from "./SessionEnvelope"
import { createSessionEnvelope, parseSession } from "./SessionEnvelope"

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
}

/**
 * @group Manager
 * @source
 */
export const DefaultPersistenceConfiguration: TPersistenceConfiguration = {
  snapshotDelay: 5000,
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

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
    // Here rather than in onInit: the base constructor calls it before the fields above are set
    this.client.setSessionRecovery({
      package: () => this.snapshotPackage(),
      recover: (imported) => this.recover(imported),
    })
    this.canvas.event.addChangedListener(() => this.onChanged())
    document.addEventListener("visibilitychange", this.onVisibilityChange)
  }

  protected get supportsPackage(): boolean {
    return supportsSessionPackage(this.client.configuration.server.version)
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
    const bytes = await this.client.exportPackage()
    return bytes && { partId, data: bytesToBase64(bytes) }
  }

  /**
   * Replaces the canvas content and its server session with a saved one; the history starts over.
   * The canvas is read-only meanwhile.
   * @param source - A `.iinkts` file or its text, or what {@link save} resolved with
   * @throws when the source is not a session; the content is then left as it was
   */
  async restore(source: Blob | string | TSessionEnvelope): Promise<TSessionRestoreMode> {
    const envelope = await this.read(source)
    this.logger.info("restore", { symbols: envelope.symbols.length, withPackage: !!envelope.package })
    const wasReadOnly = this.canvas.readOnly
    this.canvas.readOnly = true
    this.canvas.layers.showLoader()
    this.restoring = true
    try {
      this.replaceContent(envelope.symbols)
      const mode = await this.openSession(envelope.package)
      // Imported, the file is what the server session now holds: an automatic resume can start from
      // it. Replayed, replay() already dropped the snapshot of the previous content
      if (mode === "imported") {
        this.resetSnapshot(envelope)
      }
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
        // The imported content is already recognized: no contentChanged will end a recognition
        this.canvas.clearOperation("Recognizing")
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
    if (this.snapshotDelay <= 0) {
      return
    }
    this.changedSinceSnapshot = true
    this.clearSnapshotTimer()
    this.snapshotTimer = setTimeout(() => this.takeSnapshot(), this.snapshotDelay)
  }

  protected onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden" && this.snapshotDelay > 0) {
      void this.takeSnapshot()
    }
  }

  /** Saves the session in memory, if it changed since and can be saved now */
  protected async takeSnapshot(): Promise<void> {
    this.clearSnapshotTimer()
    if (!this.changedSinceSnapshot || this.restoring || this.client.isOffline || !this.supportsPackage) {
      return
    }
    this.changedSinceSnapshot = false
    try {
      this.snapshot = await this.save()
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
  }
}
