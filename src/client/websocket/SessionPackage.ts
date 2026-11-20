import { isVersionSuperiorOrEqual } from "@/core"

// First server version answering exportPackage and importPackage
const SESSION_PACKAGE_SERVER_VERSION = "4.6.0"

/**
 * Whether a server of this version exports and imports the session as a `.iink` package. An unknown
 * version answers no.
 * @group Client
 */
export function supportsSessionPackage(serverVersion: string | undefined): boolean {
  return !!serverVersion && isVersionSuperiorOrEqual(serverVersion, SESSION_PACKAGE_SERVER_VERSION)
}
