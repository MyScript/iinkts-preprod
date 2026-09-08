import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { SvgElementRole } from "@/Constants"
import type { MatrixTransform } from "@/core/geometry"
import { applyMatrixToPoint, OBBOps } from "@/core/geometry"
import { LoggerCategory } from "@/logger"
import type { TStroke, TSymbol } from "@/symbol"
import { isDecorator, isStroke } from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import { SymbolGeometry } from "@/symbol-utils/SymbolGeometry"

import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
export abstract class IIAbstractTransformManager extends IIAbstractManager {
  interactElementsGroup?: SVGElement

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.TRANSFORMER)
  }

  /**
   * The gesture's matrix, previewed on top of the one the symbol already carries.
   *
   * The live part multiplies onto the stored one rather than replacing it, so the SVG transform list
   * reads outside-in: the symbol sits where its own matrix puts it, and the gesture moves it from
   * there — the same order the commit will apply. Writing the live transform alone is what made an
   * already-moved symbol snap back to its raw coordinates for the length of a drag and jump into
   * place on release (IIC-1999). Before this epic only a rotated typeset carried a baked transform;
   * now every moved symbol does, so the same overwrite would affect all of them.
   *
   * The stored matrix is untouched here. This is a preview: `applyAndDraw` is what settles it.
   */
  protected previewTransform(symbol: TSymbol, live: MatrixTransform): void {
    this.canvas.renderer.setAttribute(symbol.id, "transform", live.clone().multiply(symbol.transform).toCssString())
  }

  /**
   * The same, for an element with no symbol behind it — the interact-elements group, or a math
   * ghost stroke. Nothing is composed because nothing is stored: these are drawn in document
   * coordinates already.
   *
   * Note both preview methods write a full `matrix(...)`, carrying their own centre. The
   * `transform-origin` attribute this class used to set cannot serve here: it applies to the whole
   * transform list, so it would displace the stored matrix, which brings its own centre.
   */
  protected previewElementTransform(id: string, live: MatrixTransform): void {
    this.canvas.renderer.setAttribute(id, "transform", live.toCssString())
  }

  protected resolveInteractGroup(target: Element): SVGGElement {
    return target.closest(`[role=${SvgElementRole.InteractElementsGroup}]`) as unknown as SVGGElement
  }

  /**
   * Applies a matrix transform locally (model + redraw) without touching the backend or
   * history. Used by InteractiveInkCanvas's undo/redo replay dispatcher, which sends its own
   * consolidated backend message separately.
   */
  applyMatrix(symbols: TSymbol[], matrix: MatrixTransform): void {
    this.applyAndDraw(symbols, matrix)
  }

  protected applyAndDraw(symbols: TSymbol[], matrix: MatrixTransform): void {
    symbols.forEach((s) => {
      // No fallback on the passed symbol: since IIC-1972 the history stack holds values rather than
      // references into the document, so a symbol the document no longer holds is one there is
      // nothing to transform. The old path mutated the detached object and drew it anyway, painting
      // something the model had already forgotten.
      const target = this.model.draftSymbol(s.id)
      if (!target) {
        return
      }
      this.applyToSymbol(target, matrix)
      this.model.commitSymbol(target)
      // Committing rewrites only the `transform` attribute instead of rebuilding the element: the
      // element's geometry is the symbol's raw coordinates, which a transform never changes. The
      // renderer must see the frozen, committed record here (not `target`, the now-stale draft) so
      // that `SymbolGeometry`'s frozen-only cache actually holds for it.
      this.canvas.renderer.setSymbolTransform(this.model.getRootSymbol(target.id) ?? target)
    })
    this.updateDecoratorsForTargets(symbols, matrix)
  }

  /**
   * Standalone decorators store their own bounds (set once from their targets' bounds)
   * and are never part of `symbolsSelected` (selection redirects to their targetIds), so
   * a translate/resize/rotate of the target symbols leaves the decorator's bounds stale.
   * Recompute them here from the (already transformed) target symbols.
   */
  private updateDecoratorsForTargets(symbols: TSymbol[], matrix: MatrixTransform): void {
    const byTargetId = this.model.decoratorsByTargetId
    const affected = new Map<string, TSymbol>()
    symbols.forEach((s) => byTargetId.get(s.id)?.forEach((deco) => affected.set(deco.id, deco)))

    affected.forEach((deco) => {
      const draft = this.model.draftSymbol(deco.id)
      if (!draft || !isDecorator(draft)) {
        return
      }
      const targetSyms = draft.targetIds.map((id) => this.model.getRootSymbol(id)).filter((s): s is TSymbol => !!s)
      if (!targetSyms.length) {
        return
      }
      // Re-derived from the moved targets, not carried by a matrix: `DecoratorUtil.applyTransform`
      // is deliberately a no-op, so a decorator never receives one. Its box is an input, and this
      // is the writer that keeps it in step with the symbols it decorates.
      DecoratorOps.setTargetBounds(draft, OBBOps.createFromOBBs(targetSyms.map((s) => SymbolGeometry.boundsOf(s))))
      // baseline is an absolute y-coordinate (used by Underline/Strikethrough rendering
      // in place of bounds), so it must follow the same transform as the target symbols.
      if (draft.baseline !== undefined) {
        draft.baseline = applyMatrixToPoint({ x: 0, y: draft.baseline }, matrix).y
      }
      this.model.commitSymbol(draft)
      this.canvas.renderer.drawSymbol(draft)
    })
  }

  /**
   * Live model symbols for the pre-convert edge strokes that rigidly follow a transform
   * (see IIConnectorManager), minus any already present in `alreadyIncluded`.
   * They are transformed outside `applyAndDraw`, so history entries and backend transform
   * messages must list them explicitly or undo and the server's ink both drift out of sync.
   */
  protected resolveFollowedSymbols(followedIds: string[], alreadyIncluded: TSymbol[]): TSymbol[] {
    if (followedIds.length === 0) {
      return []
    }
    const knownIds = new Set(alreadyIncluded.map((s) => s.id))
    return followedIds
      .filter((id) => !knownIds.has(id))
      .map((id) => this.model.getRootSymbol(id))
      .filter((s): s is TSymbol => !!s)
  }

  protected finalizeTransform(): void {
    this.interactElementsGroup = undefined
    this.canvas.overlays.apply()
    this.canvas.selector.drawSelectedGroup(this.canvas.model.symbolsSelected)
  }

  private getSelectedMathBlockIds(symbols: TSymbol[]): Set<string> {
    const ids = new Set<string>()
    symbols.forEach((s) => {
      if (isStroke(s) && s.jiixBlockType === "Math" && s.jiixBlockId) {
        ids.add(s.jiixBlockId)
      }
    })
    return ids
  }

  /**
   * Element ids of the ghost previews attached to the given selection's math blocks —
   * for live CSS-transform following while a translate/resize/rotate drag is in progress.
   */
  protected getGhostStrokeIdsForSelectedMath(symbols: TSymbol[]): string[] {
    const ids: string[] = []
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      ids.push(...(this.canvas.math.getGhostStrokeIds(id) ?? []))
    })
    return ids
  }

  /**
   * Permanently applies the given transform matrix to the ghost previews attached to the
   * selection's math blocks, so they stay visually attached once the drag settles.
   */
  protected applyTransformToGhostStrokesForSelectedMath(symbols: TSymbol[], matrix: MatrixTransform): void {
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      this.canvas.math.applyTransformToGhostStrokes(id, matrix)
    })
  }

  /**
   * Gradient-followed strokes were reshaped non-uniformly by the connector — their points did not
   * all move by the same delta — so the backend cannot be asked to apply this transform to them.
   * Their full new content has to be sent instead. Returns one `replaceStrokes` call per such
   * stroke, to be spread into the transform's own `Promise.all`.
   */
  protected replaceGradientFollowedStrokes(
    anchoredOldSymbols: TSymbol[],
    anchoredNewSymbols: TSymbol[]
  ): Promise<void>[] {
    return anchoredNewSymbols
      .map((newSymbol, i) => ({ oldSymbol: anchoredOldSymbols[i], newSymbol }))
      .filter((pair): pair is { oldSymbol: TStroke; newSymbol: TStroke } => isStroke(pair.newSymbol))
      .map(({ oldSymbol, newSymbol }) => this.canvas.client.replaceStrokes([oldSymbol.id], [newSymbol]))
  }

  /**
   * Applies this manager's own operation to a symbol, through the symbol's util.
   *
   * One member instead of the five per-type ones this class used to declare. Those existed to be
   * reached by a `switch (symbol.type)` here, which is what made a symbol type the library did not
   * know untransformable: it fell to a throwing `default` however well its util was registered.
   */
  protected abstract applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void

  applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol {
    this.logger.info("applyToSymbol", { symbol })
    // No branch on type, and no early return for decorators — `DecoratorUtil` implements all three
    // operations as deliberate no-ops, which is where that exception now reads. An unregistered
    // type still fails, from `getUtilFor`, with a message that also lists what *is* registered.
    this.applyThroughUtil(symbol, matrix)
    return symbol
  }
}
