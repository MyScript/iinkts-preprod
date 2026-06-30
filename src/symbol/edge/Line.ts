import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import { isValidPoint, type TPoint, type TSegment } from "@/symbol/primitives/Point"
import { SymbolType, type TBaseSymbol } from "@/symbol/Symbol"
import type { TPartialDeep } from "@/utils"
import { findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"

import type { TAnchor } from "./Anchor"
import { computeEdgeBounds, type EdgeDecoration, EdgeKind } from "./Edge-enum"

/**
 * @group Symbol
 */
export type TEdgeLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.Line
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  start: TPoint
  end: TPoint
  vertices: TPoint[]
  bounds: TOBB
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 */
export const EdgeLineOps = {
  create(
    start: TPoint,
    end: TPoint,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgeLine {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const line: TEdgeLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.Line,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      startDecoration,
      endDecoration,
      start,
      end,
      vertices: [],
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      snapPoints: [],
      edges: [],
    }
    EdgeLineOps.updateDerivedFields(line)
    return line
  },

  createFromPartial(partial: TPartialDeep<TEdgeLine>): TEdgeLine {
    if (!isValidPoint(partial?.start)) {
      throw new Error(`Unable to create a line, start point is invalid`)
    }
    if (!isValidPoint(partial?.end)) {
      throw new Error(`Unable to create a line, end point is invalid`)
    }
    const line = EdgeLineOps.create(
      partial.start as TPoint,
      partial.end as TPoint,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      line.id = partial.id
    }
    return line
  },

  updateDerivedFields(line: TEdgeLine): void {
    line.vertices = [line.start, line.end]
    line.bounds = computeEdgeBounds(line.vertices, line.style, line.startDecoration, line.endDecoration)
    line.snapPoints = line.vertices
    line.edges = [{ p1: line.start, p2: line.end }]
  },

  getResizePoints(line: TEdgeLine): { point: TPoint; vertexIndex: number }[] {
    return line.vertices.map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  },

  overlaps(line: TEdgeLine, box: TBox): boolean {
    return (
      OBBOps.isContained(line.bounds, box) ||
      line.edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
    )
  },

  getSVGPath(line: TEdgeLine): string {
    const start = line.startAnchor?.entryPoint ?? line.start
    const end = line.endAnchor?.entryPoint ?? line.end
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  },
}
