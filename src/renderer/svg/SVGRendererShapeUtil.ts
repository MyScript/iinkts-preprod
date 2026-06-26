import { TShapeCircle, TShapeEllipse, TShapePolygon, ShapeKind, TShape } from "@/symbol"
import { DefaultStyle } from "@/style"
import { convertRadianToDegree } from "@/utils"
import { SVGRendererConst } from "./utils/SVGRendererConst"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererShapeUtil
{
  static getPolygonePath(polygon: TShapePolygon): string
  {
    let path = `M ${polygon.points[0].x} ${polygon.points[0].y}`
    for (let i = 1; i < polygon.points.length; i++) {
      path += ` L ${polygon.points[i].x} ${polygon.points[i].y}`
    }
    return path + " Z"
  }

  static getCirclePath(circle: TShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  static getEllipsePath(ellipse: TShapeEllipse): string
  {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  }

  static getSVGPath(shape: TShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Polygon:
        return SVGRendererShapeUtil.getPolygonePath(shape as TShapePolygon)
      case ShapeKind.Circle:
        return SVGRendererShapeUtil.getCirclePath(shape as TShapeCircle)
      case ShapeKind.Ellipse:
        return SVGRendererShapeUtil.getEllipsePath(shape as TShapeEllipse)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknown: "${ JSON.stringify(shape) }"`)
    }
  }

  static getSVGElement(shape: TShape): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (shape.selected) {
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (shape.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width).toString(),
      "d": SVGRendererShapeUtil.getSVGPath(shape),
    }
    if (shape.style.opacity) {
      pathAttrs["opacity"] = shape.style.opacity.toString()
    }
    if (shape.kind === ShapeKind.Ellipse) {
      const ellipse = shape as TShapeEllipse
      pathAttrs.transform = `rotate(${ convertRadianToDegree(ellipse.orientation) }, ${ellipse.center.x}, ${ellipse.center.y})`
    }

    group.appendChild(SVGBuilder.createPath(pathAttrs))

    return group
  }
}
