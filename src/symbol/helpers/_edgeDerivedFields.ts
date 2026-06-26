import { SELECTION_MARGIN } from "@/Constants"
import { TStyle } from "@/style"
import { TPoint } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { EdgeDecoration } from "@/symbol/geometry/IIEdge"

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
