import { convertDegreeToRadian, computeRotatedPoint } from "@/utils"
import type { TPoint, TSegment } from "@/symbol/base/Point"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"

export type TRotation = {
  degree: number
  center: TPoint
}

export function computeTypesetVertices(bounds: TBox, rotation?: TRotation): TPoint[]
{
  if (rotation) {
    const rad = convertDegreeToRadian(-rotation.degree)
    return BoxHelper.getCorners(bounds).map(p => computeRotatedPoint(p, rotation.center, rad))
  }
  return BoxHelper.getCorners(bounds)
}

export function computeTypesetSnapPoints(bounds: TBox, point: TPoint, rotation?: TRotation): TPoint[]
{
  const yMax = bounds.y + bounds.height
  const xMax = bounds.x + bounds.width
  const offsetY = yMax - point.y
  const points: TPoint[] = [
    { x: bounds.x, y: bounds.y + offsetY },
    { x: xMax, y: bounds.y + offsetY },
    { x: xMax, y: yMax - offsetY },
    { x: bounds.x, y: yMax - offsetY },
    BoxHelper.getCenter(bounds)
  ]
  if (rotation) {
    const rad = convertDegreeToRadian(-rotation.degree)
    return points.map(p => computeRotatedPoint(p, rotation.center, rad))
  }
  return points
}

export function computeClosedEdges(vertices: TPoint[]): TSegment[]
{
  return vertices.map((p, i) => ({ p1: p, p2: vertices[(i + 1) % vertices.length] }))
}
