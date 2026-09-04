import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TPoint } from "@/core/geometry"
import { MatrixTransform, type TOBB } from "@/core/geometry"
import type { TIIHistoryChanges } from "@/history"
import type { TEdge, TMath, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IITranslateManager extends IIAbstractTransformManager {
  protected managerName = "IITranslateManager"
  protected transformName = "translate"
  transformOrigin!: TPoint

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * The five per-type methods below are now one line each. The behaviour they held lives on each
   * symbol's util, so a custom symbol translates too — which the throwing `default` of
   * `applyToSymbol` used to make impossible.
   *
   * They exist at all only because `IIAbstractTransformManager` still declares them abstract.
   * IIC-2014 removes those declarations, and these five go with them.
   */
  #throughUtil<T extends TSymbol>(symbol: T, matrix: MatrixTransform): T {
    symbolRegistry.getUtilFor(symbol).translate(symbol, { matrix, typeset: this.canvas.typeset })
    return symbol
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke {
    return this.#throughUtil(stroke, matrix)
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape {
    return this.#throughUtil(shape, matrix)
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge {
    return this.#throughUtil(edge, matrix)
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText {
    return this.#throughUtil(text, matrix)
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath {
    return this.#throughUtil(math, matrix)
  }

  translate(symbols: TSymbol[], tx: number, ty: number, addToHistory = true): Promise<void> {
    this.logger.info("translate", {
      symbols,
      tx,
      ty,
    })
    this.canvas.connector.clearAnchoredEdgesFor(symbols)
    // Snapshotted before applyAndDraw mutates `symbols` below: gradient-follow needs the
    // moving target's PRE-transform center (same reference point the drag preview used), not
    // its already-moved bounds, or the committed shape would snap to a different form than
    // what was just shown while dragging.
    const preTransformBoundsById = new Map<string, TOBB>()
    symbols.forEach((s) => {
      const bounds = (s as unknown as { bounds?: TOBB }).bounds
      if (bounds) {
        preTransformBoundsById.set(s.id, { ...bounds, center: { ...bounds.center } })
      }
    })
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.applyAndDraw(symbols, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(symbols, matrix)
    // Pre-convert edge strokes and converted Line/PolyEdge/Arc anchors moved by the connector,
    // not by applyAndDraw above. Rigidly-moved raw strokes ride along in this method's own
    // `translate` history entry (a uniform matrix is safe to undo by re-applying its inverse);
    // everything else (gradient-moved raw strokes, converted edges recomputed from the target's
    // new bounds) needs its own pre-mutation snapshot instead — see `updated` below.
    const {
      rigidStrokeIds,
      oldSymbols: anchoredOldSymbols,
      newSymbols: anchoredNewSymbols,
    } = this.canvas.connector.updateAnchoredEdges(
      symbols.map((s) => s.id),
      matrix,
      preTransformBoundsById
    )
    if (addToHistory) {
      const historySymbols = this.model.symbolsSelected
      const changes: TIIHistoryChanges = {
        translate: [
          {
            symbols: [...historySymbols, ...this.resolveFollowedSymbols(rigidStrokeIds, historySymbols)],
            tx,
            ty,
          },
        ],
      }
      if (anchoredNewSymbols.length) {
        changes.updated = { oldSymbols: anchoredOldSymbols, newSymbols: anchoredNewSymbols }
      }
      this.canvas.history.push(changes)
    }
    const strokes = this.canvas.extractStrokesFromSymbols(symbols)
    return Promise.all([
      this.canvas.client.transformTranslate([...new Set([...strokes.map((s) => s.id), ...rigidStrokeIds])], tx, ty),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ]).then(() => undefined)
  }

  translateElement(id: string, tx: number, ty: number): void {
    this.logger.info("translateElement", {
      id,
      tx,
      ty,
    })
    this.canvas.renderer.setAttribute(id, "transform", `translate(${tx},${ty})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { origin })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Translating")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.transformOrigin = origin
  }

  continue(point: TPoint): {
    tx: number
    ty: number
  } {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.canvas.snaps.snapTranslate(tx, ty)
    tx = nudge.x
    ty = nudge.y

    this.translateElement(this.interactElementsGroup.id as string, tx, ty)
    this.model.symbolsSelected.forEach((s) => {
      this.translateElement(s.id as string, tx, ty)
    })
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.translateElement(id, tx, ty)
    })
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.canvas.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return { tx, ty }
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Translating")
    const { tx, ty } = this.continue(point)
    this.canvas.snaps.clearSnapToElementLines()
    await this.translate(this.model.symbolsSelected, tx, ty)
    this.finalizeTransform()
  }
}
