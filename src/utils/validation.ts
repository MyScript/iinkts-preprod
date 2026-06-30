/**
 * Validation utilities for common type checking and validation patterns
 * @group Utilities
 */

/**
 * Assert that server config has both scheme and host. Throws if either is missing.
 * @group Utilities
 */
export function assertServerConfig(
  server: { scheme?: string; host?: string } | undefined,
  errorPrefix: string
): asserts server is {
  scheme: string
  host: string
} {
  if (!server?.scheme || !server?.host) {
    throw new Error(`${errorPrefix}: configuration.server.scheme & configuration.server.host are required!`)
  }
}

/**
 * Check if two numbers are valid and finite
 * @group Utilities
 */
export function areValidCoordinates(x: number, y: number): boolean {
  return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)
}

/**
 * Check if a value is a valid number (not null, not undefined, not NaN, finite)
 * @group Utilities
 * @param x - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(x: unknown): boolean {
  if (x === undefined || x === null) {
    return false
  }
  return !isNaN(parseFloat(x.toString())) && isFinite(+x)
}
