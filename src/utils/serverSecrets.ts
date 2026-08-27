/**
 * Left behind by IIC-1961 when `object.ts` descended to `core/std`: this helper speaks server
 * configuration, so IIC-1964 moves it into `client` rather than into `core`.
 */
const isObject = (object: unknown): object is Record<string, unknown> => {
  return typeof object === "object" && object !== null && !Array.isArray(object)
}

/**
 * @group Utilities
 */
export const redactServerSecrets = (config: unknown): unknown => {
  if (!isObject(config) || !isObject(config.server)) {
    return config
  }
  const server: Record<string, unknown> = { ...config.server }
  if ("hmacKey" in server) {
    server.hmacKey = "[REDACTED]"
  }
  if ("applicationKey" in server) {
    server.applicationKey = "[REDACTED]"
  }
  return { ...config, server }
}
