import { MatrixTransform, mergeSymbolTransform } from "@/core/geometry"
import { isValidPoint, type TPoint } from "@/core/geometry"
import { computeDistance } from "@/core/geometry"
import { isValidNumber } from "@/core/math"
import { createUUID } from "@/core/std"
import { type TPartialDeep } from "@/core/std"
import { mergeSymbolStyle, type TStyle } from "@/style"
import { SymbolType, type TBaseSymbol } from "@/symbol/Symbol"

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
}

/**
 * @group Symbol
 */
export const ShapeCircleOps = {
  create(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const circle: TShapeCircle = {
      type: SymbolType.Shape,
      kind: ShapeKind.Circle,
      id: `${SymbolType.Shape}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      radius,
      transform: MatrixTransform.identity(),
    }
    return circle
  },

  createFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle {
    if (!isValidPoint(partial.center)) {
      throw new Error(`Unable to create circle, center is invalid`)
    }
    if (!isValidNumber(partial.radius)) {
      throw new Error(`Unable to create circle, radius is undefined`)
    }
    const circle = ShapeCircleOps.create(partial.center as TPoint, partial.radius!, partial.style)
    if (partial.id) {
      circle.id = partial.id
    }
    circle.transform = mergeSymbolTransform(partial.transform)
    return circle
  },

  createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle {
    const circle = ShapeCircleOps.create(origin, 0, style)
    circle.radius = computeDistance(circle.center, target)
    return circle
  },

  updateBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void {
    circle.radius = computeDistance(circle.center, target)
  },

  getSVGPath(circle: TShapeCircle): string {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  },
}
