import type { TPartialDeep } from "@/core/std"

import { assertServerConfig, type TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export async function getAvailableFontList(
  configuration: TPartialDeep<{
    server: TServerHTTPConfiguration
    recognition: { lang: string }
  }>
): Promise<Array<string>> {
  assertServerConfig(configuration?.server, "Failed to get fonts")
  if (!configuration?.recognition?.lang) {
    throw new Error("Failed to get fonts: configuration.recognition.lang is required!")
  }
  const response = await fetch(
    `${configuration.server.scheme}://${configuration.server.host}/api/v4.0/iink/font/google/language/` +
      configuration.recognition.lang
  )
  const { result } = await response.json()
  return result.sort()
}
