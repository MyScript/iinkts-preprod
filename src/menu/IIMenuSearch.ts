import type { TInteractiveInkCanvas } from "@/canvas"
import { DOMFactory } from "@/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TSearchMatch } from "@/manager"

/**
 * @group Menu
 * @remarks Configuration of the search bar
 */
export type TMenuSearchConfig = {
  /** Ctrl+F (Cmd+F) opens the search bar instead of the browser's find */
  shortcut?: boolean
}

/**
 * @group Menu
 * @remarks Search bar over the canvas: finds the query in the recognized content with `canvas.search`, highlights
 * every match and steps through them. Opened by {@link open}, or Ctrl+F when `menu.search.shortcut` is on.
 */
export class IIMenuSearch {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLElement
  protected input?: HTMLInputElement
  protected count?: HTMLElement
  /** Index of the revealed match in `canvas.search.highlighted`, -1 when none */
  protected activeIndex = -1

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-search") {
    this.canvas = canvas
    this.id = id
  }

  /** Whether the search bar is shown */
  get isOpen(): boolean {
    return !!this.wrapper && this.wrapper.style.display !== "none"
  }

  render(layer: HTMLElement): void {
    if (!this.canvas.configuration.menu.search.enable) {
      return
    }
    this.logger.info("Rendering search bar")
    this.input = this.createInput()
    this.count = DOMFactory.span({ id: `${this.id}-count`, className: "ms-menu-search-count" })
    this.wrapper = DOMFactory.div({ id: this.id, className: ["ms-menu", "ms-menu-search"] })
    this.wrapper.append(
      this.input,
      this.count,
      this.createButton("previous", "‹", this.canvas.i18n.t("menu.search.previous"), () => this.step(-1)),
      this.createButton("next", "›", this.canvas.i18n.t("menu.search.next"), () => this.step(1)),
      this.createButton("close", "✕", this.canvas.i18n.t("menu.search.close"), () => this.close())
    )
    // The layout places the bar; once it is rendered, a bar it places nowhere is not shown
    const host = this.canvas.layout.host("search")
    if (!host && this.canvas.layout.isRendered) {
      return
    }
    ;(host ?? layer).appendChild(this.wrapper)
    this.setShown(false)
    this.updateAvailability()
    this.canvas.event.addSynchronizedListener(() => this.updateAvailability())
  }

  /** Tell in the bar when nothing is recognized yet, so a search cannot find anything */
  protected updateAvailability(): void {
    if (!this.wrapper || !this.input) {
      return
    }
    const available = this.canvas.search.available
    this.wrapper.classList.toggle("unavailable", !available)
    this.input.placeholder = this.canvas.i18n.t(available ? "menu.search.placeholder" : "menu.search.unavailable")
  }

  protected createInput(): HTMLInputElement {
    const input = DOMFactory.textInput({
      id: `${this.id}-input`,
      placeholder: this.canvas.i18n.t("menu.search.placeholder"),
    })
    input.type = "search"
    input.autocomplete = "off"
    input.addEventListener("input", () => this.search())
    input.addEventListener("keydown", (event) => this.onKeyDown(event))
    return input
  }

  protected createButton(name: string, label: string, title: string, action: () => void): HTMLButtonElement {
    return DOMFactory.button({ id: `${this.id}-${name}`, className: "square", label, title, onClick: action })
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault()
      this.step(event.shiftKey ? -1 : 1)
    } else if (event.key === "Escape") {
      event.preventDefault()
      this.close()
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      // Already open: keep the browser's find closed
      event.preventDefault()
      this.input?.select()
    }
  }

  /** Show the search bar and focus its query, selected; a query kept from before is searched again */
  open(): void {
    if (!this.wrapper || !this.input) {
      return
    }
    this.setShown(true)
    this.input.focus()
    this.input.select()
    if (this.input.value) {
      this.search()
    }
  }

  /** Show or hide the bar; its layout host folds while hidden, so the occupants under it close the gap */
  protected setShown(shown: boolean): void {
    if (!this.wrapper) {
      return
    }
    this.wrapper.style.display = shown ? "" : "none"
    const host = this.wrapper.parentElement
    if (host?.classList.contains("ms-layout-host")) {
      host.classList.toggle("ms-layout-host-hidden", !shown)
    }
    // The action menu's search button shows whether the bar is open
    this.canvas.menu.action.update()
  }

  /** Hide the search bar and remove the highlight */
  close(): void {
    if (!this.wrapper) {
      return
    }
    this.setShown(false)
    this.activeIndex = -1
    this.canvas.search.clear()
  }

  /** Find the query and highlight every match, none revealed yet */
  protected search(): void {
    this.activeIndex = -1
    const matches = this.canvas.search.find(this.input?.value ?? "")
    this.canvas.search.highlight(matches)
    this.updateCount(matches)
  }

  /** Reveal the match `offset` away from the current one, wrapping around */
  protected step(offset: number): void {
    // The highlight follows the content as it changes: step through its matches, not the ones first found
    const matches = this.canvas.search.highlighted
    if (!matches.length) {
      return
    }
    const from = this.activeIndex < 0 && offset < 0 ? 0 : this.activeIndex
    this.activeIndex = (from + offset + matches.length) % matches.length
    const active = matches[this.activeIndex]
    this.canvas.search.highlight(matches, active)
    this.canvas.search.reveal(active)
    this.updateCount(matches)
  }

  protected updateCount(matches: TSearchMatch[]): void {
    if (this.count) {
      this.count.textContent = `${this.activeIndex + 1}/${matches.length}`
    }
  }

  destroy(): void {
    this.wrapper?.remove()
    this.wrapper = undefined
    this.input = undefined
    this.count = undefined
    this.activeIndex = -1
  }
}
