import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import type { TDraft } from "@/core"
import { OBBOps, uniqueById } from "@/core"
import { appendUpdated, type TIIHistoryChanges } from "@/history"
import type { TDecorator, TMath, TStroke, TSymbol, TText } from "@/symbol"
import { DecoratorKind, isDecorator, isMath, isStroke, isText } from "@/symbol"
import { DecoratorUtil, SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import type { TGenericMenuItem } from "../items/BaseMenuItem"
import { BaseMenuItem } from "../items/BaseMenuItem"
import { DEFAULT_MENU_COLORS } from "../MenuConstants"

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
 * @remarks A symbol the decorator menu decorates: a text or a math inside it, a stroke through a
 * standalone decorator
 */
export type TDecorable = TStroke | TText | TMath

/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
export class DecoratorContextMenu extends BaseMenuItem<HTMLElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  #subMenuPointerdownHandlers: Array<(e: PointerEvent) => void> = []
  declare protected config: TGenericMenuItem & {
    idPrefix: string
  }
  #itemsConfig?: TContextDecoratorItemsConfig

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context", itemsConfig?: TContextDecoratorItemsConfig) {
    const config: TGenericMenuItem & {
      idPrefix: string
    } = {
      type: "custom",
      id: `${idPrefix}-decorator`,
      label: canvas.i18n.t("menu.context.decorator"),
      idPrefix,
    }
    super(config, canvas)
    this.#itemsConfig = itemsConfig
  }

  /** The selected strokes, texts and maths: the symbols a decorator can be set on */
  get symbolsDecorable(): TDecorable[] {
    return this.canvas.model.symbolsSelected.filter((s): s is TDecorable => isStroke(s) || isText(s) || isMath(s))
  }

  get showDecorator(): boolean {
    return this.symbolsDecorable.length > 0
  }

  /**
   * The decorators of `kind` on `symbol`: a text or a math carries its own, a stroke is targeted by
   * standalone ones.
   */
  decoratorsOf(symbol: TDecorable, kind: DecoratorKind): TDecorator[] {
    if (isStroke(symbol)) {
      const standalone = this.canvas.model.decoratorsByTargetId.get(symbol.id) ?? []
      return standalone.filter((d): d is TDecorator => isDecorator(d) && d.kind === kind)
    }
    return symbol.decorators.filter((d) => d.kind === kind)
  }

  /**
   * Sets or removes the decorator of `kind` on every decorable symbol selected, in one undo step:
   * inside each text and math, and as one standalone decorator across the strokes that lack it.
   * Removing it from strokes shrinks a decorator also targeting strokes left out of the selection.
   */
  setDecorator(kind: DecoratorKind, enable: boolean): void {
    const changes: TIIHistoryChanges = {}
    const symbols = this.symbolsDecorable
    const strokes = symbols.filter(isStroke)
    symbols.filter((s) => !isStroke(s)).forEach((s) => this.#setTypesetDecorator(s.id, kind, enable, changes))
    if (enable) {
      this.#addStrokesDecorator(
        strokes.filter((s) => !this.decoratorsOf(s, kind).length),
        kind,
        changes
      )
    } else {
      this.#removeStrokesDecorator(strokes, kind, changes)
    }
    this.#pushHistory(changes)
  }

  /** Colors the decorators of `kind` on every decorable symbol selected, in one undo step */
  setDecoratorColor(kind: DecoratorKind, color: string): void {
    const changes: TIIHistoryChanges = {}
    const symbols = this.symbolsDecorable
    symbols.filter((s) => !isStroke(s)).forEach((s) => this.#colorTypesetDecorator(s.id, kind, color, changes))
    const standalone = uniqueById(symbols.filter(isStroke).flatMap((s) => this.decoratorsOf(s, kind)))
    standalone.forEach((dec) =>
      this.#updateDecorator(dec, changes, (draft) => (draft.style = { ...draft.style, color }))
    )
    this.#pushHistory(changes)
  }

  #setTypesetDecorator(id: string, kind: DecoratorKind, enable: boolean, changes: TIIHistoryChanges): void {
    const before = this.canvas.model.getSymbol(id)
    if (!before || !(isText(before) || isMath(before))) {
      return
    }
    if (before.decorators.some((d) => d.kind === kind) === enable) {
      return
    }
    this.#updateTypeset(before, changes, (draft) => {
      draft.decorators = enable
        ? [...draft.decorators, DecoratorUtil.createDecorator(kind, this.canvas.penStyle)]
        : draft.decorators.filter((d) => d.kind !== kind)
    })
  }

  #colorTypesetDecorator(id: string, kind: DecoratorKind, color: string, changes: TIIHistoryChanges): void {
    const before = this.canvas.model.getSymbol(id)
    if (!before || !(isText(before) || isMath(before)) || !before.decorators.some((d) => d.kind === kind)) {
      return
    }
    this.#updateTypeset(before, changes, (draft) => {
      draft.decorators = draft.decorators.map((d) => (d.kind === kind ? { ...d, style: { ...d.style, color } } : d))
    })
  }

  /** A text or math carries its decorators inside it: changing them on a locked one is refused */
  #updateTypeset(
    before: TText | TMath,
    changes: TIIHistoryChanges,
    change: (draft: TDraft<TText | TMath>) => void
  ): void {
    if (before.locked) {
      this.canvas.event.emitLockedRefused([before])
      return
    }
    const draft = this.canvas.model.draftSymbol(before.id)
    if (draft && (isText(draft) || isMath(draft))) {
      change(draft)
      this.#commit(before, draft, changes)
    }
  }

  #updateDecorator(before: TDecorator, changes: TIIHistoryChanges, change: (draft: TDraft<TDecorator>) => void): void {
    if (before.locked) {
      this.canvas.event.emitLockedRefused([before])
      return
    }
    const draft = this.canvas.model.draftSymbol(before.id)
    if (draft && isDecorator(draft)) {
      change(draft)
      this.#commit(before, draft, changes)
    }
  }

  #commit(before: TSymbol, draft: TDraft<TSymbol>, changes: TIIHistoryChanges): void {
    this.canvas.model.commitSymbol(draft)
    this.canvas.renderer.drawSymbol(draft)
    appendUpdated(changes, [{ before, after: this.canvas.model.getSymbol(before.id) ?? draft }])
  }

  #addStrokesDecorator(strokes: TStroke[], kind: DecoratorKind, changes: TIIHistoryChanges): void {
    if (!strokes.length) {
      return
    }
    const decorator = DecoratorUtil.createDecorator(
      kind,
      this.canvas.penStyle,
      strokes.map((s) => s.id)
    )
    DecoratorUtil.setTargetBounds(decorator, OBBOps.createFromOBBs(strokes.map((s) => SymbolGeometry.boundsOf(s))))
    this.canvas.model.addSymbol(decorator)
    this.canvas.renderer.drawSymbol(decorator)
    ;(changes.added ??= []).push(decorator)
  }

  #removeStrokesDecorator(strokes: TStroke[], kind: DecoratorKind, changes: TIIHistoryChanges): void {
    const strokeIds = new Set(strokes.map((s) => s.id))
    uniqueById(strokes.flatMap((s) => this.decoratorsOf(s, kind))).forEach((dec) => {
      const remaining = dec.targetIds.filter((id) => !strokeIds.has(id))
      if (remaining.length || dec.locked) {
        this.#updateDecorator(dec, changes, (draft) => this.#shrinkDecorator(draft, remaining))
        return
      }
      this.canvas.model.removeSymbol(dec.id)
      this.canvas.renderer.removeElement(dec.id)
      ;(changes.erased ??= []).push(dec)
    })
  }

  /** Keeps a decorator on the targets left out of the selection, its box refitted around them */
  #shrinkDecorator(draft: TDraft<TDecorator>, remaining: string[]): void {
    draft.targetIds = remaining
    const targets = remaining
      .map((id) => this.canvas.model.getSymbol(id))
      .filter((s): s is TSymbol => !!s && symbolRegistry.has(s.type))
    if (targets.length) {
      DecoratorUtil.refitTargetBounds(
        draft,
        targets.map((s) => SymbolGeometry.boundsOf(s))
      )
    }
  }

  #pushHistory(changes: TIIHistoryChanges): void {
    if (changes.added || changes.erased || changes.updated) {
      this.canvas.history.push(changes)
    }
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement {
    const idPrefix = this.config.idPrefix

    const trigger = this.dom.button({
      id: `${idPrefix}-decorator-${kind}`,
    })
    const labelEL = this.dom.span({ text: label })
    trigger.appendChild(labelEL)
    const icon = this.dom.span({})
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    // Enable checkbox
    const enableWrapper = this.dom.div({
      className: ["ms-menu-item", "checkbox"],
    })
    const enableLabel = this.dom.span({
      text: this.canvas.i18n.t("common.enable"),
    })
    enableWrapper.appendChild(enableLabel)
    const checkbox = this.dom.checkbox({
      id: `${idPrefix}-decorator-${kind}-enable`,
      checked: false,
    })
    checkbox.addEventListener("change", (e) => {
      const enable = (e.target as HTMLInputElement).checked
      this.setDecorator(kind, enable)

      document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
        ;(b as HTMLButtonElement).disabled = !enable
        b.classList.remove("active")
      })
      if (enable) {
        document.querySelector(`#${idPrefix}-decorator-${kind}-color button`)?.classList.add("active")
      }
    })
    enableWrapper.appendChild(checkbox)
    subMenuWrapper.appendChild(enableWrapper)

    // Color list
    const colorWrapper = this.dom.div({
      id: `${idPrefix}-decorator-${kind}-color`,
      className: ["ms-menu-item", "colors"],
    })
    const colorLabel = this.dom.span({
      text: this.canvas.i18n.t("common.colors"),
    })
    colorWrapper.appendChild(colorLabel)

    const colorList = this.dom.div({
      id: `${idPrefix}-decorator-${kind}-color-list`,
      className: ["ms-menu-row", "list"],
    })

    const colors = DEFAULT_MENU_COLORS.filter((_c, i) => !(i % 4))
    colors.forEach((color) => {
      const btn = this.dom.button({
        id: `${idPrefix}-decorator-${kind}-color-${color.replace("#", "")}-btn`,
        className: "square",
      })
      btn.disabled = true
      const colorEl = this.dom.div({
        className: "color",
      })
      colorEl.style.setProperty("background-color", "transparent")
      colorEl.style.setProperty("border", `3px solid ${color}`)
      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }
      if (color === "transparent") {
        colorEl.style.setProperty(
          "background-image",
          "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)"
        )
      }
      btn.appendChild(colorEl)
      btn.addEventListener("pointerup", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.setDecoratorColor(kind, color)
        colorList.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
        btn.classList.add("active")
      })
      colorList.appendChild(btn)
    })

    colorWrapper.appendChild(colorList)
    subMenuWrapper.appendChild(colorWrapper)

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(trigger)

    const content = this.dom.div({
      className: ["sub-menu-content", "right"],
    })
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

  createElement(): HTMLElement {
    const enabled = (key: keyof TContextDecoratorItemsConfig) => this.#itemsConfig?.[key] !== false

    const trigger = this.dom.button({
      id: this.config.id,
    })
    const label = this.dom.span({
      text: this.canvas.i18n.t("menu.context.decorator"),
    })
    trigger.appendChild(label)
    const icon = this.dom.span({})
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    if (enabled("highlight")) {
      subMenuWrapper.appendChild(
        this.createDecoratorSubMenu(this.canvas.i18n.t("menu.context.decorator.highlight"), DecoratorKind.Highlight)
      )
    }
    if (enabled("surround")) {
      subMenuWrapper.appendChild(
        this.createDecoratorSubMenu(this.canvas.i18n.t("menu.context.decorator.surround"), DecoratorKind.Surround)
      )
    }
    if (enabled("underline")) {
      subMenuWrapper.appendChild(
        this.createDecoratorSubMenu(this.canvas.i18n.t("menu.context.decorator.underline"), DecoratorKind.Underline)
      )
    }
    if (enabled("strikethrough")) {
      subMenuWrapper.appendChild(
        this.createDecoratorSubMenu(
          this.canvas.i18n.t("menu.context.decorator.strikethrough"),
          DecoratorKind.Strikethrough
        )
      )
    }

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(trigger)

    const content = this.dom.div({
      className: ["sub-menu-content", "right"],
    })
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
    this.#subMenuPointerdownHandlers.forEach((h) => document.removeEventListener("pointerdown", h))
    this.#subMenuPointerdownHandlers = []
    super.destroy()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()

    const idPrefix = this.config.idPrefix
    const wrapper = this.getElement()

    if (this.showDecorator) {
      wrapper.style.removeProperty("display")

      const symbols = this.symbolsDecorable
      Object.values(DecoratorKind).forEach((kind) => {
        const checkbox = document.getElementById(`${idPrefix}-decorator-${kind}-enable`) as HTMLInputElement
        if (checkbox) {
          document
            .querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`)
            .forEach((e) => e.classList.remove("active"))
          const decosBySymbol = symbols.map((s) => this.decoratorsOf(s, kind))
          const decos = decosBySymbol.flat()
          const decoratedCount = decosBySymbol.filter((d) => d.length).length

          if (decos.length && decos.every((d) => d.style.color === decos[0].style.color)) {
            const btnToActivate = document.getElementById(
              `${idPrefix}-decorator-${kind}-color-${decos[0].style.color?.replace("#", "")}-btn`
            )
            btnToActivate?.classList.add("active")
          }

          if (decoratedCount === symbols.length) {
            checkbox.checked = true

            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = false
            })
            checkbox.indeterminate = false
          } else if (decoratedCount === 0) {
            checkbox.checked = false
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = true
            })
            checkbox.indeterminate = false
          } else {
            // Unchecked under the mixed state: a click checks it, which sets the decorator on every
            // symbol. Left checked from an earlier state, the click unchecked it and removed it instead.
            checkbox.checked = false
            checkbox.setAttribute("indeterminate", "true")
            checkbox.indeterminate = true
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = false
            })
          }
        }
      })
    } else {
      wrapper.style.setProperty("display", "none")
    }
  }
}
