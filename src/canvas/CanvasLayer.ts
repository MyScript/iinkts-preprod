import loadingDotsIcon from "@/assets/svg/loading-dots.svg"
import loadingRingIcon from "@/assets/svg/loading-ring.svg"
import syncIcon from "@/assets/svg/sync.svg"
import warningTriangleIcon from "@/assets/svg/warning-triangle.svg"
import wifiIcon from "@/assets/svg/wifi.svg"
import wifiOffIcon from "@/assets/svg/wifi-off.svg"
import { DOMFactory } from "@/dom"
import type { TTranslationKey } from "@/i18n"
import { Translator } from "@/i18n"
import style from "@/iink.css"
import { Modal } from "@/ui"

import type { TCanvasConnectionState } from "./CanvasEvent"
import type { TCanvasOperationLabel } from "./TCanvasOperationLabel"

/**
 * @group Canvas
 */
export type TCanvasLayerUIState = {
  root: HTMLDivElement
  icon: HTMLDivElement
  count: HTMLSpanElement
  tooltip: HTMLDivElement
}

/**
 * @group Canvas
 */
export type TCanvasLayerUI = {
  root: HTMLDivElement
  loader: HTMLDivElement
  state: TCanvasLayerUIState
}

/**
 * @group Canvas
 */
export type TCanvasStateDetail = {
  /** Number of addStrokes batches queued locally while offline (only relevant for `syncing`). */
  queuedCount: number
  /** Labels of operations currently running (only relevant for `online-working`), e.g. `["Converting"]`. */
  activeOperations: string[]
}

const CONNECTION_STATE_INFO: Record<TCanvasConnectionState, { icon: string; tooltip: TTranslationKey }> = {
  initializing: { icon: loadingRingIcon, tooltip: "canvas.state.initializing" },
  "online-idle": { icon: wifiIcon, tooltip: "canvas.state.onlineIdle" },
  "online-working": { icon: loadingDotsIcon, tooltip: "canvas.state.onlineWorking" },
  syncing: { icon: syncIcon, tooltip: "canvas.state.syncing" },
  offline: { icon: wifiOffIcon, tooltip: "canvas.state.offline" },
  error: { icon: warningTriangleIcon, tooltip: "canvas.state.error" },
}

const OPERATION_LABEL_KEYS = new Map<string, TTranslationKey>(
  Object.entries({
    Recognizing: "canvas.operation.recognizing",
    Writing: "canvas.operation.writing",
    Translating: "canvas.operation.translating",
    Resizing: "canvas.operation.resizing",
    Rotating: "canvas.operation.rotating",
    Synchronizing: "canvas.operation.synchronizing",
    "Applying gesture": "canvas.operation.applyingGesture",
    Converting: "canvas.operation.converting",
    Computing: "canvas.operation.computing",
    "Updating variables": "canvas.operation.updatingVariables",
    "Loading variables": "canvas.operation.loadingVariables",
    Evaluating: "canvas.operation.evaluating",
    Checking: "canvas.operation.checking",
    Exporting: "canvas.operation.exporting",
    Importing: "canvas.operation.importing",
    Undoing: "canvas.operation.undoing",
    Redoing: "canvas.operation.redoing",
    Clearing: "canvas.operation.clearing",
    "Removing strokes": "canvas.operation.removingStrokes",
  } satisfies Record<TCanvasOperationLabel, TTranslationKey>)
)

/**
 * @group Canvas
 */
export class CanvasLayer {
  root: HTMLElement
  ui: TCanvasLayerUI
  rendering: HTMLElement
  /** Covers the whole canvas, menus included, with a spinner while it cannot be used; see {@link showVeil} */
  veil: HTMLDivElement

  onCloseModal?: (inError?: boolean) => void
  /** Translates the badge tooltip and the message titles */
  i18n: Translator

  #modal?: Modal
  #documentPointerdownHandler?: (e: PointerEvent) => void
  #lastState?: { state: TCanvasConnectionState; detail: TCanvasStateDetail }
  #veilTimer?: ReturnType<typeof setTimeout>
  #unsubscribeI18n: () => void

