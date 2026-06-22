/** @group DOM */
export interface ContainerElConfig {
  id?: string
  className?: string | string[]
  style?: string
  text?: string
  html?: string
  title?: string
}

function apply(el: HTMLElement, config?: ContainerElConfig): void {
  if (!config) return
  if (config.id) el.id = config.id
  if (config.style) el.style.cssText = config.style
  if (config.text) el.textContent = config.text
  if (config.html) el.innerHTML = config.html
  if (config.title) el.title = config.title
  if (config.className) {
    const list = Array.isArray(config.className)
      ? config.className.flatMap(c => c.split(" "))
      : config.className.split(" ")
    el.classList.add(...list.filter(c => c.length > 0))
  }
}

/** @group DOM */
export function buildDiv(config?: ContainerElConfig): HTMLDivElement {
  const el = document.createElement("div")
  apply(el, config)
  return el
}

/** @group DOM */
export function buildSpan(config?: ContainerElConfig): HTMLSpanElement {
  const el = document.createElement("span")
  apply(el, config)
  return el
}

/** @group DOM */
export function buildP(config?: ContainerElConfig): HTMLParagraphElement {
  const el = document.createElement("p")
  apply(el, config)
  return el
}

/** @group DOM */
export function buildH3(config?: ContainerElConfig): HTMLHeadingElement {
  const el = document.createElement("h3") as HTMLHeadingElement
  apply(el, config)
  return el
}

/** @group DOM */
export function buildSection(config?: ContainerElConfig): HTMLElement {
  const el = document.createElement("section")
  apply(el, config)
  return el
}

/** @group DOM */
export function buildStyle(cssText: string, dataAttr?: Record<string, string>): HTMLStyleElement {
  const el = document.createElement("style")
  el.textContent = cssText
  if (dataAttr) {
    Object.entries(dataAttr).forEach(([k, v]) => el.setAttribute(`data-${k}`, v))
  }
  return el
}
