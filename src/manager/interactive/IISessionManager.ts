import type { TInteractiveInkCanvas } from "@/canvas"
import { supportsSessionPackage } from "@/client"
import { base64ToBytes, bytesToBase64 } from "@/core"
import { readBlobAsText } from "@/dom"
import { LoggerCategory } from "@/logger"
import type { TSymbol } from "@/symbol"
import { cloneSymbol, isStrokeSolverOutput } from "@/symbol"

import { IIAbstractManager } from "./IIAbstractManager"
import type { TSessionEnvelope } from "./SessionEnvelope"
import { createSessionEnvelope, parseSession } from "./SessionEnvelope"

/**
 * How {@link IISessionManager.restore} opened the server session: from the saved package, or as a
 * new session the strokes were sent to again (no package, server older than 4.6.0, package refused).
 * @group Manager
 */
export type TSessionRestoreMode = "imported" | "replayed"

/**
 * Saves the canvas session to resume it later, even once the server session has expired: the
 * symbols and, from server 4.6.0, the server session as a `.iink` package.
 *
 * Access via `canvas.session`; `canvas.exportAs("session")` and `canvas.download("session")` give the
 * same content as a `.iinkts` file.
 * @group Manager
 */
export class IISessionManager extends IIAbstractManager {
  protected managerName = "IISessionManager"

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
  }

  protected get supportsPackage(): boolean {
    return supportsSessionPackage(this.client.configuration.server.version)
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
    try {
      this.replaceContent(envelope.symbols)
      return await this.openSession(envelope.package)
    } finally {
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
    const strokes = this.canvas.extractStrokesFromSymbols(this.model.symbols).filter((s) => !isStrokeSolverOutput(s))
    if (strokes.length === 0) {
      // A new session has nothing to recognize: an operation of the previous one would stay lit
      this.canvas.clearOperation("Recognizing")
      return
    }
    this.canvas.startOperation("Recognizing")
    await this.client.addStrokes(strokes, false)
  }
}
