import type { TPartialDeep } from "@/core/std"
import { SymbolType } from "@/symbol/Symbol"
import { TextOps, type TText } from "@/symbol/typeset/Text"

import { SVGBuilder } from "../SVGBuilder"
import { TypesetUtil } from "./TypesetUtil"

/**
 * @group SymbolUtils
 */
export class TextUtil extends TypesetUtil<TText> {
  readonly type = SymbolType.Text

  create(partial: TPartialDeep<TText>): TText {
    return TextOps.createFromPartial(partial)
  }

  /** One text element on the baseline, one tspan per character. */
  protected buildContent(text: TText): SVGElement[] {
    const textElement = SVGBuilder.createText(text.point, "")
    text.chars.forEach((c) => {
      textElement.appendChild(
        SVGBuilder.createTSpan(c.label, {
          id: c.id,
          fill: c.color,
          "font-size": `${c.fontSize}px`,
          "font-weight": c.fontWeight.toString(),
        })
      )
    })
    return [textElement]
  }
}
