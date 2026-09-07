import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { applyMatrixToPoint, applyMatrixToPoints } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DecoratorKind } from "@/symbol/decorator/Decorator"
import { SymbolType } from "@/symbol/Symbol"
import { MathOps, type TMath } from "@/symbol/typeset/Math"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import type { TTranslateContext } from "../TransformContext"
import { TypesetUtil } from "./TypesetUtil"

const noSelection =
  "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

/**
 * @group SymbolUtils
 */
export class MathUtil extends TypesetUtil<TMath> {
  readonly type = SymbolType.Math

  create(partial: TPartialDeep<TMath>): TMath {
    return MathOps.createFromPartial(partial)
  }

  overlaps(math: TMath, box: TBox): boolean {
    return MathOps.overlaps(math, box)
  }

  getSnapPoints(math: TMath): TPoint[] {
    return this.computeGeometry(math).snapPoints
  }

  protected glyphsOf(math: TMath): { fontSize: number }[] {
    return math.elements
  }

  /**
   * Moves more than text does: a math symbol's elements each carry their own bounds, and its own
   * bounds centre is stored rather than derived, so both follow the matrix here.
   */
  translate(math: TMath, { matrix, typeset }: TTranslateContext): void {
    this.moveAnchor(math, matrix)
    applyMatrixToPoints([math.bounds.center], matrix)
    math.elements.forEach((element) => {
      const moved = applyMatrixToPoint({ x: element.bounds.x, y: element.bounds.y }, matrix)
      element.bounds.x = moved.x
      element.bounds.y = moved.y
    })
    typeset.setBounds(math)
  }

  getSVGElement(math: TMath): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: math.id,
      type: math.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: noSelection,
    }
    if (math.style.opacity) {
      attrs.opacity = math.style.opacity.toString()
    }
    if (math.rotation) {
      attrs.transform = `rotate(${math.rotation.degree}, ${math.rotation.center.x}, ${math.rotation.center.y})`
    }

    const mathGroup = SVGBuilder.createGroup(attrs)

    const hasSuperscript = math.elements.some((e) => e.position === "superscript")
    const hasSubscript = math.elements.some((e) => e.position === "subscript")

    if (hasSuperscript || hasSubscript) {
      let currentX = math.point.x
      const baselineY = math.point.y

      math.elements.forEach((e, index) => {
        const textAttrs: {
          [key: string]: string
        } = {
          id: e.id,
          fill: e.color,
          "font-size": `${e.fontSize}px`,
          "font-weight": e.fontWeight.toString(),
          "font-family": e.fontFamily,
        }

        let x = currentX
        let y = baselineY

        if (e.position === "superscript") {
          y = baselineY - e.fontSize * 1.5
          x = currentX - e.label.length * e.fontSize * 0.3
        } else if (e.position === "subscript") {
          y = baselineY + e.fontSize * 1.2
          x = currentX - e.label.length * e.fontSize * 0.3
        } else {
          if (index > 0) {
            const prevElement = math.elements[index - 1]
            if (prevElement.position === "normal") {
              currentX += prevElement.label.length * prevElement.fontSize * 0.6
              x = currentX
            }
          }
        }

        const textElement = SVGBuilder.createText({ x, y }, e.label)
        Object.entries(textAttrs).forEach(([key, value]) => {
          textElement.setAttribute(key, value)
        })
        mathGroup.appendChild(textElement)

        if (e.position === "normal") {
          currentX = x + e.label.length * e.fontSize * 0.6
        }
      })
    } else {
      const mathElement = SVGBuilder.createText(math.point, "")

      math.elements.forEach((e) => {
        const tspanAttrs: {
          [key: string]: string
        } = {
          id: e.id,
          fill: e.color,
          "font-size": `${e.fontSize}px`,
          "font-weight": e.fontWeight.toString(),
          "font-family": e.fontFamily,
        }
        mathElement.appendChild(SVGBuilder.createTSpan(e.label, tspanAttrs))
      })

      mathGroup.append(mathElement)
    }

    math.decorators.forEach((d) => {
      const deco = DecoratorUtil.renderForSymbol(d, math)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          mathGroup.prepend(deco)
        } else {
          mathGroup.append(deco)
        }
      }
    })

    return mathGroup
  }
}
