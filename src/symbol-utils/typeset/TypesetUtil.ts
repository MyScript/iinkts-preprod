import { OBBOps } from "@/core/geometry"
import type { TMath } from "@/symbol/typeset/Math"
import type { TText } from "@/symbol/typeset/Text"
import { computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/symbol/typeset/Typeset"

import { SymbolUtil } from "../SymbolUtil"
import type { TSymbolGeometry } from "../TSymbolGeometry"

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
  computeGeometry(symbol: T): TSymbolGeometry {
    const boundsBox = OBBOps.toUnrotatedBox(symbol.bounds)
    const vertices = computeTypesetVertices(boundsBox)
    return {
      bounds: symbol.bounds,
      vertices,
      snapPoints: computeTypesetSnapPoints(boundsBox, symbol.point),
      edges: computeClosedEdges(vertices),
      length: 0,
    }
  }

  /**
   * Always. A typeset symbol is drawn from glyphs at a font size, and a font size is one number —
   * scaling the axes unequally would ask for glyphs that do not exist.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return true
  }
}
