import { DecoratorKind } from "@/symbol/decorator/Decorator"
import type { TBox } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import { TextOps, type TText } from "@/symbol/text/Text"
import type { TPartialDeep } from "@/utils"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"

const noSelection =
  "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group SymbolUtils
 */
export class TextUtil extends SymbolUtil<TText> {
  readonly type = SymbolType.Text

  create(partial: TPartialDeep<TText>): TText {
    return TextOps.createFromPartial(partial)
  }

  updateDerivedFields(text: TText): void {
    TextOps.updateDerivedFields(text)
  }

  overlaps(text: TText, box: TBox): boolean {
    return TextOps.overlaps(text, box)
  }

  getSnapPoints(text: TText): TPoint[] {
    return text.snapPoints
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
    if (text.rotation) {
      attrs.transform = `rotate(${text.rotation.degree}, ${text.rotation.center.x}, ${text.rotation.center.y})`
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
