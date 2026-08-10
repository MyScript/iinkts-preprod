import { computeHmac } from "@/utils"

import type { TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * Resolves the server configuration's `hmacKey` (a literal string or an async resolver
 * function) and computes the HMAC signature for `data`, or returns `undefined` if no HMAC key
 * is configured.
 */
export async function resolveHmac(server: TServerHTTPConfiguration, message: string): Promise<string | undefined> {
  if (!server.hmacKey) {
    return undefined
  }
  let hmacKey: string
  if (typeof server.hmacKey === "string") {
    hmacKey = server.hmacKey
  } else if (typeof server.hmacKey === "function") {
    hmacKey = await server.hmacKey(server.applicationKey)
  } else {
    throw new Error("HMAC key is not a string nor a function")
  }
  if (!hmacKey) {
    return undefined
  }
  return computeHmac(message, server.applicationKey, hmacKey)
}
