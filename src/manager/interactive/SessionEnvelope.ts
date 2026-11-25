import type { THistoryStack, TIIHistoryChanges } from "@/history"
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
  /** Undo/redo steps and where the history stood; absent from files written before it was kept */
  history?: THistoryStack<TIIHistoryChanges>
}

const SESSION_FORMAT: TSessionEnvelope["format"] = "iinkts-session"
const SESSION_FORMAT_VERSION: TSessionEnvelope["formatVersion"] = 1

/**
 * @group Manager
 * @summary A session envelope written now by this version of the library
 */
export function createSessionEnvelope(
  symbols: TSymbol[],
  sessionPackage?: TSessionEnvelope["package"],
  history?: TSessionEnvelope["history"]
): TSessionEnvelope {
  return {
    format: SESSION_FORMAT,
    formatVersion: SESSION_FORMAT_VERSION,
    libVersion: __IINK_VERSION__,
    createdAt: new Date().toISOString(),
    symbols,
    package: sessionPackage,
    history,
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
  return { ...value, symbols: rebuildSymbols(value.symbols), history: parseHistory(value.history) }
}

/**
 * @group Manager
 * @summary The history with its symbols rebuilt; none when it can not be read, as the content
 * still can: the session then opens with an empty history
 */
export function parseHistory(history: unknown): TSessionEnvelope["history"] {
  if (!isHistoryStack(history)) {
    return undefined
  }
  try {
    return { stack: history.stack.map(rebuildChanges), stackIndex: history.stackIndex }
  } catch {
    return undefined
  }
}

const isHistoryStack = (value: unknown): value is THistoryStack<TIIHistoryChanges> =>
  typeof value === "object" &&
  value !== null &&
  "stack" in value &&
  Array.isArray(value.stack) &&
  "stackIndex" in value &&
  typeof value.stackIndex === "number"

/** One undo/redo step with its symbols rebuilt; the fields it does not have stay absent */
function rebuildChanges(changes: TIIHistoryChanges): TIIHistoryChanges {
  const rebuilt: TIIHistoryChanges = { ...changes }
  if (changes.added) {
    rebuilt.added = rebuildSymbols(changes.added)
  }
  if (changes.erased) {
    rebuilt.erased = rebuildSymbols(changes.erased)
  }
  if (changes.updated) {
    const before = rebuildSymbols(changes.updated.map((pair) => pair.before))
    const after = rebuildSymbols(changes.updated.map((pair) => pair.after))
    rebuilt.updated = before.map((symbol, i) => ({ before: symbol, after: after[i] }))
  }
  if (changes.replaced) {
    rebuilt.replaced = {
      oldSymbols: rebuildSymbols(changes.replaced.oldSymbols),
      newSymbols: rebuildSymbols(changes.replaced.newSymbols),
    }
  }
  if (changes.order) {
    rebuilt.order = { ...changes.order, symbols: rebuildSymbols(changes.order.symbols) }
  }
  return rebuilt
}

/**
 * @group Manager
 * @summary Symbols written as JSON, rebuilt with the dates they were saved with
 */
export function parseSymbols(text: string): TSymbol[] {
  const value: unknown = JSON.parse(text)
  if (!Array.isArray(value)) {
    throw new Error("Not a list of symbols")
  }
  return rebuildSymbols(value)
}

/**
 * @group Manager
 * @summary The content a page wrote in the browser: its symbols and history, rebuilt
 * @remarks An entry written before the history was kept holds the symbols alone
 */
export function parseSavedContent(text: string): { symbols: TSymbol[]; history?: TSessionEnvelope["history"] } {
  const value: unknown = JSON.parse(text)
  if (Array.isArray(value)) {
    return { symbols: rebuildSymbols(value) }
  }
  if (typeof value !== "object" || value === null || !("symbols" in value) || !Array.isArray(value.symbols)) {
    throw new Error("Not a saved session content")
  }
  return {
    symbols: rebuildSymbols(value.symbols),
    history: parseHistory("history" in value ? value.history : undefined),
  }
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
