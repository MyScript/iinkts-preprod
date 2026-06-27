import type { TStyle } from "@/style"
import type { TPartialDeep } from "@/utils/types"
import type { TPoint } from "@/symbol/primitives/Point"
import type { TBox } from "@/symbol/primitives/Box"
import { EdgeArcOps, type TEdgeArc } from "./Arc"
import { EdgeLineOps, type TEdgeLine } from "./Line"
import { EdgePolyLineOps, type TEdgePolyLine } from "./PolyLine"
import { SymbolType, type TBaseSymbol } from "../Symbol"
import { EdgeKind, type EdgeDecoration, computeEdgeBounds } from "./Edge-enum"

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
  isEdge(symbol: TBaseSymbol): symbol is TEdge
  {
    return symbol.type === SymbolType.Edge
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a line
   * @param edge - The edge to check
   * @returns True if the edge is a line
   */
  isLineEdge(edge: TBaseSymbol): edge is TEdgeLine
  {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.Line
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is an arc
   * @param edge - The edge to check
   * @returns True if the edge is an arc
   */
  isArcEdge(edge: TBaseSymbol): edge is TEdgeArc
  {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.Arc
  },

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a polyline
   * @param edge - The edge to check
   * @returns True if the edge is a polyline
   */
  isPolyEdge(edge: TBaseSymbol): edge is TEdgePolyLine
  {
    return EdgeOps.isEdge(edge) && edge.kind === EdgeKind.PolyEdge
  },

  /**
   * @group Symbol
   * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TEdge.
   */
  updateEdgeDerivedFields(edge: TEdge): void
  {
    if (EdgeOps.isLineEdge(edge)) EdgeLineOps.updateDerivedFields(edge)
    else if (EdgeOps.isPolyEdge(edge)) EdgePolyLineOps.updateDerivedFields(edge)
    else if (EdgeOps.isArcEdge(edge)) EdgeArcOps.updateDerivedFields(edge)
  },

  /**
   * @group Symbol
   * @summary Get resize points for any TEdge.
   */
  getEdgeResizePoints(edge: TEdge): { point: TPoint, vertexIndex: number }[]
  {
    if (EdgeOps.isLineEdge(edge)) return EdgeLineOps.getResizePoints(edge)
    if (EdgeOps.isPolyEdge(edge)) return EdgePolyLineOps.getResizePoints(edge)
    if (EdgeOps.isArcEdge(edge)) return EdgeArcOps.getResizePoints(edge)
    return []
  },

  /**
   * @group Symbol
   * @summary Create a TEdge from partial data — dispatches by kind.
   */
  createEdgeFromPartial(partial: TPartialDeep<TEdge>): TEdge
  {
    switch (partial.kind) {
      case EdgeKind.Arc:
        return EdgeArcOps.createFromPartial(partial as TPartialDeep<TEdgeArc>)
      case EdgeKind.Line:
        return EdgeLineOps.createFromPartial(partial as TPartialDeep<TEdgeLine>)
      case EdgeKind.PolyEdge:
        return EdgePolyLineOps.createFromPartial(partial as TPartialDeep<TEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${ partial.kind }" is unknown`)
    }
  },


  computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TBox
  {
    return computeEdgeBounds(vertices, style, startDecoration, endDecoration)
  },
}