  constructor(root: HTMLElement, rootClassCss: string = "ms-ink", i18n: Translator = new Translator()) {
    this.root = root
    this.i18n = i18n
    // The badge tooltip shows until the next state change: retranslate it at once
    this.#unsubscribeI18n = i18n.onChange(
      () => this.#lastState && this.updateCanvasState(this.#lastState.state, this.#lastState.detail)
    )
    this.root.classList.add(rootClassCss)
    this.rendering = this.createLayerRender()
    this.ui = this.createLayerUI()
    this.veil = DOMFactory.div({ className: "ms-ink-veil" })
    this.veil.appendChild(DOMFactory.div({ className: "ms-ink-veil-spinner" }))
  }

  render(): void {
    const styleElement = DOMFactory.style(style as string)
    this.root.prepend(styleElement)

    this.root.appendChild(this.rendering)
    this.root.appendChild(this.ui.root)
    this.root.appendChild(this.veil)
  }

  /**
   * Covers the canvas after `delay` ms, so that what ends sooner shows nothing rather than a flash.
   * Only shows the canvas is busy: blocking the input is up to the caller.
   */
  showVeil(delay = 300): void {
    clearTimeout(this.#veilTimer)
    this.#veilTimer = setTimeout(() => this.veil.classList.add("open"), delay)
  }

  /** Lifts the veil, or cancels it while its delay runs */
  hideVeil(): void {
    clearTimeout(this.#veilTimer)
    this.veil.classList.remove("open")
  }

  createLoader(): HTMLDivElement {
    return DOMFactory.div({
      className: "loader",
      style: "display: none",
    })
  }
  showLoader(): void {
    this.ui.loader.style.display = "block"
  }
  hideLoader(): void {
    this.ui.loader.style.display = "none"
  }

  clearModal(): void {
    this.#modal?.destroySilent()
    this.#modal = undefined
  }

  showMessageInfo(notif: { message: string; timeout?: number }): void {
    this.#modal?.destroySilent()
    this.#modal = new Modal({
      title: this.i18n.t("canvas.message.info"),
      i18n: this.i18n,
      type: "info",
      fields: [],
      customContent: DOMFactory.p({
        text: notif.message,
      }),
      container: this.root,
      onClose: () => this.onCloseModal?.(false),
    })
    this.#modal.open()
    setTimeout(() => this.#modal?.close(), notif.timeout ?? 2500)
  }

  showMessageError(err: Error | string): void {
    this.#modal?.destroySilent()
    this.#modal = new Modal({
      title: this.i18n.t("canvas.message.error"),
      i18n: this.i18n,
      type: "error",
      fields: [],
      customContent: DOMFactory.p({
        text: typeof err === "string" ? err : err.message,
      }),
      container: this.root,
      onClose: () => this.onCloseModal?.(true),
    })
    this.#modal.open()
  }

  createState(): TCanvasLayerUIState {
    const root = DOMFactory.div({ className: "ms-ink-state" })
    const icon = DOMFactory.div({ className: "ms-ink-state-icon" })
    root.appendChild(icon)
    const count = DOMFactory.span({
      className: "ms-ink-state-count",
      style: "display: none",
    })
    root.appendChild(count)
    const tooltip = DOMFactory.div({ className: "ms-ink-state-tooltip" })
    root.appendChild(tooltip)

    root.addEventListener("pointerdown", (e) => {
      e.stopPropagation()
      tooltip.classList.toggle("open")
    })
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!root.contains(e.target as HTMLElement)) {
        tooltip.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return { root, icon, count, tooltip }
  }

  /**
   * Reflect the canvas's derived state (see `TCanvasConnectionState`) on the state badge:
   * icon, color (via CSS class), and the explanatory tooltip shown next to the badge on click
   * (including active operation labels or queued count).
   */
  updateCanvasState(state: TCanvasConnectionState, detail: TCanvasStateDetail): void {
    const { root, icon, count, tooltip } = this.ui.state
    this.#lastState = { state, detail }
    const info = CONNECTION_STATE_INFO[state]
    const stateLabel = this.i18n.t(info.tooltip)
    root.className = `ms-ink-state ms-ink-state-${state}`
    icon.innerHTML = info.icon
    if (state === "syncing" && detail.queuedCount > 0) {
      tooltip.textContent = this.i18n.t("canvas.state.queued", { state: stateLabel, count: detail.queuedCount })
      count.textContent = String(detail.queuedCount)
      count.style.display = "flex"
    } else if (state === "online-working" && detail.activeOperations.length > 0) {
      tooltip.textContent = detail.activeOperations
        .map((label) => this.i18n.t(OPERATION_LABEL_KEYS.get(label) ?? label))
        .join(", ")
      count.style.display = "none"
    } else {
      tooltip.textContent = stateLabel
      count.style.display = "none"
    }
  }

  createLayerUI(): TCanvasLayerUI {
    const root = DOMFactory.div({
      className: "ms-layer-ui",
    })

    const loader = this.createLoader()
    root.appendChild(loader)

    const state = this.createState()
    root.appendChild(state.root)

    return {
      root,
      loader,
      state,
    }
  }

  createLayerRender(): HTMLDivElement {
    return DOMFactory.div({
      className: "ms-layer-rendering",
    })
  }

  destroy(): void {
    this.#unsubscribeI18n()
    clearTimeout(this.#veilTimer)
    this.#modal = undefined
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    while (this.root.lastChild) {
      this.root.removeChild(this.root.lastChild)
    }
  }
}
