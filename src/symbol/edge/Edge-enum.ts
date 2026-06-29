import { SELECTION_MARGIN } from "@/Constants"
import type { TStyle } from "@/style"
import { BoxOps } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"

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

export function computeEdgeBounds(vertices: TPoint[], style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration): TOBB
{
  const bb = BoxOps.createFromPoints(vertices)
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
  return OBBOps.fromBox(bb)
}
