import type { TPartialDeep } from "@/utils"
import { convertRadianToDegree } from "@/utils"
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import type { TShape } from "@/symbol/shape/Shape"
import { ShapeKind } from "@/symbol/shape/Shape-enum"
import { ShapeCircleOps, type TShapeCircle } from "@/symbol/shape/Circle"
import { ShapeEllipseOps, type TShapeEllipse } from "@/symbol/shape/Ellipse"
import { ShapePolygonOps, type TShapePolygon } from "@/symbol/shape/Polygon"
import { SymbolUtil } from "../SymbolUtil"
import { SVGBuilder } from "../SVGBuilder"

/**
 * @group SymbolUtils
 */
export class ShapeUtil extends SymbolUtil<TShape>
{
  readonly type = SymbolType.Shape

  create(partial: TPartialDeep<TShape>): TShape
  {
    switch (partial.kind) {
      case ShapeKind.Circle:
        return ShapeCircleOps.createFromPartial(partial as TPartialDeep<TShapeCircle>)
      case ShapeKind.Ellipse:
        return ShapeEllipseOps.createFromPartial(partial as TPartialDeep<TShapeEllipse>)
      case ShapeKind.Polygon:
        return ShapePolygonOps.createFromPartial(partial as TPartialDeep<TShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partial.kind }" is unknown`)
    }
  }

  updateDerivedFields(shape: TShape): void
  {
    switch (shape.kind) {
      case ShapeKind.Circle:
        ShapeCircleOps.updateDerivedFields(shape as TShapeCircle)
        break
      case ShapeKind.Ellipse:
        ShapeEllipseOps.updateDerivedFields(shape as TShapeEllipse)
        break
      case ShapeKind.Polygon:
        ShapePolygonOps.updateDerivedFields(shape as TShapePolygon)
        break
    }
  }

  overlaps(shape: TShape, box: TBox): boolean
  {
    switch (shape.kind) {
      case ShapeKind.Circle:
        return ShapeCircleOps.overlaps(shape as TShapeCircle, box)
      case ShapeKind.Ellipse:
        return ShapeEllipseOps.overlaps(shape as TShapeEllipse, box)
      case ShapeKind.Polygon:
        return ShapePolygonOps.overlaps(shape as TShapePolygon, box)
      default:
        return false
    }
  }

  getSnapPoints(shape: TShape): TPoint[]
  {
    return shape.snapPoints
  }

  static getSVGPath(shape: TShape): string
  {
    switch (shape.kind) {
      case ShapeKind.Circle:
        return ShapeCircleOps.getSVGPath(shape as TShapeCircle)
      case ShapeKind.Ellipse:
        return ShapeEllipseOps.getSVGPath(shape as TShapeEllipse)
      case ShapeKind.Polygon:
        return ShapePolygonOps.getSVGPath(shape as TShapePolygon)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknown: "${ JSON.stringify(shape) }"`)
    }
  }

  getSVGElement(shape: TShape): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width).toString(),
      "d": ShapeUtil.getSVGPath(shape),
    }
    if (shape.style.opacity) {
      pathAttrs["opacity"] = shape.style.opacity.toString()
    }
    if (shape.kind === ShapeKind.Ellipse) {
      const ellipse = shape as TShapeEllipse
      pathAttrs.transform = `rotate(${ convertRadianToDegree(ellipse.orientation) }, ${ ellipse.center.x }, ${ ellipse.center.y })`
    }

    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }
}
