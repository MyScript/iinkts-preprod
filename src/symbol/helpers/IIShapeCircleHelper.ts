import { SELECTION_MARGIN } from "@/Constants"
import type { TStyle} from "@/style";
import { DefaultStyle } from "@/style"
import type { TPartialDeep} from "@/utils";
import { findIntersectBetweenSegmentAndCircle, computeRotatedPoint, computeDistance, TWO_PI } from "@/utils"
import { isValidNumber } from "@/utils"
import { createUUID } from "@/utils/uuid"
import type { TPoint} from "@/symbol/base/Point";
import { isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { ShapeKind } from "@/symbol/geometry/IIShape"
import type { TShapeCircle } from "@/symbol/geometry/IIShapeCircle"

/**
 * Helper functions for TShapeCircle plain type
 * @group Symbol
 */
export const IIShapeCircleHelper = {
  create(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const circle: TShapeCircle = {
      type: SymbolType.Shape,
      kind: ShapeKind.Circle,
      isClosed: true,
      id: `${ SymbolType.Shape }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      center,
      radius,
      vertices: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIShapeCircleHelper.updateDerivedFields(circle)
    return circle
  },

  createFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create circle, center is invalid`)
    if (!isValidNumber(partial.radius)) throw new Error(`Unable to create circle, radius is undefined`)
    const circle = IIShapeCircleHelper.create(partial.center as TPoint, partial.radius!, partial.style)
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
    circle.snapPoints = BoxHelper.getSnapPoints(circle.bounds)
    circle.edges = vertices.map((p, i) => ({ p1: p, p2: vertices[(i + 1) % vertices.length] }))
  },

  overlaps(circle: TShapeCircle, box: TBox): boolean
  {
    return BoxHelper.isContained(circle.bounds, box) ||
      BoxHelper.getSides(box).some(seg => findIntersectBetweenSegmentAndCircle(seg, circle.center, circle.radius).length > 0)
  },

  createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle
  {
    const circle = IIShapeCircleHelper.create(origin, 0, style)
    circle.radius = computeDistance(circle.center, target)
    IIShapeCircleHelper.updateDerivedFields(circle)
    return circle
  },

  updateBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void
  {
    circle.radius = computeDistance(circle.center, target)
    IIShapeCircleHelper.updateDerivedFields(circle)
  },
}
