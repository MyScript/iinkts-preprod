import type { MatrixTransform, TPoint } from "@/core/geometry"
import type { TMath } from "@/symbol/math/Math"
import type { TText } from "@/symbol/text/Text"

/**
 * The measuring service text and math need once they have moved.
 *
 * A port rather than a direct dependency: a symbol util must not reach for the canvas, and
 * `IITypesetManager` satisfies this structurally. It has to be a service at all because the work is
 * genuinely not geometry — measuring a typeset symbol means drawing it into the DOM hidden and
 * reading `getBBox()`, so it needs a live renderer and the browser's layout engine.
 *
 * `setBounds` and not `updateBounds`, which measures *and* commits. Committing from here was
 * IIC-1999: `SymbolStore.update` deep-freezes what it stores, so the draft came back frozen and the
 * transform manager's own `commitSymbol` then threw stamping `modificationDate` on it. A util
 * transforms a draft; committing it is the caller's business, and the caller already does it.
 */
export type TTypesetPort = {
  setBounds(symbol: TText | TMath): void
}

/**
 * What moving a symbol needs beyond the symbol itself.
 *
 * Deliberately not one context carrying the operation: a `switch (context.operation)` inside the
 * util would be the same dispatch this epic exists to delete, one layer down. Each operation gets
 * its own method and its own context, naming exactly what that operation needs.
 */
export type TTranslateContext = {
  matrix: MatrixTransform
  /** Only text and math consult it. */
  typeset: TTypesetPort
}

/**
 * What rotating a symbol needs beyond the symbol itself.
 *
 * `center` is the point the gesture turns around, computed once from the selection's bounding box.
 * The geometric kinds never read it — it is already folded into the matrix — but text and math
 * store it, because a typeset symbol is rotated by a CSS transform rather than by moving its glyphs.
 */
export type TRotateContext = {
  matrix: MatrixTransform
  center: TPoint
}

/**
 * What resizing a symbol needs beyond the symbol itself.
 *
 * `origin` is the fixed point of the scale — the corner or edge opposite the handle being dragged.
 * The ellipse and the arc need it because they scale their centre about it by hand; the kinds that
 * simply push their points through the matrix do not, since it is already folded in.
 *
 * No `typeset` port, unlike {@link TTranslateContext} and {@link TRotateContext}: resizing a
 * typeset symbol rebuilds its bounds arithmetically from the scale factors rather than re-measuring
 * it in the DOM. That asymmetry is inherited from `IIResizeManager` and preserved.
 */
export type TResizeContext = {
  matrix: MatrixTransform
  origin: TPoint
}
