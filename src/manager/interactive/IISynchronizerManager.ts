import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type {
  TJIIXEdgeElement,
  TJIIXEdgeLine,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXNodeElement,
  TJIIXStrokeItem,
  TJIIXTextElement,
} from "@/client"
import { extractEdgeEndpoints, JIIXEdgeKind, JIIXElementType } from "@/client"
import { CanvasTool, GESTURE_OPERATION_LABELS } from "@/Constants"
import { BoxOps } from "@/core/geometry"
import { OBBOps } from "@/core/geometry"
import type { TDraft } from "@/core/std"
import { LoggerCategory } from "@/logger"
import type { TStroke } from "@/symbol"
import { isStroke } from "@/symbol"
import { resolveConnectionAnchors } from "@/symbol/edge/Anchor"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 * @remarks Simplified synchronizer that only manages JIIX block IDs and stroke lifecycle
 */
export class IISynchronizerManager extends IIAbstractManager {
  protected managerName = "IISynchronizerManager"

  #synchronizePromise?: Promise<void>
  // True when synchronize() was called while a sync was already running.
  // The running sync will re-run once to capture strokes added during it.
  #dirtyDuringSync = false
  // Last-seen content snapshot per JIIX block id, so an unchanged block (the
  // common case for the bulk of a large, already-synced document) can be
  // skipped instead of being reprocessed on every synchronize().
  #lastElementSnapshots = new Map<string, string>()

