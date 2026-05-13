/**
 * @group Components
 */
export interface ModalFieldOption {
  value: string
  label: string
}

/**
 * @group Components
 */
export interface ModalField {
  id: string
  label: string
  type: "text" | "number" | "select"
  defaultValue?: string | number
  placeholder?: string
  options?: ModalFieldOption[]
}

/**
 * @group Components
 */
export interface ModalButton {
  label: string
  type: "primary" | "secondary"
  callback: (values: { [key: string]: string }) => void | Promise<void>
}

/**
 * @group Components
 */
export interface ModalConfig {
  title: string
  fields: ModalField[]
  buttons: ModalButton[]
  customContent?: HTMLElement
}

/**
 * @group Components
 */
export class Modal {
  private modal: HTMLDivElement
  private backdrop: HTMLDivElement
  private isOpen = false

  constructor(private config: ModalConfig) {
    this.backdrop = this.createBackdrop()
    this.modal = this.createModal()
  }

  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement("div")
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9999;
      display: none;
    `
    backdrop.addEventListener("click", () => this.close())
    return backdrop
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement("div")
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      min-width: 300px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      display: none;
    `

    // Title
    const title = document.createElement("h3")
    title.textContent = this.config.title
    title.style.cssText = "margin: 0 0 16px 0; font-size: 18px; font-weight: 600;"
    modal.appendChild(title)

    // Form
    const form = document.createElement("form")
    form.style.cssText = "display: flex; flex-direction: column; gap: 12px;"

    this.config.fields.forEach(field => {
      const fieldWrapper = document.createElement("div")
      fieldWrapper.style.cssText = "display: flex; flex-direction: column; gap: 4px;"

      const label = document.createElement("label")
      label.textContent = field.label
      label.style.cssText = "font-weight: 500; font-size: 14px;"
      label.setAttribute("for", field.id)

      let inputElement: HTMLInputElement | HTMLSelectElement

      if (field.type === "select") {
        const select = document.createElement("select")
        select.id = field.id
        select.style.cssText = `
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        `
        select.classList.add("ms-menu-input")

        if (field.options) {
          field.options.forEach(option => {
            const optionElement = document.createElement("option")
            optionElement.value = option.value
            optionElement.textContent = option.label
            select.appendChild(optionElement)
          })
        }

        if (field.defaultValue !== undefined) {
          select.value = String(field.defaultValue)
        }

        inputElement = select
      } else {
        const input = document.createElement("input")
        input.id = field.id
        input.type = field.type
        input.placeholder = field.placeholder || ""
        if (field.defaultValue !== undefined) {
          input.value = String(field.defaultValue)
        }
        input.style.cssText = `
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        `
        input.classList.add("ms-menu-input")
        inputElement = input
      }

      fieldWrapper.appendChild(label)
      fieldWrapper.appendChild(inputElement)
      form.appendChild(fieldWrapper)
    })

    modal.appendChild(form)

    // Add custom content if provided
    if (this.config.customContent) {
      modal.appendChild(this.config.customContent)
    }

    // Buttons container
    const buttonsWrapper = document.createElement("div")
    buttonsWrapper.style.cssText = "display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;"

    this.config.buttons.forEach(button => {
      const btn = document.createElement("button")
      btn.textContent = button.label
      btn.type = "button"
      btn.classList.add("ms-menu-button")

      const isPrimary = button.type === "primary"
      btn.style.cssText = `
        padding: 6px 12px;
        ${isPrimary ? "background-color: #4caf50; color: white;" : ""}
      `

      btn.addEventListener("click", async () => {
        const values = this.getFieldValues()
        await button.callback(values)
      })

      buttonsWrapper.appendChild(btn)
    })

    modal.appendChild(buttonsWrapper)
    return modal
  }

  private getFieldValues(): { [key: string]: string } {
    const values: { [key: string]: string } = {}
    this.config.fields.forEach(field => {
      const element = this.modal.querySelector(`#${field.id}`) as HTMLInputElement | HTMLSelectElement
      if (element) {
        values[field.id] = element.value
      }
    })
    return values
  }

  /**
   * Open the modal
   */
  open(): void {
    if (this.isOpen) return

    this.backdrop.style.display = "block"
    this.modal.style.display = "block"

    if (!this.backdrop.parentElement) {
      document.body.appendChild(this.backdrop)
      document.body.appendChild(this.modal)
    }

    this.isOpen = true

    // Focus first input
    const firstInput = this.modal.querySelector("input") as HTMLInputElement
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50)
    }
  }

  /**
   * Close the modal
   */
  close(): void {
    if (!this.isOpen) return

    this.backdrop.style.display = "none"
    this.modal.style.display = "none"
    this.isOpen = false
  }

  /**
   * Remove the modal from DOM
   */
  destroy(): void {
    this.close()
    this.backdrop.remove()
    this.modal.remove()
  }
}
