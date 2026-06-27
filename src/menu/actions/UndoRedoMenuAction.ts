import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import undoIcon from "@/assets/svg/undo.svg"
import redoIcon from "@/assets/svg/redo.svg"

/**
 * @group Menu
 * @remarks Menu action Undo/Redo groupé
 */
export class UndoRedoMenuAction extends BaseMenuItem<HTMLDivElement>
{
  private undoButton!: HTMLButtonElement
  private redoButton!: HTMLButtonElement

  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config = {
      type: "undoredo" as const,
      id: `${idPrefix}-undoredo`,
      label: "Undo/Redo"
    }
    super(config, editor)
  }

  createElement(): HTMLDivElement
  {
    const wrapper = this.dom.div({ id: this.config.id, className: ["ms-menu-undoredo-group", "ms-menu-row"] })

    // Bouton Undo
    this.undoButton = this.dom.button({ id: `${this.config.id}-undo`, className: "square", html: undoIcon })
    this.undoButton.disabled = !this.editor.history.context.canUndo
    this.undoButton.addEventListener("pointerup", async () => {
      this.logger.info(`${this.config.id}-undo.click`)
      await this.editor.undo()
    })

    // Bouton Redo
    this.redoButton = this.dom.button({ id: `${this.config.id}-redo`, className: "square", html: redoIcon })
    this.redoButton.disabled = !this.editor.history.context.canRedo
    this.redoButton.addEventListener("pointerup", async () => {
      this.logger.info(`${this.config.id}-redo.click`)
      await this.editor.redo()
    })

    wrapper.appendChild(this.undoButton)
    wrapper.appendChild(this.redoButton)

    return wrapper
  }

  update(): void
  {
    if (this.undoButton) {
      this.undoButton.disabled = !this.editor.history.context.canUndo
    }
    if (this.redoButton) {
      this.redoButton.disabled = !this.editor.history.context.canRedo
    }
    this.updateDisabled()
    this.updateVisible()
  }
}
