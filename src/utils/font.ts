import { TServerHTTPConfiguration } from "../recognizer"
import { PartialDeep } from "./types"

/**
 * @group Utils
 */
export async function getAvailableFontList(configuration: PartialDeep<{ server: TServerHTTPConfiguration, recognition: { lang: string }}>): Promise<Array<string>>
{
  if (!configuration?.server?.scheme && !configuration?.server?.host) {
    return Promise.reject("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
  }
  if (!configuration?.recognition?.lang) {
    return Promise.reject("Failed to get fonts: configuration.recognition.lang is required!")
  }
  const serverConfig = configuration.server
  const response = await fetch(`${ serverConfig.scheme }://${ serverConfig.host }/api/v4.0/iink/font/google/language/` + configuration.recognition.lang)
  const { result } = await response.json()
  return result.sort()
}
