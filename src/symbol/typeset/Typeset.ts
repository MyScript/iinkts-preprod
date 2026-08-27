import type { TBox } from "@/core/geometry"
import type { TPoint, TSegment } from "@/core/geometry"
import { BoxOps } from "@/core/geometry"
import {
  computeRotatedPoint,
  convertDegreeToRadian,
  findIntersectionBetween2Segment,
  isPointInsidePolygon,
} from "@/utils"

/**
 * @group Symbol
 */
export type TRotation = {
  degree: number
  center: TPoint
}

/**
 * @group Symbol
 */
export type TTypesetChild = {
  id: string
  label: string
  color: string
  bounds: TBox
  fontSize: number
  fontWeight: "normal" | "bold"
}

/**
 * @group Symbol
 */
export function computeTypesetVertices(bounds: TBox, rotation?: TRotation): TPoint[] {
  if (rotation) {
    const rad = convertDegreeToRadian(-rotation.degree)
    return BoxOps.getCorners(bounds).map((p) => computeRotatedPoint(p, rotation.center, rad))
  }
  return BoxOps.getCorners(bounds)
}

/**
 * @group Symbol
 */
export function computeTypesetSnapPoints(bounds: TBox, point: TPoint, rotation?: TRotation): TPoint[] {
  const yMax = bounds.y + bounds.height
  const xMax = bounds.x + bounds.width
  const offsetY = yMax - point.y
  const points: TPoint[] = [
    { x: bounds.x, y: bounds.y + offsetY },
    { x: xMax, y: bounds.y + offsetY },
    { x: xMax, y: yMax - offsetY },
    { x: bounds.x, y: yMax - offsetY },
    BoxOps.getCenter(bounds),
  ]
  if (rotation) {
    const rad = convertDegreeToRadian(-rotation.degree)
    return points.map((p) => computeRotatedPoint(p, rotation.center, rad))
  }
  return points
}

/**
 * @group Symbol
 */
export function computeClosedEdges(vertices: TPoint[]): TSegment[] {
  return vertices.map((p, i) => ({
    p1: p,
    p2: vertices[(i + 1) % vertices.length],
  }))
}

/**
 * Whether a typeset symbol (its own `vertices`/`edges`, from {@link computeTypesetVertices}/
 * {@link computeClosedEdges}) overlaps `box` — either a vertex lands inside `box`, or one of its
 * edges crosses one of `box`'s sides.
 * @group Symbol
 */
export function typesetOverlapsBox(vertices: TPoint[], edges: TSegment[], box: TBox): boolean {
  return (
    vertices.some((p) => BoxOps.containsPoint(box, p)) ||
    edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
  )
}

/**
 * Filters `children` (Text chars / Math elements — anything shaped like {@link TTypesetChild})
 * to those whose (possibly rotated) bounds contain at least one of `points`.
 * @group Symbol
 */
export function computeChildrenOverlaps<T extends TTypesetChild>(
  children: T[],
  points: TPoint[],
  rotation?: TRotation
): T[] {
  return children.filter((c) => {
    const corners = computeTypesetVertices(c.bounds, rotation)
    return points.some((p) => isPointInsidePolygon(p, corners))
  })
}
