import { SELECTION_MARGIN } from "@/Constants"
import type { TStyle} from "@/style";
import { DefaultStyle } from "@/style"
import type { TPartialDeep} from "@/utils";
import { computePointOnEllipse, computeEllipseRadiusAverage, findIntersectionBetween2Segment, isValidNumber, TWO_PI } from "@/utils"
import { createUUID } from "@/utils/uuid"
import type { TPoint} from "@/symbol/base/Point";
import { isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { ShapeKind } from "@/symbol/geometry/IIShape"
import type { TShapeEllipse } from "@/symbol/geometry/IIShapeEllipse"

/**
 * Helper functions for TShapeEllipse plain type
 * @group Symbol
 */
export const IIShapeEllipseHelper = {
  create(center: TPoint, radiusX: number, radiusY: number, orientation: number, style?: TPartialDeep<TStyle>): TShapeEllipse
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const ellipse: TShapeEllipse = {
      type: SymbolType.Shape,
      kind: ShapeKind.Ellipse,
      isClosed: true,
      id: `${ SymbolType.Shape }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      center,
      radiusX,
      radiusY,
      orientation,
      vertices: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIShapeEllipseHelper.updateDerivedFields(ellipse)
    return ellipse
  },

  createFromPartial(partial: TPartialDeep<TShapeEllipse>): TShapeEllipse
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create ellipse, center is undefined`)
    if (!isValidNumber(partial.radiusX)) throw new Error(`Unable to create ellipse, radiusX is undefined`)
    if (!isValidNumber(partial.radiusY)) throw new Error(`Unable to create ellipse, radiusY is undefined`)
    const ellipse = IIShapeEllipseHelper.create(partial.center as TPoint, partial.radiusX!, partial.radiusY!, partial.orientation || 0, partial.style)
    if (partial.id) ellipse.id = partial.id
    return ellipse
  },

  updateDerivedFields(ellipse: TShapeEllipse): void
  {
    const perimeter = TWO_PI * computeEllipseRadiusAverage(ellipse.radiusX, ellipse.radiusY)
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const vertices: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const theta = TWO_PI * (i / nbPoint)
      vertices.push(computePointOnEllipse(ellipse.center, ellipse.radiusX, ellipse.radiusY, ellipse.orientation, theta))
    }
    ellipse.vertices = vertices
    ellipse.bounds = BoxHelper.createFromPoints(vertices)
    ellipse.snapPoints = BoxHelper.getSnapPoints(ellipse.bounds)
    ellipse.edges = vertices.map((p, i) => ({ p1: p, p2: vertices[(i + 1) % vertices.length] }))
  },

  overlaps(ellipse: TShapeEllipse, box: TBox): boolean
  {
    return BoxHelper.isContained(ellipse.bounds, box) ||
      ellipse.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },

  createBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeEllipse
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    const radiusX = Math.abs(origin.x - target.x) / 2
    const radiusY = Math.abs(origin.y - target.y) / 2
    return IIShapeEllipseHelper.create(center, radiusX, radiusY, 0, style)
  },

  updateBetweenPoints(ellipse: TShapeEllipse, origin: TPoint, target: TPoint): void
  {
    ellipse.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    ellipse.radiusX = Math.abs(origin.x - target.x) / 2
    ellipse.radiusY = Math.abs(origin.y - target.y) / 2
    IIShapeEllipseHelper.updateDerivedFields(ellipse)
  },
}
