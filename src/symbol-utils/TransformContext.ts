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
 */
export type TTypesetPort = {
  updateBounds<S extends TText | TMath>(symbol: S): S
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
  /** Text consults it; math deliberately does not. See `MathUtil.rotate`. */
  typeset: TTypesetPort
}
