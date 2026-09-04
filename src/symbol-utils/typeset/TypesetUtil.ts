import { applyMatrixToPoint, applyMatrixToPoints, type MatrixTransform } from "@/core/geometry"
import type { TMath } from "@/symbol/math/Math"
import type { TText } from "@/symbol/text/Text"

/**
 * The part of resizing a typeset symbol that text and math share: the anchor point moves through
 * the matrix, and the bounds are rebuilt from the scale factors.
 *
 * Rebuilt, not re-measured — which is why resizing needs no typeset port where translating and
 * rotating do. That asymmetry is inherited from `IIResizeManager.applyOnTypeset`.
 *
 * That method held this for both types and branched on `isText(symbol)` twice, once to reach the
 * right font list and once to reach the right derive. Splitting it across the two utils is what
 * removes both type tests.
 */
export function scaleTypesetGeometry(symbol: TText | TMath, matrix: MatrixTransform): void {
  applyMatrixToPoints([symbol.point], matrix)
  symbol.bounds = {
    center: applyMatrixToPoint(symbol.bounds.center, matrix),
    width: +(symbol.bounds.width * Math.abs(matrix.xx)).toFixed(3),
    height: +(symbol.bounds.height * Math.abs(matrix.yy)).toFixed(3),
    angle: 0,
  }
}

/** The factor a typeset symbol scales its font sizes by: the mean of the two axes. */
export function typesetFontScale(matrix: MatrixTransform): number {
  return (matrix.xx + matrix.yy) / 2
}
