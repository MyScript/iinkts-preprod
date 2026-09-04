import { EdgeDecoration } from "@/Constants"
import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { EdgeArcOps, type TEdgeArc } from "@/symbol/edge/Arc"
import type { TEdge } from "@/symbol/edge/Edge"
import { EdgeKind } from "@/symbol/edge/Edge-enum"
import { EdgeLineOps, type TEdgeLine } from "@/symbol/edge/Line"
import { EdgePolyLineOps, type TEdgePolyLine } from "@/symbol/edge/PolyLine"
import { SymbolType, type TResizePoint } from "@/symbol/Symbol"

import { defineKind, resolveKind, type TKindDefinition } from "../KindDefinition"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "./EdgeRenderOptions"

/**
 * The edge kinds this util can build, and how. Same contract as the shape table — adding a kind is
 * adding an entry, and no method can be left behind.
 */
const EDGE_KINDS: Partial<Record<EdgeKind, TKindDefinition<TEdge>>> = {
  [EdgeKind.Arc]: defineKind<TEdge, TEdgeArc>({
    create: (partial) => EdgeArcOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgeArcOps.updateDerivedFields(edge),
    overlaps: (edge, box) => EdgeArcOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgeArcOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeArcOps.getResizePoints(edge),
  }),
  [EdgeKind.Line]: defineKind<TEdge, TEdgeLine>({
    create: (partial) => EdgeLineOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgeLineOps.updateDerivedFields(edge),
    overlaps: (edge, box) => EdgeLineOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgeLineOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeLineOps.getResizePoints(edge),
  }),
  [EdgeKind.PolyEdge]: defineKind<TEdge, TEdgePolyLine>({
    create: (partial) => EdgePolyLineOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgePolyLineOps.updateDerivedFields(edge),
    overlaps: (edge, box) => EdgePolyLineOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgePolyLineOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgePolyLineOps.getResizePoints(edge),
  }),
}

/**
 * @group SymbolUtils
 */
export class EdgeUtil extends SymbolUtil<TEdge> {
  readonly type = SymbolType.Edge

  create(partial: TPartialDeep<TEdge>): TEdge {
    return resolveKind(EDGE_KINDS, partial.kind, "edge", "create").create(partial)
  }

  updateDerivedFields(edge: TEdge): void {
    EDGE_KINDS[edge.kind]?.updateDerivedFields(edge)
  }

  overlaps(edge: TEdge, box: TBox): boolean {
    return EDGE_KINDS[edge.kind]?.overlaps(edge, box) ?? false
  }

  getSnapPoints(edge: TEdge): TPoint[] {
    return edge.snapPoints
  }

  getResizePoints(edge: TEdge): TResizePoint[] {
    return EDGE_KINDS[edge.kind]?.getResizePoints?.(edge) ?? []
  }

  static getSVGPath(edge: TEdge): string {
    return resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGPath for").getSVGPath(edge)
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
    const definition = resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGElement for")

    const pathAttrs: { [key: string]: string } = {
      fill: "transparent",
      stroke: edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      d: definition.getSVGPath(edge),
      ...definition.extraPathAttributes?.(edge),
    }
    if (edge.style.opacity) {
      pathAttrs["opacity"] = edge.style.opacity.toString()
    }

    // Decorations are not kind dispatch — every kind of edge can carry an arrow head — so they stay
    // here rather than moving into the table.
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
