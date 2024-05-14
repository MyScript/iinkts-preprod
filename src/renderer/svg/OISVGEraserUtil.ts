import { OIEraser, TPointer } from "../../primitive"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGEraserUtil
{
  getSVGPath(eraser: OIEraser): string
  {
    if (eraser.pointers.length < 1) return ""

    const firstPoint = eraser.pointers.at(0) as TPointer

    if (eraser.pointers.length === 1) {
      const strokeWith = eraser.style.width || 4
      return `C ${ firstPoint.x - strokeWith / 2 } ${ firstPoint.y } Q ${ firstPoint.x  + strokeWith / 2 } ${ firstPoint.y }`
    }

    const middlePoints = eraser.pointers.slice(1)

    const startPathMoveTo = `M ${ firstPoint.x } ${ firstPoint.y }`


    const middlePathQuadratic = middlePoints.reduce((acc, point) => {
      return `${ acc } ${ point.x } ${ point.y }`
    }, "Q")

    return `${ startPathMoveTo } ${ middlePathQuadratic }`
  }

  getSVGElement(eraser: OIEraser): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": eraser.id,
      "type": "eraser",
      "stroke-width":  "12",
      "stroke": "grey",
      "opacity": "0.2",
      "shadowBlur": "5",
      "stroke-linecap": "round",
      "fill": "transparent",
      "d": this.getSVGPath(eraser)
    }
    return SVGBuilder.createPath(attrs)
  }

}
