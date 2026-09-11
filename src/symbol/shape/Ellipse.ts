import type { TPoint } from "@/core/geometry"
import { MatrixTransform, mergeSymbolTransform } from "@/core/geometry"
import { isValidPoint } from "@/core/geometry"
import { isValidNumber } from "@/core/math"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import type { TStyle } from "@/style"
import { mergeSymbolStyle } from "@/style"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"

import { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapeEllipse = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Ellipse
  style: TStyle
  center: TPoint
  radiusX: number
  radiusY: number
  orientation: number
}

/**
 * @group Symbol
 */
export const ShapeEllipseOps = {
  create(
    center: TPoint,
    radiusX: number,
    radiusY: number,
    orientation: number,
    style?: TPartialDeep<TStyle>
  ): TShapeEllipse {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const ellipse: TShapeEllipse = {
      type: SymbolType.Shape,
      kind: ShapeKind.Ellipse,
      id: `${SymbolType.Shape}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      radiusX,
      radiusY,
      orientation,
      transform: MatrixTransform.identity(),
    }
    return ellipse
  },

  createFromPartial(partial: TPartialDeep<TShapeEllipse>): TShapeEllipse {
    if (!isValidPoint(partial.center)) {
      throw new Error(`Unable to create ellipse, center is undefined`)
    }
    if (!isValidNumber(partial.radiusX)) {
      throw new Error(`Unable to create ellipse, radiusX is undefined`)
    }
    if (!isValidNumber(partial.radiusY)) {
      throw new Error(`Unable to create ellipse, radiusY is undefined`)
    }
    const ellipse = ShapeEllipseOps.create(
      partial.center as TPoint,
      partial.radiusX!,
      partial.radiusY!,
      partial.orientation || 0,
      partial.style
    )
    if (partial.id) {
      ellipse.id = partial.id
    }
    ellipse.transform = mergeSymbolTransform(partial.transform)
    return ellipse
  },

  createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeEllipse {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2,
    }
    const radiusX = Math.abs(origin.x - target.x) / 2
    const radiusY = Math.abs(origin.y - target.y) / 2
    return ShapeEllipseOps.create(center, radiusX, radiusY, 0, style)
  },

  updateBetweenPoints(ellipse: TShapeEllipse, origin: TPoint, target: TPoint): void {
    ellipse.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2,
    }
    ellipse.radiusX = Math.abs(origin.x - target.x) / 2
    ellipse.radiusY = Math.abs(origin.y - target.y) / 2
  },

  getSVGPath(ellipse: TShapeEllipse): string {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  },
}
