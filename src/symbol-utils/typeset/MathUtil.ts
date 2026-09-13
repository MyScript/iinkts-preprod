import type { TPartialDeep } from "@/core/std"
import { SymbolType } from "@/symbol/Symbol"
import { MathOps, type TMath, type TMathElement } from "@/symbol/typeset/Math"

import { SVGBuilder } from "../SVGBuilder"
import { TypesetUtil } from "./TypesetUtil"

/**
 * @group SymbolUtils
 */
export class MathUtil extends TypesetUtil<TMath> {
  readonly type = SymbolType.Math

  create(partial: TPartialDeep<TMath>): TMath {
    return MathOps.createFromPartial(partial)
  }

  /**
   * One text element per element when any of them is a super- or subscript, laid out by hand;
   * otherwise one text element with a tspan each, the way text does it.
   *
   * The hand-laid branch exists because a tspan cannot be lifted off the baseline on its own here —
   * the positions are computed from each element's own font size.
   */
  protected buildContent(math: TMath): SVGElement[] {
    const attributesOf = (element: TMathElement): Record<string, string> => ({
      id: element.id,
      fill: element.color,
      "font-size": `${element.fontSize}px`,
      "font-weight": element.fontWeight.toString(),
      "font-family": element.fontFamily,
    })

    const hasScript = math.elements.some((e) => e.position === "superscript" || e.position === "subscript")
    if (!hasScript) {
      const mathElement = SVGBuilder.createText(math.point, "")
      math.elements.forEach((e) => mathElement.appendChild(SVGBuilder.createTSpan(e.label, attributesOf(e))))
      return [mathElement]
    }

    let currentX = math.point.x
    const baselineY = math.point.y
    return math.elements.map((e, index) => {
      let x = currentX
      let y = baselineY

      if (e.position === "superscript") {
        y = baselineY - e.fontSize * 1.5
        x = currentX - e.label.length * e.fontSize * 0.3
      } else if (e.position === "subscript") {
        y = baselineY + e.fontSize * 1.2
        x = currentX - e.label.length * e.fontSize * 0.3
      } else if (index > 0) {
        const previous = math.elements[index - 1]
        if (previous.position === "normal") {
          currentX += previous.label.length * previous.fontSize * 0.6
          x = currentX
        }
      }

      const textElement = SVGBuilder.createText({ x, y }, e.label)
      Object.entries(attributesOf(e)).forEach(([key, value]) => textElement.setAttribute(key, value))

      if (e.position === "normal") {
        currentX = x + e.label.length * e.fontSize * 0.6
      }
      return textElement
    })
  }
}
