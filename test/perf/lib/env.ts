import { JSDOM } from "jsdom"

/**
 * The benches measure the built bundle, not `src/`. Two reasons: it is what ships, and it removes
 * the need for a TypeScript runner in the bench path — node strips the types of these files itself.
 *
 * The bundle touches the DOM at import time, so a jsdom window has to be installed on the globals
 * before the import. Only the globals the library actually reaches for are copied; anything missing
 * will surface as a clear `ReferenceError` rather than a silent fallback.
 */
const DOM_GLOBALS = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLCanvasElement",
  "SVGElement",
  "SVGGraphicsElement",
  "Element",
  "Node",
  "DOMParser",
  "XMLSerializer",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "CustomEvent",
  "Event",
  "MutationObserver",
  "ResizeObserver",
] as const

export function installDom(): void {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true })
  const source = dom.window as unknown as Record<string, unknown>
  const target = globalThis as unknown as Record<string, unknown>
  for (const key of DOM_GLOBALS) {
    if (target[key] === undefined && source[key] !== undefined) {
      target[key] = source[key]
    }
  }
}
