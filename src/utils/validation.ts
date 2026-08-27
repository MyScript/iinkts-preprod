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
