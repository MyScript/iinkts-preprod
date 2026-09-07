import type { EdgeDecoration } from "@/Constants"
import type { TBox } from "@/core/geometry"
import { OBBOps, type TOBB } from "@/core/geometry"
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
    const mergedStyle = mergeSymbolStyle(style)
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

  computeVertices(line: TEdgeLine): TPoint[] {
    return [line.start, line.end]
  },

  computeBounds(line: TEdgeLine, vertices: TPoint[]): TOBB {
    return computeEdgeBounds(vertices, line.style, line.startDecoration, line.endDecoration)
  },

  computeEdges(line: TEdgeLine): TSegment[] {
    return [{ p1: line.start, p2: line.end }]
  },

  updateDerivedFields(line: TEdgeLine): void {
    const vertices = EdgeLineOps.computeVertices(line)
    line.vertices = vertices
    line.bounds = EdgeLineOps.computeBounds(line, vertices)
    line.snapPoints = vertices
    line.edges = EdgeLineOps.computeEdges(line)
  },

  getResizePoints(line: TEdgeLine): TResizePoint[] {
    return line.vertices.map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  },

  overlaps(line: TEdgeLine, box: TBox): boolean {
    return OBBOps.polygonOverlapsBox(line.bounds, line.edges, box)
  },

  getSVGPath(line: TEdgeLine): string {
    const start = line.startAnchor?.entryPoint ?? line.start
    const end = line.endAnchor?.entryPoint ?? line.end
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  },
}
