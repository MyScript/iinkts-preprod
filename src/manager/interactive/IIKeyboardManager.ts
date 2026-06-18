import { EditorTool } from "@/Constants"
import type { InteractiveInkEditor } from "@/editor"
import { IIAbstractManager } from "./IIAbstractManager"
import { LoggerCategory } from "@/logger"

/**
 * Manages keyboard input for the Interactive Ink editor
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager
 */
export class IIKeyboardManager extends IIAbstractManager
{
  protected managerName = "IIKeyboardManager"

  static readonly ZOOM_STEP = 1.2
  static readonly PAN_STEP = 100

  #toolBeforeCtrl?: EditorTool

  constructor(editor: InteractiveInkEditor)
  {
    super(editor, LoggerCategory.KEYBOARD)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  /**
   * Attach keyboard event listeners to the window
   */
  attach(): void
  {
    this.logger.info("attach")
    window.addEventListener("keydown", this.handleKeyDown)
    window.addEventListener("keyup", this.handleKeyUp)
  }

  /**
   * Detach keyboard event listeners from the window
   */
  detach(): void
  {
    this.logger.info("detach")
    window.removeEventListener("keydown", this.handleKeyDown)
    window.removeEventListener("keyup", this.handleKeyUp)
  }

  /**
   * Reset the stored tool when user manually changes tool
   * Called by the editor when tool changes programmatically
   */
  resetStoredTool(): void
  {
    if (this.#toolBeforeCtrl) {
      this.#toolBeforeCtrl = undefined
    }
  }

  #zoomAtCenter(factor: number): void
  {
    const cx = this.editor.renderer.parent.clientWidth / 2
    const cy = this.editor.renderer.parent.clientHeight / 2
    this.editor.renderer.setZoom(this.editor.renderer.getZoom() * factor, cx, cy)
    this.editor.menu.action.update()
  }

  #handleCtrlShortcut(event: KeyboardEvent): boolean
  {
    switch (event.key.toLowerCase()) {
      case "z":
        event.preventDefault()
        if (event.shiftKey) {
          this.editor.redo()
        } else {
          this.editor.undo()
        }
        return true
      case "y":
        event.preventDefault()
        this.editor.redo()
        return true
      case "c":
        event.preventDefault()
        this.editor.copy()
        return true
      case "v":
        event.preventDefault()
        this.#toolBeforeCtrl = undefined
        this.editor.tool = EditorTool.Select
        this.editor.paste()
        return true
      case "x":
        event.preventDefault()
        this.editor.cut()
        return true
      case "0":
      case "à": // AZERTY: unshifted value of the 0 key
        event.preventDefault()
        this.editor.zoomToFit()
        this.editor.menu.action.update()
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
        this.editor.renderer.pan(0, -IIKeyboardManager.PAN_STEP / this.editor.renderer.getZoom())
        return true
      case "arrowdown":
        event.preventDefault()
        this.editor.renderer.pan(0, IIKeyboardManager.PAN_STEP / this.editor.renderer.getZoom())
        return true
      case "arrowleft":
        event.preventDefault()
        this.editor.renderer.pan(-IIKeyboardManager.PAN_STEP / this.editor.renderer.getZoom(), 0)
        return true
      case "arrowright":
        event.preventDefault()
        this.editor.renderer.pan(IIKeyboardManager.PAN_STEP / this.editor.renderer.getZoom(), 0)
        return true
      default:
        return false
    }
  }

  #handleDelete(event: KeyboardEvent): void
  {
    const selected = this.editor.model.symbolsSelected
    if (selected.length) {
      event.preventDefault()
      this.editor.removeSymbols(selected.map(s => s.id))
    }
  }

  /**
   * Handle keydown events
   * Handles copy/paste/cut shortcuts and Delete key; switches to Move tool when Ctrl/Cmd is pressed
   */
  protected handleKeyDown = (event: KeyboardEvent): void =>
  {
    const target = event.target as HTMLElement
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return
    }

    if (event.ctrlKey || event.metaKey) {
      if (this.#handleCtrlShortcut(event)) return
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      this.#handleDelete(event)
      return
    }

    const hasSelection = this.editor.model.symbolsSelected.length > 0
    if ((event.ctrlKey || event.metaKey) && this.editor.tool !== EditorTool.Move && !this.#toolBeforeCtrl && !hasSelection) {
      this.logger.debug("handleKeyDown", "Switching to Move mode")
      this.#toolBeforeCtrl = this.editor.tool
      this.editor.tool = EditorTool.Move
    }
  }

  /**
   * Handle keyup events
   * Restores previous tool when Ctrl/Cmd is released
   */
  protected handleKeyUp = (event: KeyboardEvent): void =>
  {
    if (!event.ctrlKey && !event.metaKey && this.#toolBeforeCtrl) {
      this.logger.debug("handleKeyUp", "Restoring previous tool")
      this.editor.tool = this.#toolBeforeCtrl
      this.#toolBeforeCtrl = undefined
    }
  }
}
