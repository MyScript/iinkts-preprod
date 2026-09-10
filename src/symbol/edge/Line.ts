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
      transform: MatrixTransform.identity(),
    }
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
    line.transform = mergeSymbolTransform(partial.transform)
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

  getResizePoints(line: TEdgeLine): TResizePoint[] {
    return EdgeLineOps.computeVertices(line).map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  },

  /**
   * Moves the vertex a resize handle owns, by writing into the geometry the line actually stores.
   *
   * A line's vertices are its `start` and `end`, and `computeVertices` returns those very objects —
   * so the drag handler used to mutate `line.vertices[i]` and reach them by aliasing. That worked
   * only as long as the array was stored and shared; a computed one would take the write and throw
   * it away, silently. This says which field a handle owns instead of relying on that.
   */
  moveVertex(line: TEdgeLine, vertexIndex: number, point: TPoint): void {
    const target = vertexIndex === 0 ? line.start : line.end
    target.x = point.x
    target.y = point.y
  },

  overlaps(line: TEdgeLine, box: TBox): boolean {
    return OBBOps.polygonOverlapsBox(
      EdgeLineOps.computeBounds(line, EdgeLineOps.computeVertices(line)),
      EdgeLineOps.computeEdges(line),
      box
    )
  },

  getSVGPath(line: TEdgeLine): string {
    const start = line.startAnchor?.entryPoint ?? line.start
    const end = line.endAnchor?.entryPoint ?? line.end
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  },
}
