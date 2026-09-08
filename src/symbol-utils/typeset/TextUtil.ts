import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DecoratorKind } from "@/symbol/decorator/Decorator"
import { SymbolType } from "@/symbol/Symbol"
import { TextOps, type TText } from "@/symbol/typeset/Text"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import { TypesetUtil } from "./TypesetUtil"

const noSelection =
  "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group SymbolUtils
 */
export class TextUtil extends TypesetUtil<TText> {
  readonly type = SymbolType.Text

  create(partial: TPartialDeep<TText>): TText {
    return TextOps.createFromPartial(partial)
  }

  overlaps(text: TText, box: TBox): boolean {
    return this.overlapsQuery(text, box, (b) => TextOps.overlaps(text, b))
  }

  getSnapPoints(text: TText): TPoint[] {
    return this.mapPointsForward(text, this.computeGeometry(text).snapPoints)
  }

  getSVGElement(text: TText): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: text.id,
      type: text.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: noSelection,
    }
    if (text.style.opacity) {
      attrs.opacity = text.style.opacity.toString()
    }
    // Turning a text symbol is composed into its matrix now, not recorded separately — there is no
    // `.rotation` left to combine this with.
    if (!isIdentityMatrix(text.transform)) {
      attrs.transform = MatrixTransform.toCssString(text.transform)
    }

    const textGroup = SVGBuilder.createGroup(attrs)
    const textElement = SVGBuilder.createText(text.point, "")

    text.chars.forEach((c) => {
      const charAttrs: { [key: string]: string } = {
        id: c.id,
        fill: c.color,
        "font-size": `${c.fontSize}px`,
        "font-weight": c.fontWeight.toString(),
      }
      textElement.appendChild(SVGBuilder.createTSpan(c.label, charAttrs))
    })
    textGroup.append(textElement)

    text.decorators.forEach((d) => {
      const deco = DecoratorUtil.renderForSymbol(d, text)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          textGroup.prepend(deco)
        } else {
          textGroup.append(deco)
        }
      }
    })

    return textGroup
  }
}
