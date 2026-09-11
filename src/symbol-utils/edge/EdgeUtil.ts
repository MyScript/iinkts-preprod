import { EdgeDecoration, SELECTION_MARGIN } from "@/Constants"
import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { type Geometry2d, isIdentityMatrix, MatrixTransform, Polyline2d } from "@/core/geometry"
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
import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "./EdgeRenderOptions"

/**
 * The edge kinds this util can build, and how. Same contract as the shape table — adding a kind is
 * adding an entry, and no method can be left behind.
 */
/**
 * How far beyond its own path an edge asks to be found.
 *
 * Half {@link SELECTION_MARGIN} on each side, because a hairline drawn exactly is a target nobody can
 * hit — and more again when the edge carries an arrow head, which is drawn outside the path it
 * belongs to and would otherwise sit outside the shape's own bounds. Both figures are the ones
 * `computeEdgeBounds` applied before the geometry owned this.
 */
function edgePadding(edge: TEdge): number {
  const decorated = edge.startDecoration || edge.endDecoration
  return SELECTION_MARGIN / 2 + (decorated ? (edge.style.width || 1) * 2.5 : 0)
}

const EDGE_KINDS: Partial<Record<EdgeKind, TKindDefinition<TEdge>>> = {
  [EdgeKind.Arc]: defineKind<TEdge, TEdgeArc>({
    create: (partial) => EdgeArcOps.createFromPartial(partial),
    // Sampled, not described: an arc is a piece of a curve, and the exact `Ellipse2d` cannot stand
    // in for it — that one is closed, so it would carry a chord across the gap and be caught there.
    getGeometry: (edge) => new Polyline2d(EdgeArcOps.computeVertices(edge), edgePadding(edge)),
    getSnapPoints: (edge) => EdgeArcOps.computeSnapPoints(EdgeArcOps.computeVertices(edge)),
    getSVGPath: (edge) => EdgeArcOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeArcOps.getResizePoints(edge),
  }),
  [EdgeKind.Line]: defineKind<TEdge, TEdgeLine>({
    create: (partial) => EdgeLineOps.createFromPartial(partial),
    getGeometry: (edge) => new Polyline2d(EdgeLineOps.computeVertices(edge), edgePadding(edge)),
    // A line snaps on its own ends, which is what a connector wants to reach for.
    getSnapPoints: (edge) => EdgeLineOps.computeVertices(edge),
    getSVGPath: (edge) => EdgeLineOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeLineOps.getResizePoints(edge),
  }),
  [EdgeKind.PolyEdge]: defineKind<TEdge, TEdgePolyLine>({
    create: (partial) => EdgePolyLineOps.createFromPartial(partial),
    getGeometry: (edge) => new Polyline2d(edge.points, edgePadding(edge)),
    getSnapPoints: (edge) => edge.points,
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

  /**
   * An unregistered kind gets an empty path: no vertices, no edges, an empty box at the origin, and
   * so no overlap with anything — the same answer the record fallback gave.
   */
  getGeometry(edge: TEdge): Geometry2d {
    return EDGE_KINDS[edge.kind]?.getGeometry(edge) ?? new Polyline2d([])
  }

  overlaps(edge: TEdge, box: TBox): boolean {
    return SymbolGeometry.of(edge).overlapsBox(box)
  }

  /**
   * Kind by kind, then carried through the matrix — an edge snaps on its own vertices, not on the
   * corners of a box it never drew.
   */
  getSnapPoints(edge: TEdge): TPoint[] {
    return this.mapPointsForward(edge, EDGE_KINDS[edge.kind]?.getSnapPoints?.(edge) ?? [])
  }

  /**
   * Computed raw, from the table, same as always — then carried through the matrix like any other
   * point a util hands back. A resize handle drawn straight from these has to land where the edge is
   * actually drawn, not where it was before its last translate/rotate/resize.
   */
  getResizePoints(edge: TEdge): TResizePoint[] {
    const raw = EDGE_KINDS[edge.kind]?.getResizePoints?.(edge) ?? []
    const points = this.mapPointsForward(
      edge,
      raw.map(({ point }) => point)
    )
    return raw.map(({ vertexIndex }, i) => ({ point: points[i], vertexIndex }))
  }

  static getSVGPath(edge: TEdge): string {
    return resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGPath for").getSVGPath(edge)
  }

  getSVGElement(edge: TEdge): SVGGraphicsElement {
    const definition = resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGElement for")

    const attrs: { [key: string]: string } = {
      id: edge.id,
      type: edge.type,
      kind: edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (!isIdentityMatrix(edge.transform)) {
      attrs.transform = MatrixTransform.toCssString(edge.transform)
    }

    const group = SVGBuilder.createGroup(attrs)

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
