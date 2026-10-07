import type { TPartialDeep } from "@/core"

import { assertServerConfig, serverUrl, type TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export type TApiInfos = {
  version: string
  gitCommit: string
  nativeVersion: string
}

/**
 * @group Client
 */
export async function getApiInfos(
  configuration?: TPartialDeep<{
    server: TServerHTTPConfiguration
  }>
): Promise<TApiInfos> {
  try {
    assertServerConfig(configuration?.server, "Failed to get infos")
    const response = await fetch(serverUrl(configuration.server, "version"))
    if (response.ok) {
      const version = (await response.json()) as TApiInfos
      return version
    } else {
      //latest version published before this endpoint
      return {
        version: "3.1.3",
        gitCommit: "unknown",
        nativeVersion: "<=3.1.1",
      }
    }
  } catch {
    //latest version published before this endpoint
    return {
      version: "3.1.3",
      gitCommit: "7e148bd566438ca77dc83cb4edcc6ed0f51a8a15",
      nativeVersion: "<=3.1.1",
    }
  }
}

/**
 * @group Client
 * @summary The server version, fetched once and stored in the configuration
 */
export async function ensureServerVersion(configuration: { server: TServerHTTPConfiguration }): Promise<string> {
  if (!configuration.server.version) {
    configuration.server.version = (await getApiInfos(configuration)).version
  }
  return configuration.server.version
}
