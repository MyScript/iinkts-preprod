import { TPoint } from "../../symbol"

/**
 * @group Renderer
 * @summary Shared geometry utility functions for renderers
 *
 * Common mathematical and geometric helper functions used by both
 * Canvas and SVG renderers for geometric calculations.
 */

/**
 * Calculate rotation angle for ellipse arc
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number
{
  let returnedAngle = ((angle + Math.PI) % (Math.PI * 2)) - Math.PI
  if (returnedAngle < -Math.PI) {
    returnedAngle += Math.PI * 2
  }
  return returnedAngle
}

/**
 * Calculate ellipse arc points
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
export function calculateEllipseArcPoints(
  centerPoint: TPoint,
  maxRadius: number,
  minRadius: number,
  orientation: number,
  startAngle: number,
  sweepAngle: number,
  angleStep: number = 0.02
): TPoint[]
{
  const z1 = Math.cos(orientation) * maxRadius
  const z2 = Math.cos(orientation) * minRadius
  const z3 = Math.sin(orientation) * maxRadius
  const z4 = Math.sin(orientation) * minRadius
  const n = Math.floor(Math.abs(sweepAngle) / angleStep)
  const points: TPoint[] = []

  for (let i = 0; i <= n; i++) {
    const angle = startAngle + ((i / n) * sweepAngle)
    const alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius)
    const cosAlpha = Math.cos(alpha)
    const sinAlpha = Math.sin(alpha)
    const x = (centerPoint.x + (z1 * cosAlpha)) - (z4 * sinAlpha)
    const y = (centerPoint.y + (z2 * sinAlpha)) + (z3 * cosAlpha)
    points.push({ x, y })
  }

  return points
}
