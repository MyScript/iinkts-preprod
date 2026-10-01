// @ts-check
/**
 * What the student sees of the connection. Ink written offline is kept and replayed by the
 * library on reconnection; meanwhile no line can be read, so the verdicts wait instead of
 * judging what was recognized before the connection dropped.
 */

import { CONNECTION } from "./strings.js"

/**
 * @typedef {"initializing" | "online-idle" | "online-working" | "syncing" | "offline" | "error"} TConnectionState
 * @typedef {{ label: string, tone: "ok" | "warn" | "error", hold: boolean, message?: string }} TConnectionView
 */

/** @type {Record<TConnectionState, TConnectionView>} */
const VIEWS = {
  initializing: { label: CONNECTION.connecting, tone: "warn", hold: true },
  // The client is busy after every stroke: shown as online too, or the pill would flicker
  "online-idle": { label: CONNECTION.online, tone: "ok", hold: false },
  "online-working": { label: CONNECTION.online, tone: "ok", hold: false },
  offline: { label: CONNECTION.offline, tone: "warn", hold: true, message: CONNECTION.waiting },
  syncing: { label: CONNECTION.syncing, tone: "warn", hold: true, message: CONNECTION.waiting },
  error: { label: CONNECTION.error, tone: "error", hold: true, message: CONNECTION.lost },
}

/**
 * @param {TConnectionState} state
 * @returns {TConnectionView}
 */
export function connectionView(state) {
  return VIEWS[state]
}
