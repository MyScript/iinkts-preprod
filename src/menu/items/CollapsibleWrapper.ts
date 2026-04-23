import ArrowDown from "../../assets/svg/nav-arrow-down.svg"

/**
 * @group Menu
 * @remarks Utility class to create a collapsible wrapper around menu content
 */
export class CollapsibleWrapper {
  private wrapper: HTMLDivElement

  constructor(content: HTMLElement, title: string, id?: string) {
    this.wrapper = this.createWrapper(content, title, id)
  }

  private createWrapper(content: HTMLElement, title: string, id?: string): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.classList.add("collapsible-wrapper")
    if (id) {
      wrapper.id = id
    }

    const head = document.createElement("div")
    head.classList.add("collapsible-header")
    head.textContent = title

    const btn = document.createElement("span")
    btn.classList.add("collapsible-header-icon")
    btn.innerHTML = ArrowDown
    head.appendChild(btn)
    head.style.setProperty("cursor", "pointer")

    const contentWrapper = document.createElement("div")
    contentWrapper.classList.add("collapsible-content")

    head.addEventListener("click", () => wrapper.classList.toggle("active"))

    wrapper.appendChild(head)
    contentWrapper.appendChild(content)
    wrapper.appendChild(contentWrapper)

    return wrapper
  }

  getElement(): HTMLDivElement {
    return this.wrapper
  }

  setActive(active: boolean): void {
    if (active) {
      this.wrapper.classList.add("active")
    } else {
      this.wrapper.classList.remove("active")
    }
  }

  toggle(): void {
    this.wrapper.classList.toggle("active")
  }

  destroy(): void {
    this.wrapper.remove()
  }
}
