import type { TPartialDeep } from "@/utils"
import type { TBox } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import { StrokeOps, type TStroke } from "@/symbol/stroke/Stroke"
import { DefaultStyle } from "@/style"
import { SymbolUtil } from "../SymbolUtil"
import { SVGBuilder } from "../SVGBuilder"

/**
 * @group SymbolUtils
 */
export class StrokeUtil extends SymbolUtil<TStroke>
{
  readonly type = SymbolType.Stroke

  create(partial: TPartialDeep<TStroke>): TStroke
  {
    return StrokeOps.createFromPartial(partial)
  }

  updateDerivedFields(stroke: TStroke): void
  {
    StrokeOps.updateBounds(stroke)
  }

  overlaps(stroke: TStroke, box: TBox): boolean
  {
    return StrokeOps.overlaps(stroke, box)
  }

  getSnapPoints(stroke: TStroke): TPoint[]
  {
    return stroke.snapPoints
  }

  getSVGElement(stroke: TStroke): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": stroke.id,
      "type": "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    const strokeGroup = SVGBuilder.createGroup(attrs)

    const strokeAttrs: { [key: string]: string } = {
      "fill": stroke.style.color || DefaultStyle.color!,
      "stroke-width": stroke.style.width.toString(),
      "d": StrokeOps.getSVGPath(stroke)
    }
    if (stroke.style.opacity) {
      strokeAttrs.opacity = stroke.style.opacity.toString()
    }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    return strokeGroup
  }
}
