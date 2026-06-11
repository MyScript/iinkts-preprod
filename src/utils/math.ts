/**
 * @group Utilities
 */
export function isBetween(val: number, min: number, max: number): boolean
{
  return val >= min && val <= max
}

/**
 * @group Utilities
 */
export function computeAverage(arr: number[]): number
{
  return arr.reduce((p, c) => p + c, 0) / (arr.length || 1)
}

/**
 * @group Utilities
 * @summary Compute approximate average radius of an ellipse
 * @remarks Computes sqrt((radiusX^2 + radiusY^2) / 2) - a geometric average
 * used for ellipse perimeter and arc length approximations
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 * @returns Approximate average radius
 */
export function computeEllipseRadiusAverage(radiusX: number, radiusY: number): number
{
  return Math.sqrt((radiusX ** 2 + radiusY ** 2) / 2)
}
