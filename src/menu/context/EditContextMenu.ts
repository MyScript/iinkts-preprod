import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import { BoxOps, createUUID, OBBOps } from "@/core"
import type { TSymbol, TText } from "@/symbol"
import { isText } from "@/symbol"
import { SymbolGeometry, TextUtil } from "@/symbol-utils"

import type { TGenericMenuItem } from "../items/BaseMenuItem"
import { BaseMenuItem } from "../items/BaseMenuItem"
/**
 * @group Menu
 * @remarks Edit context menu: edits the selected texts, one word per text symbol.
 * The words are shown in reading order, one line per row of text, and written back in that order;
 * the last text takes any extra words, and texts left without a word are removed.
 */
export class EditContextMenu extends BaseMenuItem<HTMLElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  declare protected config: TGenericMenuItem
  editInput?: HTMLTextAreaElement
  editSaveBtn?: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TGenericMenuItem = {
      type: "custom",
      id: `${idPrefix}-edit`,
      label: canvas.i18n.t("menu.context.edit"),
      visible: (c) => EditContextMenu.isTextSelection(c.model.symbolsSelected),
    }
    super(config, canvas)
  }

  createElement(): HTMLElement {
    const trigger = this.dom.button({
      id: `${this.config.id}-trigger`,
    })
    const label = this.dom.span({ text: this.canvas.i18n.t("menu.context.edit") })
    trigger.appendChild(label)
    const icon = this.dom.span({
      html: ArrowDown,
    })
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    this.editInput = this.dom.textarea({})
    subMenuWrapper.appendChild(this.editInput)

    this.editSaveBtn = this.dom.button({
      label: this.canvas.i18n.t("menu.context.edit.save"),
    })
    subMenuWrapper.appendChild(this.editSaveBtn)

    this.editSaveBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation()
      void this.save()
    })

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
    super.destroy()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
    if (this.editInput && EditContextMenu.isTextSelection(this.canvas.model.symbolsSelected)) {
      this.editInput.value = this.getSelectedTextLines()
        .map((line) => line.map((t) => TextUtil.getLabel(t)).join(" "))
        .join("\n")
    }
  }

  /** True when the selection is made of texts only */
  static isTextSelection(symbols: TSymbol[]): boolean {
    return symbols.length > 0 && symbols.every(isText)
  }

  /** The selected texts grouped into reading lines */
  protected getSelectedTextLines(): TText[][] {
    const texts = this.canvas.model.symbolsSelected.filter(isText)
    return BoxOps.groupIntoLines(texts, (t) => OBBOps.toBox(SymbolGeometry.boundsOf(t)))
  }

  /**
   * Split the edited value into one label per text: a word each, the last text taking the remaining
   * words. Fewer words than texts leaves the extra texts without a label.
   */
  static distributeWords(value: string, textCount: number): string[] {
    const words = value.split(/\s+/).filter(Boolean)
    if (words.length <= textCount) {
      return words
    }
    return [...words.slice(0, textCount - 1), words.slice(textCount - 1).join(" ")]
  }

  /** Write the edited value back to the selected texts, as one undo step for the rewrite */
  protected async save(): Promise<void> {
    const texts = this.getSelectedTextLines().flat()
    const labels = EditContextMenu.distributeWords(this.editInput?.value ?? "", texts.length)
    if (!labels.length) {
      return
    }
    const changed = new Map<string, string>()
    texts.forEach((t, i) => {
      if (labels[i] !== undefined && labels[i] !== TextUtil.getLabel(t)) {
        changed.set(t.id, labels[i])
      }
    })
    const removedIds = texts.slice(labels.length).map((t) => t.id)
    try {
      // The patch rewrites the chars of each draft; the canvas re-measures and commits them
      const updated = changed.size
        ? await this.canvas.updateSymbols([...changed.keys()], (draft) => {
            const label = changed.get(draft.id)
            if (isText(draft) && label !== undefined) {
              EditContextMenu.rewriteChars(draft, label)
            }
          })
        : []
      if (removedIds.length) {
        await this.canvas.removeSymbols(removedIds)
      }
      if (updated.length || removedIds.length) {
        const kept = texts.slice(0, labels.length).flatMap((t) => this.canvas.model.getSymbol(t.id) ?? [])
        this.canvas.selector.drawSelectedGroup(kept)
      }
    } catch (error) {
      // Reported rather than swallowed: the edit would otherwise end with no redraw and no feedback
      this.canvas.manageError(error as Error)
    }
  }

  /** Replace the chars of a text with the given label, keeping the style of its first char */
  protected static rewriteChars(text: Pick<TText, "chars">, label: string): void {
    const firstChar = text.chars[0]
    text.chars = Array.from(label).map((char) => ({
      label: char,
      id: createUUID(),
      color: firstChar.color,
      fontSize: firstChar.fontSize,
      fontWeight: firstChar.fontWeight,
      bounds: firstChar.bounds,
    }))
  }
}
