import type { TOBB, TPoint, TSegment } from "@/core/geometry"

/**
 * Everything about a symbol that is a function of its own raw geometry.
 *
 * Raw means before the symbol's `transform` is applied: a util computes this from the coordinates it
 * stores and nothing else, so the result is stable for as long as those coordinates are. Applying
 * the matrix is `SymbolGeometry`'s job, not a util's — that is what keeps a custom symbol type from
 * having to know the matrix exists.
 */
export type TSymbolGeometry = {
  bounds: TOBB
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
  /** Path length. Zero for the types that have no meaningful one. */
  length: number
}
