import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform, OBBOps } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { StrokeOps, type TStroke } from "@/symbol/stroke/Stroke"
import { SymbolType } from "@/symbol/Symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import type { TSymbolGeometry } from "../TSymbolGeometry"

/**
 * @group SymbolUtils
 */
export class StrokeUtil extends SymbolUtil<TStroke> {
  readonly type = SymbolType.Stroke

  create(partial: TPartialDeep<TStroke>): TStroke {
    return StrokeOps.createFromPartial(partial)
  }

  computeGeometry(stroke: TStroke): TSymbolGeometry {
    const bounds = StrokeOps.computeBounds(stroke)
    return {
      bounds,
      vertices: StrokeOps.computeVertices(stroke),
      snapPoints: StrokeOps.computeSnapPoints(bounds),
      edges: StrokeOps.computeEdges(stroke),
      length: StrokeOps.computeLength(stroke),
    }
  }

  updateDerivedFields(stroke: TStroke): void {
    Object.assign(stroke, this.computeGeometry(stroke))
  }

  /**
   * A rotated or sheared query supplies its own exact test here, rather than falling through to
   * `overlapsQuery`'s generic bounds/edges fallback: a stroke's real "overlaps" is "any raw pointer
   * inside the query", not "the drawn line crosses it" — the generic edges-based test would count a
   * query side crossing the segment between two consecutive pointers as an overlap even when no
   * pointer itself lands inside the query, which is truer for a polygon than for a stroke.
   */
  overlaps(stroke: TStroke, box: TBox): boolean {
    return this.overlapsQuery(
      stroke,
      box,
      (b) => StrokeOps.overlaps(stroke, b),
      (query) => stroke.pointers.some((p) => OBBOps.quadContainsPoint(query, p))
    )
  }

  getSnapPoints(stroke: TStroke): TPoint[] {
    return this.mapPointsForward(stroke, this.computeGeometry(stroke).snapPoints)
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
