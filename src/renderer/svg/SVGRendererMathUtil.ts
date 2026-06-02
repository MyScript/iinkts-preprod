import { DecoratorKind, IIMath } from "@/symbol"
import { SVGRendererDecoratorUtil } from "./SVGRendererDecoratorUtil"
import { SVGRendererConst } from "./utils/SVGRendererConst"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererMathUtil
{
  static getSVGElement(math: IIMath): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": math.id,
      "type": math.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "style": SVGRendererConst.noSelection,
    }
    if (math.style.opacity) {
      attrs.opacity = math.style.opacity.toString()
    }
    if (math.rotation) {
      attrs.transform = `rotate(${ math.rotation.degree }, ${ math.rotation.center.x }, ${ math.rotation.center.y })`
    }
    if (math.selected) {
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (math.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const mathGroup = SVGBuilder.createGroup(attrs)

    // Check if we have elements with superscript/subscript positions (limits on operators)
    const hasSuperscript = math.elements.some(e => e.position === "superscript")
    const hasSubscript = math.elements.some(e => e.position === "subscript")

    if (hasSuperscript || hasSubscript) {
      // Create separate text elements for operator, superscript, subscript, and rest
      let currentX = math.point.x
      const baselineY = math.point.y

      math.elements.forEach(e =>
      {
        const textAttrs: { [key: string]: string } = {
          id: e.id,
          fill: e.color,
          "font-size": `${ e.fontSize }px`,
          "font-weight": e.fontWeight.toString(),
          "font-family": e.fontFamily,
        }

        let x = currentX
        let y = baselineY

        // Position based on element type
        if (e.position === "superscript") {
          // Above the operator, shifted left to center over it
          y = baselineY - e.fontSize * 1.5
          x = currentX - e.label.length * e.fontSize * 0.3
        } else if (e.position === "subscript") {
          // Below the operator, shifted left to center under it
          y = baselineY + e.fontSize * 1.2
          x = currentX - e.label.length * e.fontSize * 0.3
        } else {
          // Normal element - advance x position after previous normal elements
          if (math.elements.indexOf(e) > 0) {
            // Advance x after operator and limits
            const prevElement = math.elements[math.elements.indexOf(e) - 1]
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

        // Update currentX for the next normal element
        if (e.position === "normal") {
          currentX = x + e.label.length * e.fontSize * 0.6
        }
      })
    } else {
      // Simple case: single text element with tspan
      const mathElement = SVGBuilder.createText(math.point, "")

      math.elements.forEach(e =>
      {
        const tspanAttrs: { [key: string]: string } = {
          id: e.id,
          fill: e.color,
          "font-size": `${ e.fontSize }px`,
          "font-weight": e.fontWeight.toString(),
          "font-family": e.fontFamily,
        }
        mathElement.appendChild(SVGBuilder.createTSpan(e.label, tspanAttrs))
      })

      mathGroup.append(mathElement)
    }

    math.decorators.forEach(d =>
    {
      const deco = SVGRendererDecoratorUtil.getSVGElement(d, math)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          mathGroup.prepend(deco)
        }
        else {
          mathGroup.append(deco)
        }
      }
    })

    return mathGroup
  }
}
