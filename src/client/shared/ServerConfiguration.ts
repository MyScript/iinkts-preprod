/**
 * @group Client
 */
export type TScheme = "https" | "http"

/**
 * @group Client
 */
export type TServerHTTPConfiguration = {
  scheme: TScheme
  host: string
  applicationKey: string
  hmacKey: string | ((applicationKey: string) => Promise<string>)
  version?: string
}

/**
 * @group Client
 * @source
 */
export const DefaultServerHTTPConfiguration: TServerHTTPConfiguration = {
  scheme: "https",
  host: "cloud.myscript.com",
  applicationKey: "",
  hmacKey: "",
  version: "",
}

/**
 * @group Client
 */
export type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
  websocket: {
    pingEnabled: boolean
    pingDelay: number
    maxPingLostCount: number
    autoReconnect: boolean
    maxRetryCount: number
    fileChunkSize: number
    /** Queue `addStrokes()` calls locally while disconnected and replay them in order on reconnect. */
    offlineQueueEnabled: boolean
    /** Max number of queued addStrokes batches; further calls reject once reached. */
    offlineQueueMaxSize: number
    /** Delay in ms between reconnection attempts while offline. */
    reconnectDelay: number
    /** Give up reconnecting (and reject the queue) after this many failed attempts. */
    maxReconnectAttempts: number
  }
}

/**
 * @group Client
 * @source
 */
export const DefaultServerWebsocketConfiguration: TServerWebsocketConfiguration = {
  ...DefaultServerHTTPConfiguration,
  websocket: {
    pingEnabled: true,
    pingDelay: 15000,
    maxPingLostCount: 20,
    autoReconnect: true,
    maxRetryCount: 2,
    fileChunkSize: 300000,
    offlineQueueEnabled: true,
    offlineQueueMaxSize: 50,
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
  },
}

/**
 * Assert that server config has both scheme and host. Throws if either is missing.
 * @group Client
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

const isObject = (object: unknown): object is Record<string, unknown> => {
  return typeof object === "object" && object !== null && !Array.isArray(object)
}

/**
 * Returns a copy of `config` with the server credentials replaced by `[REDACTED]`, so a
 * configuration can be logged without leaking the application and HMAC keys.
 * @group Client
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
