import ArrowDown from "../assets/svg/nav-arrow-down.svg"

/**
 * @group Menu
 */
export type TMenuItem = {
  id: string,
  label: string,
  type: "button" | "checkbox" | "select" | "list" | "colors"
  disabled?: boolean
}

/**
 * @group Menu
 */
export type TMenuItemButton = TMenuItem & {
  type: "button"
  icon?: string
  callback: () => void
}

/**
 * @group Menu
 */
export type TMenuItemButtonList = TMenuItem & {
  type: "list"
  initValue: string,
  values: { label: string, value: string }[]
  callback: (value: string) => void
}

/**
 * @group Menu
 */
export type TMenuItemColorList = TMenuItem & {
  type: "colors"
  initValue: string,
  values: string[]
  fill: boolean
  callback: (value: string) => void
}

/**
 * @group Menu
 */
export type TMenuItemBoolean = TMenuItem & {
  type: "checkbox",
  initValue: boolean | "indeterminate",
  callback: (value: boolean) => void
}

/**
 * @group Menu
 */
export type TMenuItemSelect = TMenuItem & {
  type: "select",
  initValue: string,
  values: { label: string, value: string }[]
  callback: (value: string) => void
}

/**
 * @group Menu
 */
export abstract class IIMenu
{
  thicknessList = [
    { label: "S", value: 1 },
    { label: "M", value: 2 },
    { label: "L", value: 4 },
    { label: "XL", value: 8 },
  ]

  fontSizeList = [
    { label: "Auto", value: "auto" },
    { label: "S", value: 0.5 },
    { label: "M", value: 0.75 },
    { label: "L", value: 1 },
  ]

  fontWeightList = [
    { label: "Auto", value: "auto" },
    { label: "Normal", value: "normal" },
    { label: "Bold", value: "bold" },
  ]

  colors = [
    "#000000", "#808080", "#ffffff", "transparent",
    "#ff0000", "#ff6400", "#ffc800", "#ffff00",
    "#0000ff", "#0064ff", "#00c8ff", "#00ffff",
    "#008000", "#00af00", "#00e100", "#00ff00"
  ]

  protected createWrapCollapsible(el: Node, title: string): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("collapsible-wrapper")
    const head = document.createElement("div")
    head.classList.add("collapsible-header")
    head.textContent = title
    const btn = document.createElement("span")
    btn.classList.add("collapsible-header-icon")
    btn.innerHTML = ArrowDown
    head.appendChild(btn)
    head.style.setProperty("pointer", "cursor")
    const content = document.createElement("div")
    content.classList.add("collapsible-content")
    head.addEventListener("pointerup", () => wrapper.classList.toggle("active"))
    wrapper.appendChild(head)
    content.appendChild(el)
    wrapper.appendChild(content)
    return wrapper
  }

  protected createMenuItemBoolean(item: TMenuItemBoolean): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    const checkbox = document.createElement("input")
    checkbox.id = item.id
    checkbox.setAttribute("type", "checkbox")
    if (item.disabled) {
      checkbox.disabled = true
    }
    if (item.initValue === "indeterminate") {
      checkbox.indeterminate = true
    } else {
      checkbox.checked = item.initValue
    }
    checkbox.addEventListener("change", (e) => item.callback((e.target as HTMLInputElement).checked))
    wrapper.appendChild(checkbox)
    return wrapper
  }

  protected createMenuItemSelect(item: TMenuItemSelect): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    const select = document.createElement("select")
    select.id = item.id
    if (item.disabled) {
      select.disabled = true
    }
    item.values.forEach(v =>
    {
      const selected = v.value === item.initValue
      const opt = new Option(v.label, v.value.toString(), selected, selected)
      select.appendChild(opt)
    })
    select.addEventListener("change", (e) => item.callback((e.target as HTMLInputElement).value))
    wrapper.appendChild(select)
    return wrapper
  }

  protected createMenuItemButton(item: TMenuItemButton): HTMLElement
  {
    const btn = document.createElement("button")
    btn.classList.add("ms-menu-item", "ms-menu-button")
    btn.innerHTML = item.icon || item.label
    btn.addEventListener("pointerup", item.callback)
    return btn
  }

  protected createMenuItemButtonList(item: TMenuItemButtonList): HTMLElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    wrapper.id = item.id
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    item.values.forEach((v) =>
    {
      const btn = document.createElement("button")
      if (item.disabled) {
        btn.disabled = true
      }
      btn.id = `${item.id}-${ v.value }-btn`
      if (item.initValue === v.value) {
        btn.classList.add("active")
      }
      btn.textContent = v.label
      btn.addEventListener("pointerup", () =>
      {
        item.callback(v.value)
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
      })
      wrapper.appendChild(btn)
    })
    return wrapper
  }

  protected createMenuItemColorList(item: TMenuItemColorList): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.classList.add("ms-menu-item", item.type)
    wrapper.id = item.id
    const labelEl = document.createElement("span")
    labelEl.textContent = item.label
    wrapper.appendChild(labelEl)
    wrapper.appendChild(this.createColorList(item))
    return wrapper
  }

  protected createColorList(item: TMenuItemColorList): HTMLDivElement
  {
    const list = document.createElement("div")
    list.id = `${ item.id }-list`
    list.classList.add("ms-menu-row", "color-list")
    item.values.forEach((color) =>
    {
      const btn = document.createElement("button")
      if (item.disabled) {
        btn.disabled = true
      }
      btn.id = `${ item.id }-${ color.replace("#", "") }-btn`
      btn.classList.add("ms-menu-button", "square")
      const colorEl = document.createElement("div")
      colorEl.classList.add("color")
      if (item.fill) {
        colorEl.style.setProperty("background-color", color)
        colorEl.style.setProperty("border", "1px solid lightgrey")
      } else {
        colorEl.style.setProperty("background-color", "transparent")
        colorEl.style.setProperty("border", `3px solid ${ color }`)
      }
      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }
      if (color === "transparent") {
        colorEl.style.setProperty("background-image", "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)")
      }
      if (item.initValue === color) {
        btn.classList.add("active")
      }
      btn.appendChild(colorEl)
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        item.callback(color)
        list.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
      })
      list!.appendChild(btn)
    })
    return list
  }

  protected createMenuItem(item: TMenuItem): HTMLElement
  {
    switch (item.type) {
      case "checkbox":
        return this.createMenuItemBoolean(item as TMenuItemBoolean)
      case "select":
        return this.createMenuItemSelect(item as TMenuItemSelect)
      case "list":
        return this.createMenuItemButtonList(item as TMenuItemButtonList)
      case "colors":
        return this.createMenuItemColorList(item as TMenuItemColorList)
      case "button":
      default:
        return this.createMenuItemButton(item as TMenuItemButton)
    }
  }

  abstract render(domElement: HTMLElement): void

  abstract update(): void

  abstract show(): void

  abstract hide(): void

  abstract destroy(): void
}
