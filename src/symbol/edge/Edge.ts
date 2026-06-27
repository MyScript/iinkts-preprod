import { SELECTION_MARGIN } from "@/Constants"
import type { TStyle } from "@/style"
import type { TPoint } from "@/symbol/primitives/Point"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxHelper } from "@/symbol/primitives/Box"
import type { TEdgeArc } from "./Arc"
import type { TEdgeLine } from "./Line"
import type { TEdgePolyLine } from "./PolyLine"

/**
 * @group Symbol
 */
export enum EdgeKind
{
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group Symbol
 */
export enum EdgeDecoration
{
  Arrow = "arrow-head"
}

/**
 * @group Symbol
 */
export type TEdge = TEdgeArc | TEdgeLine | TEdgePolyLine

export function computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TBox
{
  const bb = BoxHelper.createFromPoints(vertices)
  bb.x -= SELECTION_MARGIN / 2
  bb.y -= SELECTION_MARGIN / 2
  bb.height += SELECTION_MARGIN
  bb.width += SELECTION_MARGIN
  if (startDecoration || endDecoration) {
    bb.x -= ((style.width || 1) * 2.5)
    bb.y -= ((style.width || 1) * 2.5)
    bb.height += ((style.width || 1) * 5)
    bb.width += ((style.width || 1) * 5)
  }
  return bb
}
