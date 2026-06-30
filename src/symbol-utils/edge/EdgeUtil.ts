import { DefaultStyle } from "@/style"
import { EdgeArcOps, type TEdgeArc } from "@/symbol/edge/Arc"
import type { TEdge } from "@/symbol/edge/Edge"
import { EdgeDecoration, EdgeKind } from "@/symbol/edge/Edge-enum"
import { EdgeLineOps, type TEdgeLine } from "@/symbol/edge/Line"
import { EdgePolyLineOps, type TEdgePolyLine } from "@/symbol/edge/PolyLine"
import type { TBox } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import type { TPartialDeep } from "@/utils"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "./EdgeRenderOptions"

/**
 * @group SymbolUtils
 */
export class EdgeUtil extends SymbolUtil<TEdge> {
  readonly type = SymbolType.Edge

  create(partial: TPartialDeep<TEdge>): TEdge {
    switch (partial.kind) {
      case EdgeKind.Arc:
        return EdgeArcOps.createFromPartial(partial as TPartialDeep<TEdgeArc>)
      case EdgeKind.Line:
        return EdgeLineOps.createFromPartial(partial as TPartialDeep<TEdgeLine>)
      case EdgeKind.PolyEdge:
        return EdgePolyLineOps.createFromPartial(partial as TPartialDeep<TEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${partial.kind}" is unknown`)
    }
  }

  updateDerivedFields(edge: TEdge): void {
    switch (edge.kind) {
      case EdgeKind.Arc:
        EdgeArcOps.updateDerivedFields(edge as TEdgeArc)
        break
      case EdgeKind.Line:
        EdgeLineOps.updateDerivedFields(edge as TEdgeLine)
        break
      case EdgeKind.PolyEdge:
        EdgePolyLineOps.updateDerivedFields(edge as TEdgePolyLine)
        break
    }
  }

  overlaps(edge: TEdge, box: TBox): boolean {
    switch (edge.kind) {
      case EdgeKind.Arc:
        return EdgeArcOps.overlaps(edge as TEdgeArc, box)
      case EdgeKind.Line:
        return EdgeLineOps.overlaps(edge as TEdgeLine, box)
      case EdgeKind.PolyEdge:
        return EdgePolyLineOps.overlaps(edge as TEdgePolyLine, box)
      default:
        return false
    }
  }

  getSnapPoints(edge: TEdge): TPoint[] {
    return edge.snapPoints
  }

  static getSVGPath(edge: TEdge): string {
    switch (edge.kind) {
      case EdgeKind.Line:
        return EdgeLineOps.getSVGPath(edge as TEdgeLine)
      case EdgeKind.PolyEdge:
        return EdgePolyLineOps.getSVGPath(edge as TEdgePolyLine)
      case EdgeKind.Arc:
        return EdgeArcOps.getSVGPath(edge as TEdgeArc)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknown: "${JSON.stringify(edge)}"`)
    }
  }

  getSVGElement(edge: TEdge): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: edge.id,
      type: edge.type,
      kind: edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      fill: "transparent",
      stroke: edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      d: EdgeUtil.getSVGPath(edge),
    }
    if (edge.style.opacity) {
      pathAttrs["opacity"] = edge.style.opacity.toString()
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-start"] = `url(#${arrowHeadStartMarkerId})`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-end"] = `url(#${arrowHeadEndMarkerId})`
    }
    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }
}
