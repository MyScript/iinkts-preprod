import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform, OBBOps, PointSet2d } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { StrokeOps, type TStroke } from "@/symbol/stroke/Stroke"
import { SymbolType } from "@/symbol/Symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"

/**
 * @group SymbolUtils
 */
export class StrokeUtil extends SymbolUtil<TStroke> {
  readonly type = SymbolType.Stroke

  create(partial: TPartialDeep<TStroke>): TStroke {
    return StrokeOps.createFromPartial(partial)
  }

  /**
   * A stroke is the run of points the pen left, and {@link PointSet2d} is exactly that shape: its
   * path, length and box all come from the same samples, and it is caught by a query holding one of
   * them rather than by the drawn line crossing it — which is what a stroke's selection has always
   * meant.
   */
  getGeometry(stroke: TStroke): PointSet2d {
    return new PointSet2d(stroke.pointers)
  }

  /**
   * The geometry answers, so this no longer explains what a stroke's overlap means — {@link PointSet2d}
   * does, once, for anything shaped like a run of samples.
   *
   * It also drops the apparatus this type used to need: that mapped the query *backwards*
   * through the symbol's inverse matrix and needed a second, exact callback for the rotated case,
   * because the raw geometry could not be moved. A `Geometry2d` can, so the symbol goes forwards
   * instead and the axis-aligned query is tested as it stands — the same answer, without an inverse
   * to guard against, a determinant to check, or a quad to special-case.
   */
  overlaps(stroke: TStroke, box: TBox): boolean {
    return SymbolGeometry.of(stroke).overlapsBox(box)
  }

  /**
   * A stroke snaps on its box, not on the samples themselves: an ink trace has no corner anything
   * would want to land on.
   */
  getSnapPoints(stroke: TStroke): TPoint[] {
    return OBBOps.getSnapPoints(SymbolGeometry.of(stroke).bounds)
  }

  getSVGElement(stroke: TStroke): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: stroke.id,
      type: "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (!isIdentityMatrix(stroke.transform)) {
      attrs.transform = MatrixTransform.toCssString(stroke.transform)
    }

    const strokeGroup = SVGBuilder.createGroup(attrs)

    const strokeAttrs: { [key: string]: string } = {
      fill: stroke.style.color || DefaultStyle.color!,
      "stroke-width": stroke.style.width.toString(),
      d: StrokeOps.getSVGPath(stroke),
    }
    if (stroke.style.opacity) {
      strokeAttrs.opacity = stroke.style.opacity.toString()
    }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    return strokeGroup
  }
}
