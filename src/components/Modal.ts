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
  private isFullscreen = false
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }
  private modalPosition = { x: 0, y: 0 }
  private fullscreenButton?: HTMLButtonElement
  private titleBar?: HTMLDivElement

  constructor(private config: ModalConfig) {
    this.backdrop = this.createBackdrop()
    this.modal = this.createModal()
    this.setupDragging()
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
      padding: 0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      min-width: 300px;
      max-width: 90vw;
      max-height: 90vh;
      display: none;
      overflow: hidden;
      transition: all 0.3s ease;
    `

    // Title bar with drag handle and fullscreen button
    this.titleBar = document.createElement("div")
    this.titleBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      cursor: move;
      user-select: none;
    `

    const title = document.createElement("h3")
    title.textContent = this.config.title
    title.style.cssText = "margin: 0; font-size: 18px; font-weight: 600; flex: 1;"

    // Fullscreen button
    this.fullscreenButton = document.createElement("button")
    this.fullscreenButton.innerHTML = "⛶"
    this.fullscreenButton.title = "Toggle fullscreen"
    this.fullscreenButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    `
    this.fullscreenButton.addEventListener("mouseenter", () => {
      this.fullscreenButton!.style.background = "#e0e0e0"
    })
    this.fullscreenButton.addEventListener("mouseleave", () => {
      this.fullscreenButton!.style.background = "none"
    })
    this.fullscreenButton.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleFullscreen()
    })

    this.titleBar.appendChild(title)
    this.titleBar.appendChild(this.fullscreenButton)
    modal.appendChild(this.titleBar)

    // Content wrapper
    const contentWrapper = document.createElement("div")
    contentWrapper.style.cssText = `
      padding: 20px;
      overflow: auto;
      max-height: calc(90vh - 100px);
    `

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

    contentWrapper.appendChild(form)

    // Add custom content if provided
    if (this.config.customContent) {
      contentWrapper.appendChild(this.config.customContent)
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

    contentWrapper.appendChild(buttonsWrapper)
    modal.appendChild(contentWrapper)
    return modal
  }

  /**
   * Setup dragging functionality
   */
  private setupDragging(): void {
    if (!this.titleBar) return

    this.titleBar.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.isFullscreen) return
      if ((e.target as HTMLElement).tagName === "BUTTON") return

      this.isDragging = true
      const rect = this.modal.getBoundingClientRect()
      this.dragOffset.x = e.clientX - rect.left
      this.dragOffset.y = e.clientY - rect.top

      this.titleBar!.style.cursor = "grabbing"

      // Capture pointer to ensure we receive all events
      if (this.titleBar) {
        this.titleBar.setPointerCapture(e.pointerId)
      }
    })

    this.titleBar.addEventListener("pointermove", (e: PointerEvent) => {
      if (!this.isDragging || this.isFullscreen) return

      e.preventDefault()

      const x = e.clientX - this.dragOffset.x
      const y = e.clientY - this.dragOffset.y

      this.modalPosition.x = x
      this.modalPosition.y = y

      this.modal.style.transform = "none"
      this.modal.style.left = `${x}px`
      this.modal.style.top = `${y}px`
    })

    this.titleBar.addEventListener("pointerup", (e: PointerEvent) => {
      if (this.isDragging) {
        this.isDragging = false
        this.titleBar!.style.cursor = "move"

        // Release pointer capture
        if (this.titleBar!.hasPointerCapture(e.pointerId)) {
          this.titleBar!.releasePointerCapture(e.pointerId)
        }
      }
    })

    this.titleBar.addEventListener("pointercancel", (e: PointerEvent) => {
      if (this.isDragging) {
        this.isDragging = false
        this.titleBar!.style.cursor = "move"

        // Release pointer capture
        if (this.titleBar!.hasPointerCapture(e.pointerId)) {
          this.titleBar!.releasePointerCapture(e.pointerId)
        }
      }
    })
  }

  /**
   * Toggle fullscreen mode
   */
  private toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen

    if (this.isFullscreen) {
      // Save current position
      const rect = this.modal.getBoundingClientRect()
      this.modalPosition.x = rect.left
      this.modalPosition.y = rect.top

      // Apply fullscreen styles
      this.modal.style.transform = "none"
      this.modal.style.left = "0"
      this.modal.style.top = "0"
      this.modal.style.width = "100vw"
      this.modal.style.height = "100vh"
      this.modal.style.maxWidth = "100vw"
      this.modal.style.maxHeight = "100vh"
      this.modal.style.borderRadius = "0"

      // Update content wrapper height
      const contentWrapper = this.modal.querySelector("div:last-child") as HTMLDivElement
      if (contentWrapper) {
        contentWrapper.style.maxHeight = "calc(100vh - 60px)"
      }

      // Update button icon
      if (this.fullscreenButton) {
        this.fullscreenButton.innerHTML = "⛶"
        this.fullscreenButton.title = "Exit fullscreen"
      }

      // Disable dragging in fullscreen
      if (this.titleBar) {
        this.titleBar.style.cursor = "default"
      }
    } else {
      // Restore normal mode
      this.modal.style.width = ""
      this.modal.style.height = ""
      this.modal.style.maxWidth = "90vw"
      this.modal.style.maxHeight = "90vh"
      this.modal.style.borderRadius = "8px"

      // Restore position
      if (this.modalPosition.x === 0 && this.modalPosition.y === 0) {
        // If no custom position, center it
        this.modal.style.left = "50%"
        this.modal.style.top = "50%"
        this.modal.style.transform = "translate(-50%, -50%)"
      } else {
        this.modal.style.left = `${this.modalPosition.x}px`
        this.modal.style.top = `${this.modalPosition.y}px`
        this.modal.style.transform = "none"
      }

      // Update content wrapper height
      const contentWrapper = this.modal.querySelector("div:last-child") as HTMLDivElement
      if (contentWrapper) {
        contentWrapper.style.maxHeight = "calc(90vh - 100px)"
      }

      // Update button icon
      if (this.fullscreenButton) {
        this.fullscreenButton.innerHTML = "⛶"
        this.fullscreenButton.title = "Toggle fullscreen"
      }

      // Re-enable dragging
      if (this.titleBar) {
        this.titleBar.style.cursor = "move"
      }
    }
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
