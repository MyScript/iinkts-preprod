import { OBBOps, Polygon2d, type TBox, type TPoint } from "@/core/geometry"
import type { TMath } from "@/symbol/typeset/Math"
import type { TText } from "@/symbol/typeset/Text"
import { computeTypesetSnapPoints, computeTypesetVertices } from "@/symbol/typeset/Typeset"

import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"

/**
 * @group SymbolUtils
 * @summary What text and math share, which is nearly everything.
 *
 * `TText` and `TMath` are the same shape but for the list they hold — `chars` against `elements` —
 * so the two utils were the same code twice over. Worse, the resize path was literally one method
 * on `IIResizeManager` that branched on `isText(symbol)` twice, once to reach the right list and
 * once to reach the right derive.
 *
 * A typeset symbol used to differ from a geometric one in how it turns and resizes: it recorded an
 * angle instead of moving a coordinate, and rebuilt its bounds from scale factors instead of
 * rescaling anything by hand. Both of those were per-type code, and both are gone — `translate`,
 * `rotate` and `resize` are `SymbolUtil`'s now, composing the matrix like every other type. What is
 * left here is the one thing that is still genuinely different: a typeset symbol is **measured, not
 * computed** — its bounds come from drawing it into the DOM hidden and reading `getBBox()`, always
 * unrotated and unscaled, because turning and scaling are the matrix's job from here on.
 */
export abstract class TypesetUtil<T extends TText | TMath> extends SymbolUtil<T> {
  // The parameter is deliberately not widened to a structural "has a point and bounds" shape. It
  // could be, but the port that measures these symbols cannot: `IITypesetManager.updateBounds`
  // handles text and math and nothing else, so a third subclass would compile and then fail at the
  // one call it cannot avoid.

  /**
   * Shared whole: `TText` and `TMath` derive identically, down to the formula. `symbol.bounds` is
   * always the raw, unrotated box a typeset symbol was measured at — the matrix, not a stored angle,
   * is what turns it, and `SymbolGeometry` applies that matrix on top of this raw geometry.
   */
  /**
   * The box the symbol was measured at, as a shape.
   *
   * An outline rather than a filled one, and that is the behaviour it had: `typesetOverlapsBox` asked
   * "a corner inside the query, or a side crossing one of its sides", both about the boundary. A
   * query landing wholly inside a word therefore did not select it, and still does not.
   *
   * `symbol.bounds` is the raw box, always measured unrotated and unscaled — turning and scaling are
   * the matrix's job — so its corners are the shape, and a frame angle would have nothing to carry.
   */
  getGeometry(symbol: T): Polygon2d {
    return new Polygon2d(computeTypesetVertices(OBBOps.toUnrotatedBox(symbol.bounds)))
  }

  /**
   * Where a typeset symbol offers to snap, before its matrix: the corners of its box lifted onto the
   * baseline, and its centre. Not the box's own corners — a word is read from its baseline, and
   * lining two words up by their descenders would look wrong.
   */
  protected rawSnapPoints(symbol: T): TPoint[] {
    return computeTypesetSnapPoints(OBBOps.toUnrotatedBox(symbol.bounds), symbol.point)
  }

  /** Shared by text and math, which had the same one line each. */
  overlaps(symbol: T, box: TBox): boolean {
    return SymbolGeometry.of(symbol).overlapsBox(box)
  }

  /** Shared by text and math, which had the same one line each. */
  getSnapPoints(symbol: T): TPoint[] {
    return this.mapPointsForward(symbol, this.rawSnapPoints(symbol))
  }

  /**
   * Always. A typeset symbol is drawn from glyphs at a font size, and a font size is one number —
   * scaling the axes unequally would ask for glyphs that do not exist.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return true
  }
}
