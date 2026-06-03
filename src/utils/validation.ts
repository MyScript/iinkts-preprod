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
