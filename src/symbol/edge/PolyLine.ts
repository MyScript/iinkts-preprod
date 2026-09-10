import type { EdgeDecoration } from "@/Constants"
import type { TBox } from "@/core/geometry"
import { MatrixTransform, mergeSymbolTransform, OBBOps, type TOBB } from "@/core/geometry"
import { isValidPoint, type TPoint, type TSegment } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import type { TStyle } from "@/style"
import { mergeSymbolStyle } from "@/style"
import { SymbolType, type TBaseSymbol, type TResizePoint } from "@/symbol/Symbol"

import type { TAnchor } from "./Anchor"
import { computeEdgeBounds, EdgeKind } from "./Edge-enum"
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
}

/**
 * @group Symbol
 */
export const EdgePolyLineOps = {
  create(
    points: TPoint[],
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgePolyLine {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const polyline: TEdgePolyLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.PolyEdge,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      startDecoration,
      endDecoration,
      points,
      transform: MatrixTransform.identity(),
    }
    return polyline
  },

  createFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine {
    if (partial?.points?.some((p) => !isValidPoint(p))) {
      throw new Error(`Unable to create a PolyLine, points are invalid`)
    }
    const polyline = EdgePolyLineOps.create(
      partial?.points as TPoint[],
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      polyline.id = partial.id
    }
    polyline.transform = mergeSymbolTransform(partial.transform)
    return polyline
  },

  /**
   * A polyline's vertices are the points it stores, returned as-is.
   *
   * Named rather than inlined so every caller goes through one place: `computeGeometry`,
   * `getResizePoints` and the edge-kind table all used to reach for the stored `vertices` field.
   */
  computeVertices(polyline: TEdgePolyLine): TPoint[] {
    return polyline.points
  },

  computeBounds(polyline: TEdgePolyLine): TOBB {
    return computeEdgeBounds(polyline.points, polyline.style, polyline.startDecoration, polyline.endDecoration)
  },

  computeEdges(points: TPoint[]): TSegment[] {
    return points.slice(0, -1).map((p, i) => ({
      p1: p,
      p2: points[i + 1],
    }))
  },

  getResizePoints(polyline: TEdgePolyLine): TResizePoint[] {
    return EdgePolyLineOps.computeVertices(polyline).map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  },

  /**
   * Moves the vertex a resize handle owns, by writing into the geometry the polyline stores.
   *
   * A polyline's vertices *are* its `points`, so the drag handler used to reach them by aliasing
   * through the stored array. See `EdgeLineOps.moveVertex` for why that is no longer relied on.
   */
  moveVertex(polyline: TEdgePolyLine, vertexIndex: number, point: TPoint): void {
    const target = polyline.points[vertexIndex]
    if (!target) {
      return
    }
    target.x = point.x
    target.y = point.y
  },

  overlaps(polyline: TEdgePolyLine, box: TBox): boolean {
    return OBBOps.polygonOverlapsBox(
      EdgePolyLineOps.computeBounds(polyline),
      EdgePolyLineOps.computeEdges(polyline.points),
      box
    )
  },

  getSVGPath(polyline: TEdgePolyLine): string {
    const entry1 = polyline.startAnchor?.entryPoint
    const entry2 = polyline.endAnchor?.entryPoint
    const stored = EdgePolyLineOps.computeVertices(polyline)
    const lastIdx = stored.length - 1
    const firstPt = entry1 ?? stored[0]
    let path = `M ${firstPt.x} ${firstPt.y}`
    for (let i = entry1 ? 1 : 0; i <= lastIdx; i++) {
      const pt = entry2 && i === lastIdx ? entry2 : stored[i]
      path += ` L ${pt.x} ${pt.y}`
    }
    return path
  },
}
