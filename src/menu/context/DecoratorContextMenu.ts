import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import { DecoratorKind, IIDecorator, IIText, isRecognizedMath, isText } from "@/symbol"
import { DEFAULT_MENU_COLORS } from "@/menu/MenuConstants"

/** @group Menu */
export type TContextDecoratorItemsConfig = {
  highlight?: boolean
  surround?: boolean
  underline?: boolean
  strikethrough?: boolean
}
/** @group Menu */
export type TContextDecoratorConfig = boolean | TContextDecoratorItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
export class DecoratorContextMenu extends BaseMenuItem<HTMLElement>
{
  #documentPointerdownHandler?: (e: PointerEvent) => void
  #subMenuPointerdownHandlers: Array<(e: PointerEvent) => void> = []
  protected declare config: TGenericMenuItem & { idPrefix: string }
  #itemsConfig?: TContextDecoratorItemsConfig

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-context", itemsConfig?: TContextDecoratorItemsConfig)
  {
    const config: TGenericMenuItem & { idPrefix: string } = {
      type: "custom",
      id: `${idPrefix}-decorator`,
      label: "Decorator",
      idPrefix
    }
    super(config, editor)
    this.#itemsConfig = itemsConfig
  }

  get symbolsDecorable(): IIText[]
  {
    return this.editor.model.symbolsSelected.filter(isText) as IIText[]
  }

  get showDecorator(): boolean
  {
    return this.symbolsDecorable.length > 0
  }

  get hasSingleMathSymbol(): boolean
  {
    const selected = this.editor.model.symbolsSelected
    return selected.length === 1 && isRecognizedMath(selected[0])
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement
  {
    const idPrefix = this.config.idPrefix

    const trigger = document.createElement("button")
    trigger.id = `${idPrefix}-decorator-${kind}`
    trigger.classList.add("ms-menu-button")
    const labelEL = document.createElement("span")
    labelEL.innerText = label
    trigger.appendChild(labelEL)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-column")

    // Enable checkbox
    const enableWrapper = document.createElement("div")
    enableWrapper.classList.add("ms-menu-item", "checkbox")
    const enableLabel = document.createElement("span")
    enableLabel.textContent = "Enable"
    enableWrapper.appendChild(enableLabel)
    const checkbox = document.createElement("input")
    checkbox.id = `${idPrefix}-decorator-${kind}-enable`
    checkbox.setAttribute("type", "checkbox")
    checkbox.checked = false
    checkbox.addEventListener("change", (e) => {
      const enable = (e.target as HTMLInputElement).checked
      const symbolsDecorable = this.symbolsDecorable

      symbolsDecorable.forEach(s => {
        if (enable) {
          if (!s.decorators.some(d => d.kind === kind)) {
            s.decorators.push(new IIDecorator(kind, this.editor.penStyle))
          }
        }
        else {
          const decoIndex = s.decorators.findIndex(d => d.kind === kind)
          if (decoIndex > -1) {
            s.decorators.splice(decoIndex, 1)
          }
        }
      })
      this.editor.updateSymbols(symbolsDecorable)

      document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach(b => {
        (b as HTMLButtonElement).disabled = !enable
        b.classList.remove("active")
      })
      if (enable) {
        document.querySelector(`#${idPrefix}-decorator-${kind}-color button`)?.classList.add("active")
      }
    })
    enableWrapper.appendChild(checkbox)
    subMenuWrapper.appendChild(enableWrapper)

    // Color list
    const colorWrapper = document.createElement("div")
    colorWrapper.classList.add("ms-menu-item", "colors")
    colorWrapper.id = `${idPrefix}-decorator-${kind}-color`
    const colorLabel = document.createElement("span")
    colorLabel.textContent = "Colors"
    colorWrapper.appendChild(colorLabel)

    const colorList = document.createElement("div")
    colorList.id = `${idPrefix}-decorator-${kind}-color-list`
    colorList.classList.add("ms-menu-row", "color-list")

    const colors = DEFAULT_MENU_COLORS.filter((_c, i) => !(i % 4))
    colors.forEach((color) => {
      const btn = document.createElement("button")
      btn.disabled = true
      btn.id = `${idPrefix}-decorator-${kind}-color-${color.replace("#", "")}-btn`
      btn.classList.add("ms-menu-button", "square")
      const colorEl = document.createElement("div")
      colorEl.classList.add("color")
      colorEl.style.setProperty("background-color", "transparent")
      colorEl.style.setProperty("border", `3px solid ${color}`)
      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }
      if (color === "transparent") {
        colorEl.style.setProperty("background-image", "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)")
      }
      btn.appendChild(colorEl)
      btn.addEventListener("pointerup", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const symbolsDecorable = this.symbolsDecorable

        symbolsDecorable.forEach(s => {
          const deco = s.decorators.find(d => d.kind === kind)
          if (deco) {
            deco.style.color = color
          }
        })
        this.editor.updateSymbols(symbolsDecorable.filter(s => s.decorators.some(d => d.kind === kind)))
        colorList.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
      })
      colorList.appendChild(btn)
    })

