import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import { computeRotatedPoint, convertDegreeToRadian } from "@/utils"

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
