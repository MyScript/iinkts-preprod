import { SELECTION_MARGIN } from "@/Constants"
import { DefaultStyle, type TStyle } from "@/style"
import { findIntersectBetweenSegmentAndCircle, computeRotatedPoint, computeDistance, TWO_PI, type TPartialDeep } from "@/utils"
import { isValidNumber } from "@/utils"
import { createUUID } from "@/utils/uuid"
import { isValidPoint, type TPoint, type TSegment } from "@/symbol/primitives/Point"
import { SymbolType, type TBaseSymbol } from "@/symbol/Symbol"
import { BoxOps, type TBox } from "@/symbol/primitives/Box"
import { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapeCircle = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Circle
  style: TStyle
  center: TPoint
  radius: number
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 */
export const ShapeCircleOps = {
  create(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const circle: TShapeCircle = {
      type: SymbolType.Shape,
      kind: ShapeKind.Circle,
      id: `${ SymbolType.Shape }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      radius,
      vertices: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    ShapeCircleOps.updateDerivedFields(circle)
    return circle
  },

  createFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create circle, center is invalid`)
    if (!isValidNumber(partial.radius)) throw new Error(`Unable to create circle, radius is undefined`)
    const circle = ShapeCircleOps.create(partial.center as TPoint, partial.radius!, partial.style)
    if (partial.id) circle.id = partial.id
    return circle
  },

  updateDerivedFields(circle: TShapeCircle): void
  {
    circle.bounds = {
      x: circle.center.x - circle.radius,
      y: circle.center.y - circle.radius,
      height: circle.radius * 2,
      width: circle.radius * 2
    }
    const firstPoint: TPoint = { x: circle.center.x, y: circle.radius + circle.center.y }
    const perimeter = TWO_PI * circle.radius
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const vertices: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const rad = TWO_PI * (i / nbPoint)
      vertices.push(computeRotatedPoint(firstPoint, circle.center, rad))
    }
    circle.vertices = vertices
    circle.snapPoints = BoxOps.getSnapPoints(circle.bounds)
    circle.edges = vertices.map((p, i) => ({ p1: p, p2: vertices[(i + 1) % vertices.length] }))
  },

  overlaps(circle: TShapeCircle, box: TBox): boolean
  {
    return BoxOps.isContained(circle.bounds, box) ||
      BoxOps.getSides(box).some(seg => findIntersectBetweenSegmentAndCircle(seg, circle.center, circle.radius).length > 0)
  },

  createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle
  {
    const circle = ShapeCircleOps.create(origin, 0, style)
    circle.radius = computeDistance(circle.center, target)
    ShapeCircleOps.updateDerivedFields(circle)
    return circle
  },

  updateBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void
  {
    circle.radius = computeDistance(circle.center, target)
    ShapeCircleOps.updateDerivedFields(circle)
  },

  getSVGPath(circle: TShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  },
}
