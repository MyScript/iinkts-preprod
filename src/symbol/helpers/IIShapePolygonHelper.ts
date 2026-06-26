import { TStyle, DefaultStyle } from "@/style"
import { PartialDeep, findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"
import { TPoint, isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { ShapeKind } from "@/symbol/geometry/IIShape"
import { TShapePolygon } from "@/symbol/geometry/IIShapePolygon"

/**
 * Helper functions for TShapePolygon plain type
 * @group Symbol
 */
export const IIShapePolygonHelper = {
  create(points: TPoint[], style?: PartialDeep<TStyle>): TShapePolygon
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const polygon: TShapePolygon = {
      type: SymbolType.Shape,
      kind: ShapeKind.Polygon,
      isClosed: true,
      id: `${ SymbolType.Shape }-${ createUUID() }`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      points,
      vertices: points,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      snapPoints: [],
      edges: [],
    }
    IIShapePolygonHelper.updateDerivedFields(polygon)
    return polygon
  },

  createFromPartial(partial: PartialDeep<TShapePolygon>): TShapePolygon
  {
    if (!partial?.points || partial?.points?.length < 3) throw new Error(`Unable to create polygon at least 3 points required`)
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a polygon, one or more points are invalid`)
    const polygon = IIShapePolygonHelper.create(partial.points as TPoint[], partial.style)
    if (partial.id) polygon.id = partial.id
    return polygon
  },

  updateDerivedFields(polygon: TShapePolygon): void
  {
    polygon.vertices = polygon.points
    polygon.bounds = BoxHelper.createFromPoints(polygon.points)
    polygon.snapPoints = BoxHelper.getSnapPoints(polygon.bounds)
    polygon.edges = polygon.points.map((p, i) => ({ p1: p, p2: polygon.points[(i + 1) % polygon.points.length] }))
  },

  overlaps(polygon: TShapePolygon, box: TBox): boolean
  {
    return BoxHelper.isContained(polygon.bounds, box) ||
      polygon.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },

  createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): TShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return IIShapePolygonHelper.create(points, style)
  },

  updateTriangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void
  {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    poly.modificationDate = Date.now()
    IIShapePolygonHelper.updateDerivedFields(poly)
  },

  createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): TShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    return IIShapePolygonHelper.create(points, style)
  },

  updateParallelogramBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void
  {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    poly.modificationDate = Date.now()
    IIShapePolygonHelper.updateDerivedFields(poly)
  },

  createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): TShapePolygon
  {
    const box = BoxHelper.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height },
    ]
    return IIShapePolygonHelper.create(points, style)
  },

  updateRectangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void
  {
    const box = BoxHelper.createFromPoints([origin, target])
    poly.points = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height },
    ]
    poly.modificationDate = Date.now()
    IIShapePolygonHelper.updateDerivedFields(poly)
  },

  createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): TShapePolygon
  {
    const box = BoxHelper.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x + box.width / 2, y: box.y },
      { x: box.x + box.width, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height },
      { x: box.x, y: box.y + box.height / 2 },
    ]
    return IIShapePolygonHelper.create(points, style)
  },

  updateRhombusBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void
  {
    const box = BoxHelper.createFromPoints([origin, target])
    poly.points = [
      { x: box.x + box.width / 2, y: box.y },
      { x: box.x + box.width, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height },
      { x: box.x, y: box.y + box.height / 2 },
    ]
    poly.modificationDate = Date.now()
    IIShapePolygonHelper.updateDerivedFields(poly)
  },
}
