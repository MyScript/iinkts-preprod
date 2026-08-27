import type { TPartialDeep } from "@/core/std"

import { assertServerConfig, type TServerHTTPConfiguration } from "./ServerConfiguration"

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
    const response = await fetch(`${configuration.server.scheme}://${configuration.server.host}/api/v4.0/iink/version`)
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
