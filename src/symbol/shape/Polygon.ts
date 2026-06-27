import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TPartialDeep } from "@/utils"
import { findIntersectionBetween2Segment } from "@/utils"
import { createUUID } from "@/utils/uuid"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import { isValidPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import type { TBaseSymbol } from "@/symbol/Symbol"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxHelper } from "@/symbol/primitives/Box"
import { ShapeKind } from "./Shape"

/**
 * @group Symbol
 */
export type TShapePolygon = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Polygon
  isClosed: true
  style: TStyle
  selected: boolean
  deleting: boolean
  points: TPoint[]
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 * @group Utilities
 */
export const ShapePolygonHelper = {
  create(points: TPoint[], style?: TPartialDeep<TStyle>): TShapePolygon
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
    ShapePolygonHelper.updateDerivedFields(polygon)
    return polygon
  },

  createFromPartial(partial: TPartialDeep<TShapePolygon>): TShapePolygon
  {
    if (!partial?.points || partial?.points?.length < 3) throw new Error(`Unable to create polygon at least 3 points required`)
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a polygon, one or more points are invalid`)
    const polygon = ShapePolygonHelper.create(partial.points as TPoint[], partial.style)
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

  createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return ShapePolygonHelper.create(points, style)
  },

  updateTriangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void
  {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    poly.modificationDate = Date.now()
    ShapePolygonHelper.updateDerivedFields(poly)
  },

  createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    return ShapePolygonHelper.create(points, style)
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
    ShapePolygonHelper.updateDerivedFields(poly)
  },

  createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon
  {
    const box = BoxHelper.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height },
    ]
    return ShapePolygonHelper.create(points, style)
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
    ShapePolygonHelper.updateDerivedFields(poly)
  },

  createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon
  {
    const box = BoxHelper.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x + box.width / 2, y: box.y },
      { x: box.x + box.width, y: box.y + box.height / 2 },
      { x: box.x + box.width / 2, y: box.y + box.height },
      { x: box.x, y: box.y + box.height / 2 },
    ]
    return ShapePolygonHelper.create(points, style)
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
    ShapePolygonHelper.updateDerivedFields(poly)
  },
}
