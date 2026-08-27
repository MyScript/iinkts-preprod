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
