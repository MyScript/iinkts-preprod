import type { EdgeDecoration } from "@/Constants"
import type { TOBB } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import type { TStyle } from "@/style"

import { SymbolType, type TBaseSymbol } from "../Symbol"
import type { TEdgeArc } from "./Arc"
import { computeEdgeBounds, EdgeKind } from "./Edge-enum"
import type { TEdgeLine } from "./Line"
import type { TEdgePolyLine } from "./PolyLine"

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

  computeEdgeBounds(
    vertices: TPoint[],
    style: TStyle,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration
  ): TOBB {
    return computeEdgeBounds(vertices, style, startDecoration, endDecoration)
  },
}
