import type { TBox } from "@/core/geometry"
import type { TMatrixTransform, TPoint } from "@/core/geometry"
import { applyMatrixToPoint, BoxOps, isIdentityMatrix, MatrixTransform, OBBOps } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { TBaseSymbol, TResizePoint } from "@/symbol/Symbol"

import type { TResizeContext, TRotateContext, TTranslateContext } from "./TransformContext"
import type { TSymbolGeometry } from "./TSymbolGeometry"

/**
 * Below this, a matrix's determinant is treated as zero rather than divided by.
 *
 * `MatrixTransform.invert()` divides by the determinant unconditionally — for a symbol scaled to
 * (near) nothing, that produces `Infinity`/`NaN` coordinates rather than throwing. `1e-9` is well
 * under any determinant a real translate/rotate/uniform-resize produces (those stay near 1 in
 * magnitude), so this only catches a genuinely degenerate matrix, not an aggressively shrunk one.
 */
const MIN_DETERMINANT = 1e-9

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
 *   translate(s, { matrix }) { ... }
 *   rotate(s, { matrix }) { ... }
 *   resize(s, { matrix }) { ... }
 *   getSVGElement(s) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
export abstract class SymbolUtil<T extends TBaseSymbol> {
  abstract readonly type: string

  abstract create(params: TPartialDeep<T>): T

  abstract updateDerivedFields(symbol: T): void

  /**
   * This symbol's derived geometry, computed from the coordinates it stores.
   *
   * Same values `updateDerivedFields` writes onto the symbol, returned instead of assigned. The two
   * coexist only for the length of this epic: `updateDerivedFields` goes away once every reader has
   * moved to `SymbolGeometry`.
   */
  abstract computeGeometry(symbol: T): TSymbolGeometry

  abstract overlaps(symbol: T, box: TBox): boolean

  /**
   * What every concrete `overlaps` override now does: map `box` — given in the document's frame —
   * through the inverse of `symbol.transform`, then test it against `symbol`'s raw geometry with
   * `rawOverlaps`, the type's own untouched test.
   *
   * The query is mapped rather than the symbol's geometry: `box` is always 4 corners, so mapping it
   * is O(1) however many points `symbol` carries, where mapping every vertex, edge and pointer of a
   * stroke or a polygon forward would not be. One implementation here replaces what would otherwise
   * be the same inverse-and-dispatch logic written six times over, once per concrete `overlaps`.
   *
   * Two things a `TBox` cannot express, handled deliberately rather than approximated:
   * - **A non-invertible matrix** (a symbol scaled to exactly nothing on some axis, or whose
   *   determinant came out `NaN`). `MatrixTransform.invert()` divides by the determinant
   *   unconditionally, so a caller that did not guard first would get `Infinity`/`NaN` coordinates
   *   instead of a thrown error — and `pointInConvexPolygon` treats `NaN` corners as "contains
   *   everything" (every comparison against `NaN` is `false`, so the sign check that would normally
   *   reject a point never fires), the opposite of safe. A symbol with no extent along an axis has no
   *   area for any query to land in, so this returns `false` — deliberately, not as a fallback nobody
   *   chose. The determinant is scale-dependent, not a fixed "stays near 1": for a similarity
   *   transform (rotate plus a *uniform* scale s) it is s², but a non-uniform resize's determinant is
   *   the product of two independent scale factors and can land anywhere.
   * - **A rotated or sheared query.** The image of an axis-aligned box under the inverse is only
   *   itself axis-aligned when `symbol.transform` has no rotation (translate and axis-aligned resize
   *   both qualify). Once it does — a rotation alone gives a rotated rectangle; a rotation composed
   *   with a non-uniform resize gives a genuine parallelogram — a `TBox` cannot hold the result, and
   *   neither can a `TOBB` in the sheared case (it assumes right angles). Widening it to its bounding
   *   rectangle would select symbols the query never touched, so instead the mapped corners are kept
   *   as a quad and tested with `OBBOps.polygonOverlapsQuad` against `symbol`'s own raw `vertices`
   *   and `edges` — not the axis-aligned `bounds`: for anything but a plain rectangle, `bounds`'
   *   corners reach further out on the diagonal than the shape itself (a circle of radius r has
   *   corners at r·√2), and once `query` is rotated relative to the raw frame that overshoot can make
   *   a query that genuinely surrounds the shape miss containment entirely — a real regression this
   *   fixes, not a hypothetical.
   *
   *   Exact for the straight-edged types (`ShapePolygonOps`, `EdgeLineOps`, `EdgePolyLineOps`) and for
   *   the two that were already a bounds/edges test at rest, whose own vertices simply are their
   *   bounds' corners (`TextOps`/`MathOps`, via `typesetOverlapsBox`) — modulo one gap
   *   `polygonOverlapsBox` never covered either, rotated or not: `query` sitting entirely inside the
   *   shape without crossing its boundary. An accepted, quantifiable approximation for the two curved
   *   shape kinds (`ShapeEllipseOps`, `EdgeArcOps`) and, once rotated, `ShapeCircleOps` too (exact at
   *   rest: radius and segment intersection): their `vertices` tessellate the true curve
   *   (`computeTessellationCount`, spaced by `SELECTION_MARGIN`) with straight chords, each a secant
   *   of the curve, so the tessellated polygon sits entirely inside the true shape by at most that
   *   chord's sagitta, `s ≈ c²/(8·r)` for a chord of length `c` on a curve of local radius `r`. `c` is
   *   `SELECTION_MARGIN` (10) for a curve large enough that `computeTessellationCount` isn't floored
   *   at its 8-point minimum, and `perimeter / 8` (smaller) below that — for a radius-5 circle,
   *   `c ≈ 31.4 / 8 ≈ 3.9`, giving `s ≈ 3.9² / (8·5) ≈ 0.4px`, the same order of magnitude as the
   *   ~0.6px measured directly against the real tessellation in review (this formula is a derived
   *   approximation, not a re-measurement, and degrades as `c` approaches `r`).
   *
   *   `rawOverlapsQuad`, when a concrete override supplies it, replaces this generic fallback
   *   outright with the type's own exact rotated-query test —
   *   `StrokeUtil` is the one built-in user: a stroke's real test is "any raw pointer inside the
   *   query", and the generic edges-crossing fallback would over-approximate it (a query side can
   *   cross the segment *between* two consecutive pointers with no pointer itself inside the query —
   *   a true overlap for a polygon, not for a stroke, whose own "overlaps" was never about the drawn
   *   line crossing a box). `DecoratorOps.overlaps` also falls back to the generic test, in principle
   *   no more exact than Ellipse/Arc's — unreachable in practice, since `DecoratorUtil.applyTransform`
   *   is a no-op and a decorator's transform never becomes non-identity through the product this
   *   dispatches from.
   */
  protected overlapsQuery(
    symbol: T,
    box: TBox,
    rawOverlaps: (box: TBox) => boolean,
    rawOverlapsQuad?: (query: TPoint[]) => boolean
  ): boolean {
    // A symbol arriving as data of a kind this util's table does not own (an unrecognized shape or
    // edge kind, tolerated the same way `computeGeometry`'s fallback is) may never have gone through
    // `createFromPartial` — `mergeSymbolTransform` is what normally backfills a missing `transform`
    // on the wire, and a raw/malformed object can reach here without it. Treated as identity rather
    // than left to crash `isIdentityMatrix` on `undefined`: an untransformed guess is what the rest
    // of this method already assumes for every ordinary symbol.
    const transform = symbol.transform ?? MatrixTransform.identity()
    if (isIdentityMatrix(transform)) {
      return rawOverlaps(box)
    }
    const determinant = transform.xx * transform.yy - transform.yx * transform.xy
    if (!Number.isFinite(determinant) || Math.abs(determinant) < MIN_DETERMINANT) {
      return false
    }
    const inverse = new MatrixTransform(
      transform.xx,
      transform.yx,
      transform.xy,
      transform.yy,
      transform.tx,
      transform.ty
    ).invert()
    const corners = BoxOps.getCorners(box).map((corner) => MatrixTransform.applyToPoint(inverse, corner))
    if (transform.yx === 0 && transform.xy === 0) {
      // Pure translate/scale: the inverse is diagonal too, so the mapped corners are still an
      // axis-aligned box, exactly — no widening, no loss.
      return rawOverlaps(BoxOps.createFromPoints(corners))
    }
    if (rawOverlapsQuad) {
      return rawOverlapsQuad(corners)
    }
    const { vertices, edges } = this.computeGeometry(symbol)
    return OBBOps.polygonOverlapsQuad(vertices, edges, corners)
  }

