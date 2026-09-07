import { EdgeDecoration } from "@/Constants"
import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform } from "@/core/geometry"
import { TWO_PI } from "@/core/math"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { EdgeArcOps, type TEdgeArc } from "@/symbol/edge/Arc"
import type { TEdge } from "@/symbol/edge/Edge"
import { EdgeKind } from "@/symbol/edge/Edge-enum"
import { EdgeLineOps, type TEdgeLine } from "@/symbol/edge/Line"
import { EdgePolyLineOps, type TEdgePolyLine } from "@/symbol/edge/PolyLine"
import { SymbolType, type TResizePoint } from "@/symbol/Symbol"

import {
  defineKind,
  moveByCentre,
  moveByPoints,
  moveEndpoints,
  resolveKind,
  scaleCentreAboutOrigin,
  type TKindDefinition,
} from "../KindDefinition"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import type { TResizeContext, TRotateContext, TTranslateContext } from "../TransformContext"
import type { TSymbolGeometry } from "../TSymbolGeometry"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "./EdgeRenderOptions"

/**
 * The edge kinds this util can build, and how. Same contract as the shape table — adding a kind is
 * adding an entry, and no method can be left behind.
 */
const EDGE_KINDS: Partial<Record<EdgeKind, TKindDefinition<TEdge>>> = {
  [EdgeKind.Arc]: defineKind<TEdge, TEdgeArc>({
    create: (partial) => EdgeArcOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgeArcOps.updateDerivedFields(edge),
    computeGeometry: (edge) => {
      const vertices = EdgeArcOps.computeVertices(edge)
      return {
        bounds: EdgeArcOps.computeBounds(edge, vertices),
        vertices,
        snapPoints: EdgeArcOps.computeSnapPoints(vertices),
        edges: EdgeArcOps.computeEdges(vertices),
        length: 0,
      }
    },
    overlaps: (edge, box) => EdgeArcOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgeArcOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeArcOps.getResizePoints(edge),
    translate: moveByCentre,
    // The other operation-specific cell on this side: an arc carries `phi`, and it turns the
    // opposite way to the matrix.
    rotate: (edge, matrix) => {
      edge.phi = (edge.phi - MatrixTransform.rotation(matrix)) % TWO_PI
      moveByCentre(edge, matrix)
    },
    // The first of the two trigonometric cells. A negative scale factor mirrors the arc, which for
    // a swept arc means re-basing the start angle and reversing the sweep.
    resize: (edge, matrix, origin) => {
      const cos = Math.cos(edge.phi)
      const sin = Math.sin(edge.phi)
      scaleCentreAboutOrigin(edge, matrix, origin, edge.phi)
      edge.radiusX = +(edge.radiusX * Math.abs(matrix.xx * cos + matrix.yy * sin)).toFixed(3)
      edge.radiusY = +(edge.radiusY * Math.abs(matrix.xx * sin + matrix.yy * cos)).toFixed(3)
      if (matrix.xx < 0) {
        edge.startAngle = +(Math.PI - edge.startAngle).toFixed(3)
        edge.sweepAngle *= -1
      } else if (matrix.yy < 0) {
        edge.sweepAngle *= -1
      }
    },
  }),
  [EdgeKind.Line]: defineKind<TEdge, TEdgeLine>({
    create: (partial) => EdgeLineOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgeLineOps.updateDerivedFields(edge),
    computeGeometry: (edge) => {
      const vertices = EdgeLineOps.computeVertices(edge)
      return {
        bounds: EdgeLineOps.computeBounds(edge, vertices),
        vertices,
        snapPoints: vertices,
        edges: EdgeLineOps.computeEdges(edge),
        length: 0,
      }
    },
    overlaps: (edge, box) => EdgeLineOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgeLineOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgeLineOps.getResizePoints(edge),
    translate: moveEndpoints,
    rotate: moveEndpoints,
    resize: moveEndpoints,
  }),
  [EdgeKind.PolyEdge]: defineKind<TEdge, TEdgePolyLine>({
    create: (partial) => EdgePolyLineOps.createFromPartial(partial),
    updateDerivedFields: (edge) => EdgePolyLineOps.updateDerivedFields(edge),
    computeGeometry: (edge) => ({
      bounds: EdgePolyLineOps.computeBounds(edge),
      vertices: edge.points,
      snapPoints: edge.points,
      edges: EdgePolyLineOps.computeEdges(edge.points),
      length: 0,
    }),
    overlaps: (edge, box) => EdgePolyLineOps.overlaps(edge, box),
    getSVGPath: (edge) => EdgePolyLineOps.getSVGPath(edge),
    getResizePoints: (edge) => EdgePolyLineOps.getResizePoints(edge),
    translate: moveByPoints,
    rotate: moveByPoints,
    resize: moveByPoints,
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
   * Tolerant like `updateDerivedFields`: a kind arriving as data the table does not own leaves the
   * edge's current fields as its answer, rather than throwing over a whole model.
   */
  computeGeometry(edge: TEdge): TSymbolGeometry {
    return (
      EDGE_KINDS[edge.kind]?.computeGeometry(edge) ?? {
        bounds: edge.bounds,
        vertices: edge.vertices,
        snapPoints: edge.snapPoints,
        edges: edge.edges,
        length: 0,
      }
    )
  }

  /**
   * A kind the table does not own performs no write at all, exactly like the dispatch this
   * replaced (`EDGE_KINDS[edge.kind]?.updateDerivedFields(edge)`, a no-op for an unowned kind) —
   * `computeGeometry`'s tolerant fallback must not be turned into a write here, or this throws on a
   * frozen record for a kind it was never going to touch. `length` is also left out of the write:
   * only `TStroke` declares it.
   */
  updateDerivedFields(edge: TEdge): void {
    const definition = EDGE_KINDS[edge.kind]
    if (!definition) {
      return
    }
    const { bounds, vertices, snapPoints, edges } = definition.computeGeometry(edge)
    Object.assign(edge, { bounds, vertices, snapPoints, edges })
  }

  overlaps(edge: TEdge, box: TBox): boolean {
    return EDGE_KINDS[edge.kind]?.overlaps(edge, box) ?? false
  }

  getSnapPoints(edge: TEdge): TPoint[] {
    return this.computeGeometry(edge).snapPoints
  }

  getResizePoints(edge: TEdge): TResizePoint[] {
    return EDGE_KINDS[edge.kind]?.getResizePoints?.(edge) ?? []
  }

  translate(edge: TEdge, { matrix }: TTranslateContext): void {
    resolveKind(EDGE_KINDS, edge.kind, "edge", "translate").translate(edge, matrix)
    this.updateDerivedFields(edge)
  }

  rotate(edge: TEdge, { matrix }: TRotateContext): void {
    resolveKind(EDGE_KINDS, edge.kind, "edge", "rotate").rotate(edge, matrix)
    this.updateDerivedFields(edge)
  }

  resize(edge: TEdge, { matrix, origin }: TResizeContext): void {
    resolveKind(EDGE_KINDS, edge.kind, "edge", "resize").resize(edge, matrix, origin)
    this.updateDerivedFields(edge)
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
