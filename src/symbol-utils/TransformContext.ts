import type { MatrixTransform } from "@/core/geometry"
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
