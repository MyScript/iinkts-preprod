import { OIShapeCircle, OIShapeEllipse, OIShapePolygon, ShapeKind, TOIShape } from "../../primitive"
import { DefaultStyle } from "../../style"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGShapeUtil
{
  removalFilterId: string
  selectionFilterId: string

  constructor(selectionFilterId: string, removalFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
  }

  getPolygonePath(polygon: OIShapePolygon): string
  {
    return `M ${polygon.points[0].x} ${polygon.points[0].y} ${polygon.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")} Z`
  }

  getCirclePath(circle: OIShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  getEllipsePath(ellipse: OIShapeEllipse): string
  {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  }

  getSVGPath(shape: TOIShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Parallelogram:
      case ShapeKind.Triangle:
      case ShapeKind.Rectangle:
      case ShapeKind.Rhombus:
      case ShapeKind.Polygon:
        return this.getPolygonePath(shape as OIShapePolygon)
      case ShapeKind.Circle:
        return this.getCirclePath(shape as OIShapeCircle)
      case ShapeKind.Ellipse:
        return this.getEllipsePath(shape as OIShapeEllipse)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknow: "${shape.kind}"`)
    }
  }

  getSVGElement(shape: TOIShape): SVGPathElement
  {

    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width!).toString(),
      "opacity": (shape.style.opacity || DefaultStyle.opacity!).toString(),
      "d": this.getSVGPath(shape),
    }

    if (shape.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    if (shape.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }

    return SVGBuilder.createPath(attrs)
  }

}
