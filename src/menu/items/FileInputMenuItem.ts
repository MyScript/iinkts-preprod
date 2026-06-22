import { BaseMenuItem, IMenuItemBase } from "./BaseMenuItem"
import { InteractiveInkEditor } from "@/editor"

/**
 * @group Menu
 * @remarks Configuration for a file input with a validation button
 */
export interface IMenuFileInput extends IMenuItemBase {
  type: "fileinput"
  accept?: string
  multiple?: boolean
  buttonLabel?: string
  action: (editor: InteractiveInkEditor, files: FileList) => void | Promise<void>
}

/**
 * @group Menu
 * @remarks Menu item for selecting and validating a file
 */
export class FileInputMenuItem extends BaseMenuItem<HTMLDivElement>
{
  protected declare config: IMenuFileInput
  private inputElement!: HTMLInputElement
  private buttonElement!: HTMLButtonElement

  createElement(): HTMLDivElement
  {
    const wrapper = this.dom.div({ id: this.config.id, className: "ms-menu-file-input" })

    this.inputElement = this.dom.fileInput({
      id: `${this.config.id}-input`,
      accept: this.config.accept,
      multiple: this.config.multiple,
    })
    this.inputElement.addEventListener("change", () => {
      this.buttonElement.disabled = !this.inputElement.files?.length
    })
    wrapper.appendChild(this.inputElement)

    this.buttonElement = this.dom.button({ label: this.config.buttonLabel || this.config.label || "Upload" })
    this.buttonElement.disabled = true
    this.buttonElement.addEventListener("pointerup", async (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (this.inputElement.files?.length) {
        await this.config.action(this.editor, this.inputElement.files)
        this.inputElement.value = ""
        this.buttonElement.disabled = true
      }
    })
    wrapper.appendChild(this.buttonElement)

    return wrapper
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()
  }
}
