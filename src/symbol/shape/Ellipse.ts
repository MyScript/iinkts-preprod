import { SELECTION_MARGIN } from "@/Constants"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import { isValidPoint } from "@/symbol/primitives/Point"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TPartialDeep } from "@/utils"
import {
  computeEllipseRadiusAverage,
  computePointOnEllipse,
  findIntersectionBetween2Segment,
  isValidNumber,
  TWO_PI,
} from "@/utils"
import { createUUID } from "@/utils/uuid"

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
  vertices: TPoint[]
  bounds: TOBB
  snapPoints: TPoint[]
  edges: TSegment[]
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
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
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
      vertices: [],
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      snapPoints: [],
      edges: [],
    }
    ShapeEllipseOps.updateDerivedFields(ellipse)
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
    return ellipse
  },

  updateDerivedFields(ellipse: TShapeEllipse): void {
    const perimeter = TWO_PI * computeEllipseRadiusAverage(ellipse.radiusX, ellipse.radiusY)
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const vertices: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const theta = TWO_PI * (i / nbPoint)
      vertices.push(computePointOnEllipse(ellipse.center, ellipse.radiusX, ellipse.radiusY, ellipse.orientation, theta))
    }
    ellipse.vertices = vertices
    ellipse.bounds = OBBOps.createFromPoints(vertices)
    ellipse.snapPoints = OBBOps.getSnapPoints(ellipse.bounds)
    ellipse.edges = vertices.map((p, i) => ({
      p1: p,
      p2: vertices[(i + 1) % vertices.length],
    }))
  },

  overlaps(ellipse: TShapeEllipse, box: TBox): boolean {
    return (
      OBBOps.isContained(ellipse.bounds, box) ||
      ellipse.edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
    )
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
    ShapeEllipseOps.updateDerivedFields(ellipse)
  },

  getSVGPath(ellipse: TShapeEllipse): string {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  },
}
