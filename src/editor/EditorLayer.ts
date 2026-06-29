import { DOMFactory } from "@/components/dom"
import { Modal } from "@/components/Modal"
import style from "@/iink.css"

/**
 * @group Editor
 */
export type TEditorLayerUIState = {
  root: HTMLDivElement
  busy: HTMLDivElement
}

/**
 * @group Editor
 */
export type TEditorLayerUI = {
  root: HTMLDivElement
  loader: HTMLDivElement
  state: TEditorLayerUIState
}

/**
 * @group Editor
 */
export class EditorLayer {
  root: HTMLElement
  ui: TEditorLayerUI
  rendering: HTMLElement

  onCloseModal?: (inError?: boolean) => void

  #modal?: Modal

  constructor(root: HTMLElement, rootClassCss: string = "ms-editor") {
    this.root = root
    this.root.classList.add(rootClassCss)
    this.rendering = this.createLayerRender()
    this.ui = this.createLayerUI()
  }

  render(): void {
    const styleElement = DOMFactory.style(style as string)
    this.root.prepend(styleElement)

    this.root.appendChild(this.rendering)
    this.root.appendChild(this.ui.root)
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
      title: "Info",
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
      title: "Error",
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

  createBusy(): HTMLDivElement {
    return DOMFactory.div({ className: "busy" })
  }
  createState(): TEditorLayerUIState {
    const root = DOMFactory.div({
      className: "state",
      style: "display: none",
    })

    const busy = this.createBusy()
    root.appendChild(busy)

    return {
      root,
      busy,
    }
  }
  showState(): void {
    this.ui.state.root.style.display = "block"
  }
  hideState(): void {
    this.ui.state.root.style.display = "none"
  }
  updateState(idle: boolean): void {
    if (idle) {
      this.hideState()
    } else {
      this.showState()
    }
  }

  createLayerUI(): TEditorLayerUI {
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
    this.#modal = undefined
    while (this.root.lastChild) {
      this.root.removeChild(this.root.lastChild)
    }
  }
}