  static readonly SYNCHRONIZE_TIMEOUT = 30000
  static readonly MAX_RETRY_ATTEMPTS = 3
  /** Elements processed between yields in `#doSynchronize`'s loop, so a large
   * document doesn't block the main thread (and pending pointer input) in one go. */
  static readonly SYNC_YIELD_CHUNK_SIZE = 50

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.SYNCHRONIZER)
    this.logger.info("constructor", "IISynchronizerManager")
  }

  async synchronize(): Promise<void> {
    if (this.#synchronizePromise) {
      this.logger.debug("synchronize", "Synchronization already in progress, will re-run after")
      this.#dirtyDuringSync = true
      await this.#synchronizePromise
      return
    }

    this.#synchronizePromise = this.canvas.trackOperation("Synchronizing", async () => this.#syncLoop())

    try {
      await this.#synchronizePromise
      if (this.canvas.tool === CanvasTool.Select) {
        this.canvas.menu.context.update()
      }
    } finally {
      this.#synchronizePromise = undefined
    }
  }

  async #syncLoop(): Promise<void> {
    do {
      this.#dirtyDuringSync = false
      await this.#synchronizeWithRetry()
    } while (this.#dirtyDuringSync)
  }

  async #synchronizeWithRetry(): Promise<void> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= IISynchronizerManager.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          this.logger.warn("synchronize", `Retry attempt ${attempt}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS}`)
        }

        await this.#doSynchronize()

        if (attempt > 1) {
          this.logger.info("synchronize", `Synchronization succeeded on attempt ${attempt}`)
        }
        return
      } catch (error) {
        lastError = error as Error

        if (attempt < IISynchronizerManager.MAX_RETRY_ATTEMPTS) {
          this.logger.warn(
            "synchronize",
            `Will retry synchronization (attempt ${attempt + 1}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS})`
          )
          await new Promise((resolve) => setTimeout(resolve, 500))
          continue
        } else {
          // Non-timeout error - don't retry, fail immediately
          this.logger.error("synchronize", "Synchronization failed with non-timeout error:", error)
          throw error
        }
      }
    }

    this.logger.error(
      "synchronize",
      `Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`
    )
    throw lastError || new Error(`Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`)
  }

  /** Never contend with an in-progress gesture (writing, translating, resizing, rotating) for the main thread. */
  async #waitForGestureIdle(): Promise<void> {
    while (GESTURE_OPERATION_LABELS.some((label) => this.canvas.hasOperation(label))) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  /** Serializes only the fields `#updateBlockMetadata`/`updateTextMetadata` actually read,
   * so an unrelated JIIX field changing doesn't cause a false "changed" positive. */
  #elementSnapshotKey(element: TJIIXElement): string {
    const textElement = element as TJIIXTextElement
    return JSON.stringify({
      type: element.type,
      label: textElement.label,
      words0: textElement.words?.[0],
      chars0: textElement.chars?.[0],
      lines0: textElement.lines?.[0],
    })
  }

  async #doSynchronize(): Promise<void> {
    // Never contend with an in-progress gesture for the main thread.
    await this.#waitForGestureIdle()

    try {
      await this.canvas.export(["application/vnd.myscript.jiix"])
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to export JIIX:", error)
      throw error
    }

    // export() is a network round-trip - a gesture can start while it was in flight. Re-check
    // before processing its result, since a small document (fewer elements than one yield chunk)
    // would otherwise run the whole loop below in one synchronous pass without ever checking again.
    await this.#waitForGestureIdle()

    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.logger.debug("synchronize", "JIIX elements:", jiix?.elements)

    if (!jiix) {
      this.logger.warn("synchronize", "No JIIX export available")
      return
    }

    const now = Date.now()

    // Stamps the document as changed up front: the per-stroke commits below all pass
    // `markDirty: false`, because jiixBlockId/anchors are local bookkeeping and must not clear
    // `model.exports`, which the very sync being processed just populated.
    this.model.touch()
    let processedSinceYield = 0
    for (const el of jiix.elements || []) {
      const snapshotKey = this.#elementSnapshotKey(el)
      try {
        const items = this.#getElementItems(el)
        const strokes = this.#getStrokesFromItems(items)
        // Even when the element's content fingerprint is unchanged, the live strokes may have
        // lost their jiixBlockId (e.g. a history snapshot restored by undo()/redo() after clear())
        // — re-annotate whenever the metadata itself is missing, not only on content changes.
        const needsMetadata = strokes.some((s) => s.jiixBlockId !== el.id)
        if (needsMetadata || this.#lastElementSnapshots.get(el.id) !== snapshotKey) {
          for (const stroke of strokes) {
            this.#updateBlockMetadata(stroke, el)

            if (el.type === JIIXElementType.Text) {
              this.canvas.jiix.updateTextMetadata(stroke, el)
            }

            stroke.modificationDate = now
            // jiixBlockId/jiixBlockType are local bookkeeping, not part of the JIIX export
            // content — must not clear model.exports, which was just populated by the
            // canvas.export() call this very sync is processing the result of.
            this.model.commitSymbol(stroke, false)
          }
          // Recorded only once every write for this element has landed. Setting it before the
          // loop meant a throw halfway through marked the element as synced for the rest of the
          // session: `needsMetadata` cannot rescue it, because jiixBlockId is already correct
          // and the lost write (text metadata) is in neither that check nor the snapshot key.
          this.#lastElementSnapshots.set(el.id, snapshotKey)
        }

        // Connection anchors must reflect the LATEST JIIX truth on every sync, not only when
        // the metadata-caching gate above says something "changed" — that gate is keyed off
        // fields (label/words/chars/lines) that don't exist on Edge elements, so it would
        // otherwise never re-run once an edge's jiixBlockId is first set, leaving anchors
        // stale after later syncs report a different (or no) connection.
        this.#syncEdgeConnections(el, strokes)
      } catch (error) {
        this.logger.error("#doSynchronize", `Failed to synchronize element of type ${el.type}:`, error)
      }

      processedSinceYield++
      if (processedSinceYield >= IISynchronizerManager.SYNC_YIELD_CHUNK_SIZE) {
        processedSinceYield = 0
        // A big document (thousands of elements) would otherwise keep this loop
        // running synchronously for one long stretch, delaying any pointer input
        // (e.g. a new stroke) queued up behind it until the whole loop is done.
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await this.#waitForGestureIdle()
      }
    }

    // Yield to event loop so pointer events can be processed before math enrichment
    await Promise.resolve()

    // Enrich math blocks with dependencies — parallel with individual timeout to avoid one hanging block stalling the whole sync
    const mathBlockIds = this.model.mathBlocks.map((m) => m.id)
    const ENRICH_TIMEOUT_MS = 5000
    await Promise.allSettled(
      mathBlockIds.map(async (blockId) => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`enrichMathDependencies timeout for "${blockId}"`)), ENRICH_TIMEOUT_MS)
        )
        try {
          // `isStale` lets the enrichment discard its result instead of committing it if strokes
          // kept coming in while the backend round-trip was in flight (this pass's mathBlockIds
          // snapshot may already be outdated by the time the response lands) - a fresh, correct
          // enrichment is guaranteed to run right after via `#dirtyDuringSync`/`#syncLoop`.
          await Promise.race([this.canvas.math.enrichMathDependencies(blockId, () => this.#dirtyDuringSync), timeout])
        } catch (err) {
          if (this.#dirtyDuringSync) {
            this.logger.debug(
              "synchronize",
              `Ignoring enrichMathDependencies failure for stale block "${blockId}":`,
              err
            )
          } else {
            this.logger.error("synchronize", "Error enriching math dependencies:", err)
          }
        }
      })
    )

    // Cleanup invalid math dependencies
    try {
      this.canvas.math.cleanupMathDependencies(mathBlockIds)
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to cleanup math dependencies:", error)
    }

    // Refresh math overlays
    try {
      this.canvas.overlays.refresh()
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to refresh math overlays:", error)
    }

    this.canvas.event.emitSynchronized()
  }

  /**
   * Get all stroke items from a JIIX element
   */
  #getElementItems(
    element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement
  ): TJIIXStrokeItem[] {
    const items: TJIIXStrokeItem[] = []

    switch (element.type) {
      case JIIXElementType.Text:
        // Collect all word items (including those with refs - embedded math)
        element.words?.forEach((word) => {
          if (word.items) {
            items.push(...word.items)
          }
        })
        break

      case JIIXElementType.Math:
        // Collect items from expressions
        if (element.items) {
          items.push(...element.items)
        }
        if (element.expressions) {
          element.expressions.forEach((expr) => {
            items.push(...this.#collectMathExpressionItems(expr))
          })
        }
        break

      case JIIXElementType.Node:
        if (element.items) {
          items.push(...element.items)
        }
        break

      case JIIXElementType.Edge:
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
  #collectMathExpressionItems(expr: TJIIXMathExpression): TJIIXStrokeItem[] {
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
  #getStrokesFromItems(items: TJIIXStrokeItem[]): TDraft<TStroke>[] {
    const strokes: TDraft<TStroke>[] = []
    const seen = new Set<string>()

    for (const item of items) {
      const strokeId = item["full-id"]
      if (!strokeId || seen.has(strokeId)) {
        continue
      }
      seen.add(strokeId)
      const symbol = this.model.draftSymbol(strokeId)
      if (symbol && isStroke(symbol)) {
        strokes.push(symbol as TDraft<TStroke>)
      }
    }

    return strokes
  }

  /**
   * Update block metadata (jiixBlockId, jiixBlockType ONLY)
   */
  #updateBlockMetadata(
    stroke: TDraft<TStroke>,
    element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement
  ): void {
    stroke.jiixBlockId = element.id

    switch (element.type) {
      case JIIXElementType.Text:
        stroke.jiixBlockType = "Text"
        break
      case JIIXElementType.Math:
        stroke.jiixBlockType = "Math"
        break
      case JIIXElementType.Node:
        stroke.jiixBlockType = "Node"
        break
      case JIIXElementType.Edge:
        stroke.jiixBlockType = "Edge"
        break
    }

    this.logger.debug(
      "#updateBlockMetadata",
      `Updated ${stroke.id}: jiixBlockId=${element.id}, jiixBlockType=${stroke.jiixBlockType}`
    )
  }

  /**
   * Resolve and store this edge element's connection anchors on every one of its strokes.
   * Always overwrites from the latest JIIX truth — a connection reported in a previous sync
   * but absent now is cleared, not kept.
   */
  /**
   * Takes the committed strokes and drafts its own: the metadata loop above commits the drafts it
   * was handed, and a committed draft is frozen.
   */
  #syncEdgeConnections(el: TJIIXElement, committed: TStroke[]): void {
    if (el.type !== JIIXElementType.Edge) {
      return
    }
    const strokes = committed
      .map((s) => this.model.draftSymbol(s.id))
      .filter((s): s is TDraft<TStroke> => !!s && isStroke(s))
    const endpoints = extractEdgeEndpoints(el)
    const connectedIds = el.connected ?? []
    if (!endpoints || connectedIds.length === 0) {
      strokes.forEach((stroke) => {
        stroke.startAnchor = undefined
        stroke.endAnchor = undefined
        // Anchors aren't part of the JIIX export content either — same reasoning as the
        // metadata-update loop above.
        this.model.commitSymbol(stroke, false)
      })
      return
    }

    const connections = connectedIds
      .map((blockId) => {
        const strokeIds = this.canvas.jiix.getStrokesForElement(blockId)
        const boxes = strokeIds
          .map((id) => this.model.getRootSymbol(id))
          .filter((s): s is TStroke => !!s)
          .map((s) => OBBOps.toBox(s.bounds))
        if (boxes.length === 0) {
          return undefined
        }
        return { targetId: blockId, box: BoxOps.createFromBoxes(boxes) }
      })
      .filter((c): c is { targetId: string; box: ReturnType<typeof BoxOps.createFromBoxes> } => !!c)

    const { startAnchor, endAnchor } = resolveConnectionAnchors(endpoints.start, endpoints.end, connections)
    strokes.forEach((stroke) => {
      stroke.startAnchor = startAnchor
      stroke.endAnchor = endAnchor
      this.model.commitSymbol(stroke, false)
    })
  }
}
