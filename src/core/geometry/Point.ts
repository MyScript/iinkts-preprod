import { isValidNumber } from "@/core/math"
import type { TPartialDeep } from "@/core/std"

/**
 * @group Core/Geometry
 */
export type TPoint = {
  x: number
  y: number
}

/**
 * @group Core/Geometry
 */
export type TPointer = TPoint & {
  t: number
  p: number
}

/**
 * @group Core/Geometry
 */
export type TSegment = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Core/Geometry
 */
export function isValidPoint(p?: TPartialDeep<TPoint>): boolean {
  if (!p) {
    return false
  }
  if (!isValidNumber(p.x)) {
    return false
  }
  if (!isValidNumber(p.y)) {
    return false
  }
  return true
}
