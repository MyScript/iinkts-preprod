import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import { findIntersectionBetween2Segment, type TPartialDeep } from "@/utils"
import { createUUID } from "@/utils/uuid"
import { isValidPoint, type TPoint, type TSegment } from "@/symbol/primitives/Point"
import { SymbolType, type TBaseSymbol } from "@/symbol/Symbol"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import { EdgeKind, type EdgeDecoration, computeEdgeBounds } from "./Edge-enum"
import type { TAnchor } from "./Anchor"
/**
 * @group Symbol
 */
export type TEdgePolyLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.PolyEdge
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  points: TPoint[]
  vertices: TPoint[]
  bounds: TOBB
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 */
export const EdgePolyLineOps = {
  create(points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgePolyLine
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const polyline: TEdgePolyLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.PolyEdge,
      id: `${ SymbolType.Edge }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      startDecoration,
      endDecoration,
      points,
      vertices: points,
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      snapPoints: [],
      edges: [],
    }
    EdgePolyLineOps.updateDerivedFields(polyline)
    return polyline
  },

  createFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine
  {
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a PolyLine, points are invalid`)
    const polyline = EdgePolyLineOps.create(partial?.points as TPoint[], partial.startDecoration, partial.endDecoration, partial.style)
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
    return OBBOps.isContained(polyline.bounds, box) ||
      polyline.edges.some(e1 => BoxOps.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },

  getSVGPath(polyline: TEdgePolyLine): string
  {
    const entry1 = polyline.startAnchor?.entryPoint
    const entry2 = polyline.endAnchor?.entryPoint
    const lastIdx = polyline.vertices.length - 1
    const firstPt = entry1 ?? polyline.vertices[0]
    let path = `M ${ firstPt.x } ${ firstPt.y }`
    for (let i = entry1 ? 1 : 0; i <= lastIdx; i++) {
      const pt = (entry2 && i === lastIdx) ? entry2 : polyline.vertices[i]
      path += ` L ${ pt.x } ${ pt.y }`
    }
    return path
  },
}
