import type { TEdgeArc } from "./Arc"
import type { TEdgeLine } from "./Line"
import type { TEdgePolyLine } from "./PolyLine"

export * from "./Edge-enum"
export * from "./Edge"
export * from "./Arc"
export * from "./Line"
export * from "./PolyLine"
  
/**
 * @group Symbol
 */
export type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine
