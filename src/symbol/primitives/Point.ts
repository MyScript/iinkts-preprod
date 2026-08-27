import { isValidNumber } from "@/core/math"
import type { TPartialDeep } from "@/core/std"

/**
 * @group Symbol
 */
export type TPoint = {
  x: number
  y: number
}

/**
 * @group Symbol
 */
export type TPointer = TPoint & {
  t: number
  p: number
}

/**
 * @group Symbol
 */
export type TSegment = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Symbol
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
