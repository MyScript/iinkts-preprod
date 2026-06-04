/**
 * Validation utilities for common type checking and validation patterns
 * @group Utilities
 */

/**
 * Check if value is a plain object (not null, not array)
 * @group Utilities
 */
export function isPlainObject(value: unknown): value is Record<string, unknown>
{
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Check if two numbers are valid and finite
 * @group Utilities
 */
export function areValidCoordinates(x: number, y: number): boolean
{
  return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)
}

/**
 * Check if a distance value is valid (not NaN, finite, and non-negative)
 * @group Utilities
 * @param distance - Distance value to validate
 * @returns True if distance is a valid non-negative number
 */
export function isValidDistance(distance: number): boolean
{
  return !isNaN(distance) && isFinite(distance) && distance >= 0
}

/**
 * Check if an angle value is valid (not NaN, finite)
 * @group Utilities
 * @param angle - Angle value to validate (in radians or degrees)
 * @returns True if angle is a valid number
 */
export function isValidAngle(angle: number): boolean
{
  return !isNaN(angle) && isFinite(angle)
}

/**
 * Check if a value is a valid number (not null, not undefined, not NaN, finite)
 * @group Utilities
 * @param x - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(x: unknown): boolean
{
  if (x === undefined || x === null) return false
  return !isNaN(parseFloat(x.toString())) && isFinite(+x)
}
