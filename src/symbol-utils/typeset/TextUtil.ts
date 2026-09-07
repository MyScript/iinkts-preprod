import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { DecoratorKind } from "@/symbol/decorator/Decorator"
import { SymbolType } from "@/symbol/Symbol"
import { TextOps, type TText } from "@/symbol/typeset/Text"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import type { TTranslateContext } from "../TransformContext"
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
    return TextOps.overlaps(text, box)
  }

  getSnapPoints(text: TText): TPoint[] {
    return this.computeGeometry(text).snapPoints
  }

  protected glyphsOf(text: TText): { fontSize: number }[] {
    return text.chars
  }

  translate(text: TText, { matrix, typeset }: TTranslateContext): void {
    this.moveAnchor(text, matrix)
    typeset.setBounds(text)
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
    // Composed, not either/or: the matrix is the outer frame, `rotation` (while it still exists —
    // Task 11 removes it) the inner one. `rotation.center` lives in raw coordinates, and an SVG
    // transform list applies right-to-left, so the matrix must be listed FIRST and `rotate` second —
    // reversing that would turn the glyphs about a point the matrix has already moved. At this task
    // the matrix is always identity for a typeset symbol, so this emits exactly today's attribute.
    const transformParts: string[] = []
    if (!isIdentityMatrix(text.transform)) {
      transformParts.push(MatrixTransform.toCssString(text.transform))
    }
    if (text.rotation) {
      transformParts.push(`rotate(${text.rotation.degree}, ${text.rotation.center.x}, ${text.rotation.center.y})`)
    }
    if (transformParts.length) {
      attrs.transform = transformParts.join(" ")
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
