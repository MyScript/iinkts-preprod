import { LoggerManager, LoggerCategory } from "@/logger"
import { EditorTool } from "@/Constants"
import type { InteractiveInkEditor } from "@/editor"

/**
 * Manages keyboard input for the Interactive Ink editor
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager/Interactive
 */
export class IIKeyboardManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  #toolBeforeCtrl?: EditorTool

  constructor(private editor: InteractiveInkEditor)
  {
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  /**
   * Attach keyboard event listeners to the window
   */
  attach(): void
  {
    this.#logger.info("attach")
    window.addEventListener("keydown", this.handleKeyDown)
    window.addEventListener("keyup", this.handleKeyUp)
  }

  /**
   * Detach keyboard event listeners from the window
   */
  detach(): void
  {
    this.#logger.info("detach")
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

  /**
   * Handle keydown events
   * Switches to Move tool when Ctrl/Cmd is pressed
   */
  protected handleKeyDown = (event: KeyboardEvent): void =>
  {
    const target = event.target as HTMLElement
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return
    }

    if ((event.ctrlKey || event.metaKey) && this.editor.tool !== EditorTool.Move && !this.#toolBeforeCtrl) {
      this.#logger.debug("handleKeyDown", "Switching to Move mode")
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
      this.#logger.debug("handleKeyUp", "Restoring previous tool")
      this.editor.tool = this.#toolBeforeCtrl
      this.#toolBeforeCtrl = undefined
    }
  }
}
