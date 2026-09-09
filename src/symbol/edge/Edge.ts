import type { EdgeDecoration } from "@/Constants"
import type { TOBB } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import type { TStyle } from "@/style"

import { SymbolType, type TBaseSymbol } from "../Symbol"
import { EdgeArcOps, type TEdgeArc } from "./Arc"
import { computeEdgeBounds, EdgeKind } from "./Edge-enum"
import { EdgeLineOps, type TEdgeLine } from "./Line"
import { EdgePolyLineOps, type TEdgePolyLine } from "./PolyLine"

/**
 * @group Symbol
 */
export type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine

/**
 * @group Symbol
 */
export const EdgeOps = {
  /**
   * @group Symbol
   * @summary Check if symbol is an edge (line, arc, polyline)
   * @param symbol - Symbol to check
   * @returns True if symbol is an edge
   */
  isEdge(symbol: TBaseSymbol): symbol is TEdge {
    return symbol.type === SymbolType.Edge
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a line
   * @param edge - The edge to check
   * @returns True if the edge is a line
   */
  isLineEdge(edge: TBaseSymbol): edge is TEdgeLine {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.Line
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is an arc
   * @param edge - The edge to check
   * @returns True if the edge is an arc
   */
  isArcEdge(edge: TBaseSymbol): edge is TEdgeArc {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.Arc
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a polyline
   * @param edge - The edge to check
   * @returns True if the edge is a polyline
   */
  isPolyEdge(edge: TBaseSymbol): edge is TEdgePolyLine {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.PolyEdge
  },

  /**
   * @group Symbol
   * @summary Get resize points for any TEdge.
   */
  getEdgeResizePoints(edge: TEdge): { point: TPoint; vertexIndex: number }[] {
    if (EdgeOps.isLineEdge(edge)) {
      return EdgeLineOps.getResizePoints(edge)
    }
    if (EdgeOps.isPolyEdge(edge)) {
      return EdgePolyLineOps.getResizePoints(edge)
    }
    if (EdgeOps.isArcEdge(edge)) {
      return EdgeArcOps.getResizePoints(edge)
    }
    return []
  },

  computeEdgeBounds(
    vertices: TPoint[],
    style: TStyle,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration
  ): TOBB {
    return computeEdgeBounds(vertices, style, startDecoration, endDecoration)
  },
}