    colorWrapper.appendChild(colorList)
    subMenuWrapper.appendChild(colorWrapper)

    const wrapper = document.createElement("div")
    wrapper.classList.add("sub-menu")
    wrapper.appendChild(trigger)

    const content = document.createElement("div")
    content.classList.add("sub-menu-content", "right")
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
    const subMenuHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    this.#subMenuPointerdownHandlers.push(subMenuHandler)
    document.addEventListener("pointerdown", subMenuHandler)

    return wrapper
  }

  createElement(): HTMLElement
  {
    const enabled = (key: keyof TContextDecoratorItemsConfig) => this.#itemsConfig?.[key] !== false

    const trigger = document.createElement("button")
    trigger.id = this.config.id
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Decorator"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-column")

    if (enabled("highlight")) subMenuWrapper.appendChild(this.createDecoratorSubMenu("Hightlight", DecoratorKind.Highlight))
    if (enabled("surround")) subMenuWrapper.appendChild(this.createDecoratorSubMenu("Surround", DecoratorKind.Surround))
    if (enabled("underline")) subMenuWrapper.appendChild(this.createDecoratorSubMenu("Underline", DecoratorKind.Underline))
    if (enabled("strikethrough")) subMenuWrapper.appendChild(this.createDecoratorSubMenu("Strikethrough", DecoratorKind.Strikethrough))

    const wrapper = document.createElement("div")
    wrapper.classList.add("sub-menu")
    wrapper.appendChild(trigger)

    const content = document.createElement("div")
    content.classList.add("sub-menu-content", "right")
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return wrapper
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    this.#subMenuPointerdownHandlers.forEach(h => document.removeEventListener("pointerdown", h))
    this.#subMenuPointerdownHandlers = []
    super.destroy()
  }

  update(): void
  {
    this.updateDisabled()
    this.updateVisible()

    const idPrefix = this.config.idPrefix
    const wrapper = this.getElement()

    if (this.showDecorator && !this.hasSingleMathSymbol) {
      wrapper.style.removeProperty("display")

      Object.values(DecoratorKind).forEach(kind =>
      {
        const checkbox = document.getElementById(`${idPrefix}-decorator-${kind}-enable`) as HTMLInputElement
        if (checkbox) {
          document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach(e => e.classList.remove("active"))
          const decos = this.symbolsDecorable.flatMap(s => s.decorators).filter(d => d.kind === kind)

          if (decos.length && decos.every(d => d.style.color === decos[0].style.color)) {
            const btnToActivate = document.getElementById(`${idPrefix}-decorator-${kind}-color-${decos[0].style.color?.replace("#", "")}-btn`)
            btnToActivate?.classList.add("active")
          }

          if (this.symbolsDecorable.filter(s => s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = true

            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
            checkbox.indeterminate = false
          }
          else if (this.symbolsDecorable.filter(s => !s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = false
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = true
            })
            checkbox.indeterminate = false
          }
          else {
            checkbox.setAttribute("indeterminate", "true")
            checkbox.indeterminate = true
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
          }
        }
      })
    }
    else {
      wrapper.style.setProperty("display", "none")
    }
  }
}
