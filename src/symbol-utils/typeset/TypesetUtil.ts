import { applyMatrixToPoint, applyMatrixToPoints, MatrixTransform } from "@/core/geometry"
import { convertRadianToDegree } from "@/core/math"
import type { TMath } from "@/symbol/math/Math"
import type { TText } from "@/symbol/text/Text"

import { SymbolUtil } from "../SymbolUtil"
import type { TResizeContext, TRotateContext, TTranslateContext } from "../TransformContext"

/**
 * @group SymbolUtils
 * @summary What text and math share, which is nearly everything.
 *
 * `TText` and `TMath` are the same shape but for the list they hold — `chars` against `elements` —
 * so the two utils were the same code twice over. Worse, the resize path was literally one method
 * on `IIResizeManager` that branched on `isText(symbol)` twice, once to reach the right list and
 * once to reach the right derive.
 *
 * A typeset symbol differs from a geometric one in two ways, and both live here:
 *
 * - it is **turned by recording an angle**, not by moving anything. The renderer applies it as an
 *   SVG rotation, so `rotate` writes `rotation` and touches no coordinate.
 * - it is **measured, not computed**: its bounds come from drawing it into the DOM hidden and
 *   reading `getBBox()`. That is why `translate` and `rotate` are handed a typeset port. `resize` is
 *   the exception — it rebuilds bounds from the scale factors instead, which is why it needs no
 *   port.
 */
export abstract class TypesetUtil<T extends TText | TMath> extends SymbolUtil<T> {
  // The parameter is deliberately not widened to a structural "has a point and bounds" shape. It
  // could be, but the port that measures these symbols cannot: `IITypesetManager.updateBounds`
  // handles text and math and nothing else, so a third subclass would compile and then fail at the
  // one call it cannot avoid.

  /**
   * The glyphs whose size follows a resize — a text's characters, a math's elements.
   *
   * The one thing the two types genuinely do not share, so it is the one thing they have to say.
   */
  protected abstract glyphsOf(symbol: T): { fontSize: number }[]

  /** The factor a typeset symbol scales its glyphs by: the mean of the two axes. */
  protected static fontScale(matrix: MatrixTransform): number {
    return (matrix.xx + matrix.yy) / 2
  }

  /**
   * Moves everything a typeset symbol stores as a position: its anchor point, and the centre it
   * recorded if it has already been turned.
   */
  protected moveAnchor(symbol: T, matrix: MatrixTransform): void {
    if (symbol.rotation) {
      symbol.rotation.center = applyMatrixToPoint(symbol.rotation.center, matrix)
    }
    applyMatrixToPoints([symbol.point], matrix)
  }

  /**
   * Records the turn. Accumulates, so a second rotation adds to the first.
   *
   * Nothing is re-measured. A typeset symbol's `bounds` is the box of its *unrotated* glyphs —
   * `setBounds` reads `getBBox()` from the `<text>` inside the rotated group, so the measurement
   * cannot depend on the angle — and turning a symbol does not change its glyphs. Only the angle
   * and the fields derived from it move.
   *
   * `TextUtil` used to override this to re-measure and `MathUtil` did not, an asymmetry inherited
   * from `IIRotationManager`. It was not a decision: the text call was doing nothing but set
   * `bounds.angle`, which is done here for both types now, and math was left never updating its
   * derived fields at all — so a rotated math block could not be selected by surrounding it.
   */
  rotate(symbol: T, { matrix, center }: TRotateContext): void {
    symbol.rotation = {
      degree: convertRadianToDegree(MatrixTransform.rotation(matrix)) + (symbol.rotation?.degree || 0),
      center,
    }
    // Kept in step with `rotation`, on purpose. `bounds.angle` is what makes `OBBOps.toBox` report
    // the area the symbol covers on screen, and half a dozen callers depend on that for hit boxes,
    // decorator bounds and annotation extents. The box the rotation is *applied to* comes from
    // `OBBOps.toUnrotatedBox` instead, which is what keeps the angle from counting twice.
    symbol.bounds.angle = symbol.rotation.degree
    this.updateDerivedFields(symbol)
  }

  /**
   * Scales the anchor, the bounds and the glyph sizes.
   *
   * Shared whole: the derive at the end is {@link SymbolUtil.updateDerivedFields}, which each type
   * already implements, and the glyph list comes from {@link glyphsOf}. Nothing else about resizing
   * a typeset symbol differs between the two.
   */
  resize(symbol: T, { matrix }: TResizeContext): void {
    applyMatrixToPoints([symbol.point], matrix)
    symbol.bounds = {
      center: applyMatrixToPoint(symbol.bounds.center, matrix),
      width: +(symbol.bounds.width * Math.abs(matrix.xx)).toFixed(3),
      height: +(symbol.bounds.height * Math.abs(matrix.yy)).toFixed(3),
      angle: 0,
    }
    const scale = TypesetUtil.fontScale(matrix)
    this.glyphsOf(symbol).forEach((glyph) => (glyph.fontSize = +(glyph.fontSize * scale).toFixed(3)))
    this.updateDerivedFields(symbol)
  }

  /**
   * Always. A typeset symbol is drawn from glyphs at a font size, and a font size is one number —
   * scaling the axes unequally would ask for glyphs that do not exist.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return true
  }

  abstract translate(symbol: T, context: TTranslateContext): void
}
