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
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-file-input")

    // Input file
    this.inputElement = document.createElement("input")
    this.inputElement.type = "file"
    this.inputElement.accept = this.config.accept || "*"
    this.inputElement.multiple = this.config.multiple || false
    this.inputElement.addEventListener("change", () => {
      this.buttonElement.disabled = !this.inputElement.files?.length
    })
    wrapper.appendChild(this.inputElement)

    // Validation button
    this.buttonElement = document.createElement("button")
    this.buttonElement.classList.add("ms-menu-button")
    this.buttonElement.innerText = this.config.buttonLabel || this.config.label || "Upload"
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
