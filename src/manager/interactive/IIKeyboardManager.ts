import type { TInteractiveInkCanvas } from "@/canvas"
import { LoggerCategory } from "@/logger"
import { ImageUtil } from "@/symbol-utils"

import { CanvasTool } from "../base/CanvasTool"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Manages keyboard input for the Interactive Ink canvas
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager
 */
export class IIKeyboardManager extends IIAbstractManager {
  protected managerName = "IIKeyboardManager"

  static readonly ZOOM_STEP = 1.2
  static readonly PAN_STEP = 100

  #toolBeforeCtrl?: CanvasTool
  /** Ctrl+V was pressed on the canvas, and neither paste has run yet */
  #pastePending = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.KEYBOARD)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handlePaste = this.handlePaste.bind(this)
  }

  /**
   * Attach keyboard event listeners to the window
   */
  attach(): void {
    this.logger.info("attach")
    window.addEventListener("keydown", this.handleKeyDown)
    window.addEventListener("keyup", this.handleKeyUp)
    window.addEventListener("paste", this.handlePaste)
  }

  /**
   * Detach keyboard event listeners from the window
   */
  detach(): void {
    this.logger.info("detach")
    window.removeEventListener("keydown", this.handleKeyDown)
    window.removeEventListener("keyup", this.handleKeyUp)
    window.removeEventListener("paste", this.handlePaste)
  }

  /**
   * Reset the stored tool when user manually changes tool
   * Called by the canvas when tool changes programmatically
   */
  resetStoredTool(): void {
    if (this.#toolBeforeCtrl) {
      this.#toolBeforeCtrl = undefined
    }
  }

  /**
   * Copied symbols stay in the canvas, so the system clipboard keeps whatever was copied before: a
   * picture there would win over them at the next Ctrl+V. Emptying it makes the last copy the one
   * pasted. Not possible on a page that is not a secure context, which has no `navigator.clipboard`:
   * there, a picture left in the system clipboard is still pasted before the copied symbols.
   */
  #clearSystemClipboard(): void {
    navigator.clipboard?.writeText("").catch(() => undefined)
  }

  #pasteSymbols(): void {
    if (!this.#pastePending) {
      return
    }
    this.#pastePending = false
    this.canvas.tool = CanvasTool.Select
    this.canvas.paste()
  }

  /** Ctrl+V on the canvas: a picture in the system clipboard is imported, otherwise the copied symbols are pasted. */
  protected handlePaste(event: ClipboardEvent): void {
    if (!this.#pastePending) {
      return
    }
    event.preventDefault()
    const file = Array.from(event.clipboardData?.files ?? []).find((f) => ImageUtil.isSupportedMimeType(f.type))
    if (!file) {
      this.#pasteSymbols()
      return
    }
    this.#pastePending = false
    this.canvas.importImage(file).catch(() => undefined)
  }

  #zoomAtCenter(factor: number): void {
    const cx = this.canvas.renderer.parent.clientWidth / 2
    const cy = this.canvas.renderer.parent.clientHeight / 2
    this.canvas.renderer.setZoom(this.canvas.renderer.getZoom() * factor, cx, cy)
    this.canvas.menu.action.update()
  }

  #handleCtrlShortcut(event: KeyboardEvent): boolean {
    switch (event.key.toLowerCase()) {
      case "z":
        event.preventDefault()
        if (event.shiftKey) {
          this.canvas.redo()
        } else {
          this.canvas.undo()
        }
        return true
      case "y":
        event.preventDefault()
        this.canvas.redo()
        return true
      case "c":
        event.preventDefault()
        this.#clearSystemClipboard()
        this.canvas.copy()
        return true
      case "v":
        // Not prevented: the browser's paste event is the only way to read a picture from the system
        // clipboard without asking for a permission. It picks between the picture and the copied
        // symbols; a browser that sends none outside a text field gets the symbols on the next task.
        this.#toolBeforeCtrl = undefined
        this.#pastePending = true
        setTimeout(() => this.#pasteSymbols())
        return true
      case "x":
        event.preventDefault()
        this.#clearSystemClipboard()
        this.canvas.cut()
        return true
      case "f":
        return this.#openSearch(event)
      case "0":
      case "à": // AZERTY: unshifted value of the 0 key
        event.preventDefault()
        this.canvas.zoomToFit()
        this.canvas.menu.action.update()
        return true
      case "+":
      case "=":
        event.preventDefault()
        this.#zoomAtCenter(IIKeyboardManager.ZOOM_STEP)
        return true
      case "-":
        event.preventDefault()
        this.#zoomAtCenter(1 / IIKeyboardManager.ZOOM_STEP)
        return true
      case "arrowup":
        event.preventDefault()
        this.canvas.renderer.pan(0, -IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom())
        return true
      case "arrowdown":
        event.preventDefault()
        this.canvas.renderer.pan(0, IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom())
        return true
      case "arrowleft":
        event.preventDefault()
        this.canvas.renderer.pan(-IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom(), 0)
        return true
      case "arrowright":
        event.preventDefault()
        this.canvas.renderer.pan(IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom(), 0)
        return true
      default:
        return false
    }
  }

  /** Opens the search bar instead of the browser's find, unless the configuration leaves Ctrl+F to the browser */
  #openSearch(event: KeyboardEvent): boolean {
    const { menu } = this.canvas.configuration
    if (!menu.enable || !menu.search.enable || !menu.search.shortcut) {
      return false
    }
    event.preventDefault()
    this.canvas.menu.search.open()
    return true
  }

  #handleDelete(event: KeyboardEvent): void {
    const selected = this.canvas.model.symbolsSelected
    if (selected.length) {
      event.preventDefault()
      this.canvas.removeSymbols(selected.map((s) => s.id))
    }
  }

  /**
   * Handle keydown events
   * Handles copy/paste/cut shortcuts and Delete key; switches to Move tool when Ctrl/Cmd is pressed
   */
  protected handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return
    }

    if (event.ctrlKey || event.metaKey) {
      if (this.#handleCtrlShortcut(event)) {
        return
      }
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      this.#handleDelete(event)
      return
    }

    const hasSelection = this.canvas.model.symbolsSelected.length > 0
    if (
      (event.ctrlKey || event.metaKey) &&
      this.canvas.tool !== CanvasTool.Move &&
      !this.#toolBeforeCtrl &&
      !hasSelection
    ) {
      this.logger.debug("handleKeyDown", "Switching to Move mode")
      this.#toolBeforeCtrl = this.canvas.tool
      this.canvas.tool = CanvasTool.Move
    }
  }

  /**
   * Handle keyup events
   * Restores previous tool when Ctrl/Cmd is released
   */
  protected handleKeyUp = (event: KeyboardEvent): void => {
    if (!event.ctrlKey && !event.metaKey && this.#toolBeforeCtrl) {
      this.logger.debug("handleKeyUp", "Restoring previous tool")
      this.canvas.tool = this.#toolBeforeCtrl
      this.#toolBeforeCtrl = undefined
    }
  }
}
