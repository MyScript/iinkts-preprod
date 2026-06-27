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
export type TEdgeLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.Line
  isClosed: false
  style: TStyle
  selected: boolean
  deleting: boolean
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  start: TPoint
  end: TPoint
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 * @group Utilities
 */
export const EdgeLineHelper = {
  create(start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration, style?: TPartialDeep<TStyle>): TEdgeLine
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
    EdgeLineHelper.updateDerivedFields(line)
    return line
  },

  createFromPartial(partial: TPartialDeep<TEdgeLine>): TEdgeLine
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a line, start point is invalid`)
    if (!isValidPoint(partial?.end)) throw new Error(`Unable to create a line, end point is invalid`)
    const line = EdgeLineHelper.create(partial.start as TPoint, partial.end as TPoint, partial.startDecoration, partial.endDecoration, partial.style)
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
