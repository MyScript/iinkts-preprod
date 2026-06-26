import type { TEraser, TPointer } from "@/symbol"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererEraserUtil
{
  static getSVGPath(eraser: TEraser): string
  {
    if (eraser.pointers.length < 1) return ""

    const firstPoint = eraser.pointers.at(0) as TPointer

    const startPath = `M ${ firstPoint.x } ${ firstPoint.y }`

    if (eraser.pointers.length === 1) {
      const strokeWith = eraser.style.width || 4
      return `${startPath} L ${ firstPoint.x  + strokeWith / 2 } ${ firstPoint.y }`
    }

    const middlePoints = eraser.pointers.slice(1)

    return middlePoints.reduce((acc: string, point: TPointer) => {
      return `${ acc } L ${ point.x } ${ point.y }`
    }, startPath)
  }

  static getSVGElement(eraser: TEraser): SVGPathElement
  {
    const attrs: { [key: string]: string } = {
      "id": eraser.id,
      "type": "eraser",
      "stroke-width": String(eraser.style.width),
      "stroke": eraser.style.color,
      "opacity": String(eraser.style.opacity),
      "shadowBlur": "5",
      "stroke-linecap": "round",
      "fill": "transparent",
      "d": SVGRendererEraserUtil.getSVGPath(eraser)
    }
    return SVGBuilder.createPath(attrs)
  }

}
