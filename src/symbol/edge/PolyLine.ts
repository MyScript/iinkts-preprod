import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TPartialDeep } from "@/utils"
import { findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import { isValidPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import type { TBaseSymbol } from "@/symbol/Symbol"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxHelper } from "@/symbol/primitives/Box"
import type { EdgeDecoration} from "./Edge"
import { EdgeKind, computeEdgeBounds } from "./Edge"

/**
 * @group Symbol
 */
export type TEdgePolyLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.PolyEdge
  isClosed: false
  style: TStyle
  selected: boolean
  deleting: boolean
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  points: TPoint[]
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 * @group Utilities
 */
export const EdgePolyLineHelper = {
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
    EdgePolyLineHelper.updateDerivedFields(polyline)
    return polyline
  },

  createFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine
  {
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a PolyLine, points are invalid`)
    const polyline = EdgePolyLineHelper.create(partial?.points as TPoint[], partial.startDecoration, partial.endDecoration, partial.style)
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
