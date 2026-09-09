import ballpointIcon from "@/assets/svg/nib-ballpoint.svg"
import brushIcon from "@/assets/svg/nib-brush.svg"
import fountainIcon from "@/assets/svg/nib-fountain.svg"
import pencilIcon from "@/assets/svg/nib-pencil.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import type { TMenuItemBase } from "@/menu/items/BaseMenuItem"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import type { TPenNib } from "@/style"
import { DEFAULT_PEN_NIB, isPenNib } from "@/style"

type TWriteToolConfig = TMenuItemBase & {
  type: "write"
}

/** The nibs offered, in the order they appear, from the most uniform line to the most expressive. */
const NIBS: { nib: TPenNib; icon: string; label: string }[] = [
  { nib: "ballpoint", icon: ballpointIcon, label: "Ballpoint" },
  { nib: "pencil", icon: pencilIcon, label: "Pencil" },
  { nib: "fountain", icon: fountainIcon, label: "Fountain pen" },
  { nib: "brush", icon: brushIcon, label: "Brush" },
]

/**
 * @group Menu
 * @remarks Write tool - picks the pencil and the nib it draws with
 */
export class WriteTool extends BaseMenuItem<HTMLDivElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  private subMenuButtons: Map<TPenNib, HTMLButtonElement> = new Map()
  private triggerButton?: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-tool") {
    const config: TWriteToolConfig = {
      type: "write",
      id: `${idPrefix}-write-pencil`,
      label: "Write",
    }
    super(config, canvas)
  }

  /** The nib currently on the pen, falling back to the default when the style names none. */
  private get currentNib(): TPenNib {
    return isPenNib(this.canvas.penStyle.pen) ? this.canvas.penStyle.pen : DEFAULT_PEN_NIB
  }

  private iconFor(nib: TPenNib): string {
    return NIBS.find((entry) => entry.nib === nib)?.icon ?? pencilIcon
  }

  private createNibButton(icon: string, nib: TPenNib, label: string): HTMLButtonElement {
    const button = this.dom.button({
      id: `${this.config.id}-${nib}`,
      className: "square",
      html: icon,
    })
    button.title = label

    button.addEventListener("click", () => {
      this.unselectAll()
      this.canvas.tool = CanvasTool.Write
      this.canvas.writer.tool = CanvasWriteTool.Pencil
      // Written onto the pen style rather than held here: the nib travels with each stroke, so a
      // document reopened later redraws with the nib it was written with.
      this.canvas.penStyle = { pen: nib }

      if (this.triggerButton) {
        this.triggerButton.innerHTML = icon
        this.triggerButton.classList.add("active")
      }
      button.classList.add("active")
      this.element?.querySelector(".sub-menu-content")?.classList.remove("open")
    })

    this.subMenuButtons.set(nib, button)
    return button
  }

  createElement(): HTMLDivElement {
    this.triggerButton = this.dom.button({
      id: this.config.id,
      className: "square",
      html: this.iconFor(this.currentNib),
    })
    // The trigger is the write tool itself: a single tap picks up the pencil with the nib already
    // chosen, and only a second tap on it opens the choice of nibs.
    this.triggerButton.addEventListener("click", () => {
      this.unselectAll()
      this.canvas.tool = CanvasTool.Write
      this.canvas.writer.tool = CanvasWriteTool.Pencil
      this.triggerButton?.classList.add("active")
    })

    const subMenuContent = this.dom.div({
      id: `${this.config.id}-list`,
      className: ["ms-menu-row", "sub-menu-content-shape"],
    })
    NIBS.forEach(({ nib, icon, label }) => subMenuContent.appendChild(this.createNibButton(icon, nib, label)))

    const content = this.dom.div({ className: ["sub-menu-content", "top"] })
    content.appendChild(subMenuContent)

    const wrapper = this.dom.div({ className: "sub-menu" })
    wrapper.appendChild(this.triggerButton)
    wrapper.appendChild(content)

    this.triggerButton.addEventListener("pointerdown", () => content.classList.toggle("open"))
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
    if (!this.element || !this.triggerButton) {
      return
    }

    const isActive = this.canvas.tool === CanvasTool.Write && this.canvas.writer.tool === CanvasWriteTool.Pencil
    const nib = this.currentNib

    this.triggerButton.innerHTML = this.iconFor(nib)
    this.subMenuButtons.forEach((button, key) => button.classList.toggle("active", isActive && key === nib))

    if (isActive) {
      this.triggerButton.classList.add("active")
    } else {
      this.triggerButton.classList.remove("active")
    }

    this.updateDisabled()
    this.updateVisible()
  }

  private unselectAll(): void {
    const menu = this.element?.closest(".ms-menu")
    menu?.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
  }
}
