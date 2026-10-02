import { isVersionSuperiorOrEqual } from "@/core/std"
import { LoggerCategory, LoggerManager } from "@/logger"

import { parseApiError } from "./ClientApiError"
import { ClientError, mapErrorCodeToMessage } from "./ClientError"
import { resolveHmac } from "./HmacAuth"
import type { TServerHTTPConfiguration } from "./ServerConfiguration"

const logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

/**
 * @group Client
 */
export type THTTPRecognitionRequest = {
  url: string
  server: TServerHTTPConfiguration
  /** Value of the `Accept` header */
  accept: string
  data: unknown
}

/**
 * @group Client
 * @summary Reads a recognition response body according to its content type
 */
export async function parseRecognitionResponse(response: Response): Promise<unknown> {
  switch (response.headers.get("content-type")) {
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "image/png":
    case "image/jpeg":
      return response.blob()
    case "application/json":
      return response.json()
    case "application/vnd.myscript.jiix":
      return response
        .clone()
        .json()
        .catch(() => response.text())
    default:
      return response.text()
  }
}

async function buildRecognitionHeaders(
  server: TServerHTTPConfiguration,
  accept: string,
  body: string
): Promise<Headers> {
  const headers = new Headers()
  headers.append("Accept", accept)
  headers.append("applicationKey", server.applicationKey)
  try {
    const hmac = await resolveHmac(server, body)
    if (hmac) {
      headers.append("hmac", hmac)
    }
  } catch (error) {
    // The request still goes out unsigned: the server's answer says what is wrong with the key
    logger.error("buildRecognitionHeaders.computeHmac", error instanceof Error ? error.message : String(error))
  }
  headers.append("Content-Type", "application/json")
  if (server.version && isVersionSuperiorOrEqual(server.version, "2.0.4")) {
    headers.append("myscript-client-name", "iink-ts")
    headers.append("myscript-client-version", "1.0.0-buildVersion")
  }
  return headers
}

/**
 * @group Client
 * @summary Posts a recognition request and reads its response
 * @remarks `data` is serialized once: the HMAC signs exactly the body sent. Adapt the configuration it holds to the server version before calling.
 * @throws the API error (`{ code, message }`) of a non-2xx response; see {@link toRecognitionError}
 */
export async function postRecognition({ url, server, accept, data }: THTTPRecognitionRequest): Promise<unknown> {
  const body = JSON.stringify(data)
  const headers = await buildRecognitionHeaders(server, accept, body)
  const response = await fetch(new Request(url, { method: "POST", headers, body, credentials: "omit" }))
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return parseRecognitionResponse(response)
}

/**
 * @group Client
 * @summary Turns what a failed {@link postRecognition} threw into the error reported to the caller
 * @remarks An error without code never reached the server (network, CORS): it reads as a connection failure.
 */
export function toRecognitionError(error: unknown): Error {
  const code = readField(error, "code")
  if (!code) {
    return new Error(ClientError.CANT_ESTABLISH)
  }
  const message = readField(error, "message")
  const serverMessage = typeof message === "string" && message ? message : ClientError.UNKNOWN
  return new Error(mapErrorCodeToMessage(String(code)) ?? serverMessage)
}

function readField(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value ? Reflect.get(value, key) : undefined
}
