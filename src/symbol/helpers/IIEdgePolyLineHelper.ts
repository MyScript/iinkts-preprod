import type { TStyle} from "@/style";
import { DefaultStyle } from "@/style"
import type { TPartialDeep} from "@/utils";
import { findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"
import type { TPoint} from "@/symbol/base/Point";
import { isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import type { EdgeDecoration } from "@/symbol/geometry/IIEdge";
import { EdgeKind } from "@/symbol/geometry/IIEdge"
import type { TEdgePolyLine } from "@/symbol/geometry/IIEdgePolyLine"
import { computeEdgeBounds } from "./_edgeDerivedFields"

/**
 * Helper functions for TEdgePolyLine plain type
 * @group Symbol
 */
export const IIEdgePolyLineHelper = {
  create(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgePolyLine
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const polyline: TEdgePolyLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.PolyEdge,
      isClosed: false,
      id: `${ SymbolType.Edge }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      startDecoration,
      endDecoration,
      points,
      vertices: points,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIEdgePolyLineHelper.updateDerivedFields(polyline)
    return polyline
  },

  createFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine
  {
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a PolyLine, points are invalid`)
    const polyline = IIEdgePolyLineHelper.create(partial?.points as TPoint[], partial.startDecoration, partial.endDecoration, partial.style)
    if (partial.id) polyline.id = partial.id
    return polyline
  },

  updateDerivedFields(polyline: TEdgePolyLine): void
  {
    polyline.vertices = polyline.points
    polyline.bounds = computeEdgeBounds(polyline.vertices, polyline.style, polyline.startDecoration, polyline.endDecoration)
    polyline.snapPoints = polyline.vertices
    polyline.edges = polyline.points.slice(0, -1).map((p, i) => ({ p1: p, p2: polyline.points[i + 1] }))
  },

  getResizePoints(polyline: TEdgePolyLine): { point: TPoint, vertexIndex: number }[]
  {
    return polyline.vertices.map((point, vertexIndex) => ({ point, vertexIndex }))
  },

  overlaps(polyline: TEdgePolyLine, box: TBox): boolean
  {
    return BoxHelper.isContained(polyline.bounds, box) ||
      polyline.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },
}
