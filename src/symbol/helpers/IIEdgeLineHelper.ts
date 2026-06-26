import { TStyle, DefaultStyle } from "@/style"
import { PartialDeep, findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"
import { TPoint, isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { EdgeKind, EdgeDecoration } from "@/symbol/geometry/IIEdge"
import { TEdgeLine } from "@/symbol/geometry/IIEdgeLine"
import { computeEdgeBounds } from "./_edgeDerivedFields"

/**
 * Helper functions for TEdgeLine plain type
 * @group Symbol
 */
export const IIEdgeLineHelper = {
  create(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: PartialDeep<TStyle>): TEdgeLine
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const line: TEdgeLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.Line,
      isClosed: false,
      id: `${ SymbolType.Edge }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      startDecoration,
      endDecoration,
      start,
      end,
      vertices: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIEdgeLineHelper.updateDerivedFields(line)
    return line
  },

  createFromPartial(partial: PartialDeep<TEdgeLine>): TEdgeLine
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a line, start point is invalid`)
    if (!isValidPoint(partial?.end)) throw new Error(`Unable to create a line, end point is invalid`)
    const line = IIEdgeLineHelper.create(partial.start as TPoint, partial.end as TPoint, partial.startDecoration, partial.endDecoration, partial.style)
    if (partial.id) line.id = partial.id
    return line
  },

  updateDerivedFields(line: TEdgeLine): void
  {
    line.vertices = [line.start, line.end]
    line.bounds = computeEdgeBounds(line.vertices, line.style, line.startDecoration, line.endDecoration)
    line.snapPoints = line.vertices
    line.edges = [{ p1: line.start, p2: line.end }]
  },

  getResizePoints(line: TEdgeLine): { point: TPoint, vertexIndex: number }[]
  {
    return line.vertices.map((point, vertexIndex) => ({ point, vertexIndex }))
  },

  overlaps(line: TEdgeLine, box: TBox): boolean
  {
    return BoxHelper.isContained(line.bounds, box) ||
      line.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },
}
