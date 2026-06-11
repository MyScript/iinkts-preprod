/**
 * @group Utilities
 */
export function isValidNumber(x: unknown): boolean
{
  if (x === undefined || x === null) return false
  return !isNaN(parseFloat(x.toString())) && isFinite(+x)
}
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
