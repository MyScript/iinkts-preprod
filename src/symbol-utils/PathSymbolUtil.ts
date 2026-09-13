import type { TBaseSymbol } from "@/symbol/Symbol"

import { SVGBuilder } from "./SVGBuilder"
import { SymbolUtil } from "./SymbolUtil"

/**
 * @group SymbolUtils
 * @summary A symbol drawn as one path inside a group.
 *
 * The shape of nearly everything the library renders — a stroke, a geometric shape, an edge, a
 * decorator. Each one built the same group, appended one `<path>` to it and returned it, which is
 * four copies of an assembly that differs only in what goes on the path.
 *
 * A type in this family says what its path is worth drawing — its `d`, and the fill, stroke and
 * width around it — and inherits the rest. What it no longer writes: the group, its attributes, the
 * matrix, and the order the two are put together in.
 */
export abstract class PathSymbolUtil<T extends TBaseSymbol> extends SymbolUtil<T> {
  /**
   * The `d` of the path this symbol draws.
   *
   * Separate from {@link PathSymbolUtil.getPathAttributes} because it is the one part no default can
   * supply and the one part a new type always has to write: `d` *is* the shape as drawn.
   */
  protected abstract getPathData(symbol: T): string

  /**
   * Everything on that path except `d` — fill, stroke, width, and whatever else the type paints
   * with.
   *
   * No default: the three built-in families disagree on all three of those, and they are right to.
   * A stroke is a filled outline with no stroke colour at all; an edge is a stroked line on no fill;
   * a shape is both, and its fill comes from the style. A default here would be one of the three
   * quietly imposed on the others.
   */
  protected abstract getPathAttributes(symbol: T): Record<string, string>

  getSVGElement(symbol: T): SVGGraphicsElement {
    const group = SVGBuilder.createGroup(this.getGroupAttributes(symbol))
    group.appendChild(SVGBuilder.createPath({ ...this.getPathAttributes(symbol), d: this.getPathData(symbol) }))
    return group
  }
}
