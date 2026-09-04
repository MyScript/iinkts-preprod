import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { applyMatrixToPoints, type MatrixTransform } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { StrokeOps, type TStroke } from "@/symbol/stroke/Stroke"
import { SymbolType } from "@/symbol/Symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import type { TRotateContext, TTranslateContext } from "../TransformContext"

/**
 * @group SymbolUtils
 */
export class StrokeUtil extends SymbolUtil<TStroke> {
  readonly type = SymbolType.Stroke

  create(partial: TPartialDeep<TStroke>): TStroke {
    return StrokeOps.createFromPartial(partial)
  }

  updateDerivedFields(stroke: TStroke): void {
    StrokeOps.updateBounds(stroke)
  }

  overlaps(stroke: TStroke, box: TBox): boolean {
    return StrokeOps.overlaps(stroke, box)
  }

  getSnapPoints(stroke: TStroke): TPoint[] {
    return stroke.snapPoints
  }

  /**
   * A stroke does not care which gesture produced the matrix — its pointers are moved and its
   * bounds recomputed either way. This was written out three times, once per transform manager,
   * byte-identical bar a debug log.
   */
  #applyMatrix(stroke: TStroke, matrix: MatrixTransform): void {
    applyMatrixToPoints(stroke.pointers, matrix)
    StrokeOps.updateBounds(stroke)
  }

  translate(stroke: TStroke, { matrix }: TTranslateContext): void {
    this.#applyMatrix(stroke, matrix)
  }

  rotate(stroke: TStroke, { matrix }: TRotateContext): void {
    this.#applyMatrix(stroke, matrix)
  }

  getSVGElement(stroke: TStroke): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: stroke.id,
      type: "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    const strokeGroup = SVGBuilder.createGroup(attrs)

    const strokeAttrs: { [key: string]: string } = {
      fill: stroke.style.color || DefaultStyle.color!,
      "stroke-width": stroke.style.width.toString(),
      d: StrokeOps.getSVGPath(stroke),
    }
    if (stroke.style.opacity) {
      strokeAttrs.opacity = stroke.style.opacity.toString()
    }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    return strokeGroup
  }
}
