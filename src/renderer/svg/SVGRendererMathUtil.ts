import { DecoratorKind, IIMath } from "../../symbol"
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

    const mathElement = SVGBuilder.createText(math.point, "")

    math.elements.forEach(e =>
    {
      const attrs: { [key: string]: string } = {
        id: e.id,
        fill: e.color,
        "font-size": `${ e.fontSize }px`,
        "font-weight": e.fontWeight.toString(),
        "font-family": e.fontFamily,
      }
      mathElement.appendChild(SVGBuilder.createTSpan(e.label, attrs))
    })
    mathGroup.append(mathElement)

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