  /**
   * `points`, carried through `symbol.transform` the same way a transform manager moves the symbol
   * itself — used by `getSnapPoints`/`getResizePoints` overrides, which compute in the symbol's raw
   * frame and hand the result through this once, forward, rather than every symbol type mapping its
   * own points individually.
   *
   * Forward, not inverse: unlike {@link overlapsQuery}, there is no query to map back — `points` are
   * already the symbol's own geometry, and mapping a point through a matrix is always exact, however
   * that matrix turns or scales.
   */
  protected mapPointsForward(symbol: T, points: TPoint[]): TPoint[] {
    const transform = symbol.transform ?? MatrixTransform.identity()
    return isIdentityMatrix(transform) ? points : points.map((point) => applyMatrixToPoint(point, transform))
  }

  /**
   * Moves, turns or scales this symbol by composing the matrix onto the one it already carries.
   *
   * One implementation for every type, where there used to be one per type per operation. A
   * symbol's coordinates are not touched: the matrix is the whole of what a transform changes, so
   * there is no per-type geometry to update and nothing derived left to refresh.
   *
   * Override only for a type whose transform is not affine — `DecoratorUtil` overrides it to a
   * no-op because a decorator follows its targets rather than moving on its own.
   */
  applyTransform(symbol: T, matrix: TMatrixTransform): void {
    symbol.transform = new MatrixTransform(matrix.xx, matrix.yx, matrix.xy, matrix.yy, matrix.tx, matrix.ty).multiply(
      symbol.transform
    )
  }

  /**
   * Moves this symbol by a matrix, leaving it derived-consistent.
   *
   * Concrete rather than abstract: every built-in type composes the matrix the same way, through
   * {@link applyTransform}. `center` and `origin` on the other two contexts, and `typeset` on this
   * one, are unused here — they remain part of the public contract because the three transform
   * managers still pass them, and trimming the contract itself is a later task.
   */
  translate(symbol: T, { matrix }: TTranslateContext): void {
    this.applyTransform(symbol, matrix)
  }

  /**
   * Turns this symbol, leaving it derived-consistent. Composes through {@link applyTransform}, for
   * the same reason {@link translate} does.
   */
  rotate(symbol: T, { matrix }: TRotateContext): void {
    this.applyTransform(symbol, matrix)
  }

  /**
   * Scales this symbol, leaving it derived-consistent. Composes through {@link applyTransform}, for
   * the same reason {@link translate} does.
   */
  resize(symbol: T, { matrix }: TResizeContext): void {
    this.applyTransform(symbol, matrix)
  }

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
   * Whether a resize of this symbol must preserve its aspect ratio.
   *
   * False by default. `IIResizeManager` decided this with
   * `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`, which is a question about a
   * symbol asked from outside it — so a custom symbol could never require a locked ratio, however
   * badly a free scale would distort it.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return false
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
