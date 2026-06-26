import { SELECTION_MARGIN } from "@/Constants"
import { TStyle, DefaultStyle } from "@/style"
import { PartialDeep, computePointOnEllipse, computeEllipseRadiusAverage, findIntersectionBetween2Segment, isValidNumber } from "@/utils"
import { createUUID } from "@/utils/uuid"
import { TPoint, isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { EdgeKind, EdgeDecoration } from "@/symbol/geometry/IIEdge"
import { TEdgeArc } from "@/symbol/geometry/IIEdgeArc"
import { computeEdgeBounds } from "./_edgeDerivedFields"

/**
 * Helper functions for TEdgeArc plain type
 * @group Symbol
 */
export const IIEdgeArcHelper = {
  create(
    center: TPoint,
    startAngle: number,
    sweepAngle: number,
    radiusX: number,
    radiusY: number,
    phi: number,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: PartialDeep<TStyle>
  ): TEdgeArc
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const arc: TEdgeArc = {
      type: SymbolType.Edge,
      kind: EdgeKind.Arc,
      isClosed: false,
      id: `${ SymbolType.Edge }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      center,
      startAngle,
      sweepAngle,
      radiusX,
      radiusY,
      phi,
      startDecoration,
      endDecoration,
      vertices: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIEdgeArcHelper.updateDerivedFields(arc)
    return arc
  },

  createFromPartial(partial: PartialDeep<TEdgeArc>): TEdgeArc
  {
    if (!isValidPoint(partial?.center)) throw new Error(`Unable to create a arc, center point is invalid`)
    if (!isValidNumber(partial?.startAngle)) throw new Error(`Unable to create a arc, startAngle is invalid`)
    if (!isValidNumber(partial?.sweepAngle)) throw new Error(`Unable to create a arc, sweepAngle is invalid`)
    if (!isValidNumber(partial?.radiusX)) throw new Error(`Unable to create a arc, radiusX is invalid`)
    if (!isValidNumber(partial?.radiusY)) throw new Error(`Unable to create a arc, radiusY is invalid`)
    const arc = IIEdgeArcHelper.create(
      partial.center as TPoint,
      partial.startAngle!,
      partial.sweepAngle!,
      partial.radiusX!,
      partial.radiusY!,
      partial.phi || 0,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) arc.id = partial.id
    return arc
  },

  computeVertices(arc: TEdgeArc): TPoint[]
  {
    const length = Math.abs(arc.sweepAngle) * computeEllipseRadiusAverage(arc.radiusX, arc.radiusY)
    const nbVertices = Math.max(8, Math.round(length / SELECTION_MARGIN))
    const angleStep = arc.sweepAngle / nbVertices
    const v: TPoint[] = []
    const endAngle = arc.startAngle + arc.sweepAngle
    if (arc.sweepAngle > 0) {
      for (let angle = arc.startAngle; angle < endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    } else {
      for (let angle = arc.startAngle; angle > endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    }
    v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, endAngle))
    return v
  },

  updateDerivedFields(arc: TEdgeArc): void
  {
    const vertices = IIEdgeArcHelper.computeVertices(arc)
    arc.vertices = vertices
    arc.bounds = computeEdgeBounds(vertices, arc.style, arc.startDecoration, arc.endDecoration)
    arc.snapPoints = [vertices[0], vertices.at(-1)!]
    arc.edges = vertices.slice(0, -1).map((p, i) => ({ p1: p, p2: vertices[i + 1] }))
  },

  getResizePoints(arc: TEdgeArc): { point: TPoint, vertexIndex: number }[]
  {
    const v = arc.vertices
    const mid = Math.floor(v.length / 2)
    return [
      { point: v[0], vertexIndex: 0 },
      { point: v[mid], vertexIndex: mid },
      { point: v[v.length - 1], vertexIndex: v.length - 1 },
    ]
  },

  overlaps(arc: TEdgeArc, box: TBox): boolean
  {
    return BoxHelper.isContained(arc.bounds, box) ||
      arc.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },
}
