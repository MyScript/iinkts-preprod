import type { TSymbol } from "@/symbol"
import { createSymbolsFromPartial } from "@/symbol-utils"

/**
 * Everything needed to resume a session: the canvas content and, when the server could export it,
 * the server session as a `.iink` package. Saved as a `.iinkts` JSON file.
 * @group Manager
 */
export type TSessionEnvelope = {
  format: "iinkts-session"
  /** Raised when a change of the file would mislead an older library reading it */
  formatVersion: 1
  /** Version of iinkTS that wrote it */
  libVersion: string
  /** ISO date it was written */
  createdAt: string
  symbols: TSymbol[]
  /** Server session; absent when the server is older than 4.6.0, the strokes are then sent again */
  package?: {
    /** Part the content is written in, opened once the package is imported */
    partId: string
    /** `.iink` package, base64 encoded */
    data: string
  }
}

const SESSION_FORMAT: TSessionEnvelope["format"] = "iinkts-session"
const SESSION_FORMAT_VERSION: TSessionEnvelope["formatVersion"] = 1

/**
 * @group Manager
 * @summary A session envelope written now by this version of the library
 */
export function createSessionEnvelope(
  symbols: TSymbol[],
  sessionPackage?: TSessionEnvelope["package"]
): TSessionEnvelope {
  return {
    format: SESSION_FORMAT,
    formatVersion: SESSION_FORMAT_VERSION,
    libVersion: __IINK_VERSION__,
    createdAt: new Date().toISOString(),
    symbols,
    package: sessionPackage,
  }
}

/**
 * @group Manager
 * @summary The `.iinkts` file content of a session
 */
export function serializeSession(envelope: TSessionEnvelope): string {
  return JSON.stringify(envelope)
}

const isEnvelopeHeader = (value: unknown): value is { format: string; formatVersion: number } =>
  typeof value === "object" && value !== null && "format" in value && value.format === SESSION_FORMAT

// The symbols are checked by rebuilding them; the package is optional
const isEnvelope = (header: { formatVersion: number }): header is TSessionEnvelope =>
  "symbols" in header && Array.isArray(header.symbols)

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/**
 * @group Manager
 * @summary The session of a `.iinkts` file, its symbols rebuilt
 * @throws when the text is not a session file, or one of a newer format
 */
export function parseSession(text: string): TSessionEnvelope {
  const value = parseJson(text)
  if (!isEnvelopeHeader(value)) {
    throw new Error("Not an iinkTS session file")
  }
  if (!isEnvelope(value)) {
    throw new Error("Not an iinkTS session file")
  }
  if (value.formatVersion > SESSION_FORMAT_VERSION) {
    throw new Error(
      `Session file format ${value.formatVersion} is newer than this library reads (${SESSION_FORMAT_VERSION})`
    )
  }
  return { ...value, symbols: rebuildSymbols(value.symbols) }
}

/**
 * Symbols built again from their data. Building one dates it now: the dates it was saved with are
 * put back, as they tell what changed since and when each stroke was written.
 */
function rebuildSymbols(saved: TSymbol[]): TSymbol[] {
  return createSymbolsFromPartial(saved).map((symbol, i) => ({
    ...symbol,
    creationTime: saved[i].creationTime,
    modificationDate: saved[i].modificationDate,
  }))
}
