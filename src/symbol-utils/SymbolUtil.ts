import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { TBaseSymbol, TResizePoint } from "@/symbol/Symbol"
/**
 * @group SymbolUtils
 * @summary Plugin interface for registering symbol behaviour.
 *
 * Implement this class to add a new symbol type that participates in the
 * standard dispatch for factory, derived-field updates, overlap detection,
 * snap-point extraction, and capability flags.
 *
 * Register with `symbolRegistry.register(new MyUtil())`.
 *
 * @example
 * class StickyNoteUtil extends SymbolUtil<TStickyNote> {
 *   readonly type = "sticky-note"
 *   create(partial) { ... }
 *   updateDerivedFields(s) { ... }
 *   overlaps(s, box) { ... }
 *   getSVGElement(s) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
export abstract class SymbolUtil<T extends TBaseSymbol> {
  abstract readonly type: string

  abstract create(params: TPartialDeep<T>): T

  abstract updateDerivedFields(symbol: T): void

  abstract overlaps(symbol: T, box: TBox): boolean

  getSnapPoints(_symbol: T): TPoint[] {
    return []
  }

  /**
   * Handles for dragging one vertex of this symbol. Empty by default: most symbols resize by their
   * bounding box alone, and only the edge kinds offer per-vertex handles today.
   */
  getResizePoints(_symbol: T): TResizePoint[] {
    return []
  }

  canSelect(_symbol: T): boolean {
    return true
  }

  canTransform(_symbol: T): boolean {
    return true
  }

  canResize(_symbol: T): boolean {
    return true
  }

  canRotate(_symbol: T): boolean {
    return true
  }

  /**
   * The element that draws this symbol.
   *
   * Required rather than optional: a symbol nothing can draw is a symbol the canvas cannot show,
   * and when this was optional a custom util that omitted it registered successfully and then
   * silently rendered nothing. Return `undefined` only for a state deliberately left undrawn — the
   * decorator does that for a kind it does not own.
   *
   * Honoured by the SVG renderer, which `InteractiveInkCanvas`, `InkCanvas` and
   * `InteractiveInkSSRCanvas` all use. **`InkCanvasDeprecated` (INK_V1) ignores it**: it draws
   * through `CanvasRenderer`, which dispatches on `isStroke` and two fixed renderer tables instead
   * of asking the registry, so a registered custom symbol is invisible there and logs
   * "symbol type unknown". That variant is deprecated and not worth wiring up.
   */
  abstract getSVGElement(symbol: T): SVGGraphicsElement | undefined
}
