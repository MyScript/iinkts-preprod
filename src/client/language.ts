import type { TPartialDeep } from "@/core"

import { assertServerConfig, serverUrl, type TServerHTTPConfiguration } from "./shared/ServerConfiguration"

/**
 * @group Client
 */
export async function getAvailableLanguageList(
  configuration: TPartialDeep<{
    server: TServerHTTPConfiguration
  }>
): Promise<{
  result: { [key: string]: string }
}> {
  assertServerConfig(configuration?.server, "Failed to get languages")
  const response = await fetch(serverUrl(configuration.server, "availableLanguageList"))
  return response.json()
}
