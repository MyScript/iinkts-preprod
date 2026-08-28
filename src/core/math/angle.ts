/**
 * @group Core/Math
 */
export const TWO_PI = 2 * Math.PI

/**
 * @group Core/Math
 */
export function convertRadianToDegree(radian: number): number {
  return +(((radian % TWO_PI) / Math.PI) * 180).toFixed(4)
}

/**
 * @group Core/Math
 */
export function convertDegreeToRadian(degree: number): number {
  return +(((degree % 360) / 180) * Math.PI).toFixed(4)
}

/**
 * Calculate rotation angle for ellipse arc
 * @group Core/Math
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  let returnedAngle = ((angle + Math.PI) % TWO_PI) - Math.PI
  if (returnedAngle < -Math.PI) {
    returnedAngle += TWO_PI
  }
  return returnedAngle
}
