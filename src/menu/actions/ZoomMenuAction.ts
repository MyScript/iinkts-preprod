import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import zoomInIcon from "@/assets/svg/zoom-in.svg"
import zoomOutIcon from "@/assets/svg/zoom-out.svg"

/**
 * @group Menu
 * @remarks Menu action Zoom (In + Level + Out)
 */
export class ZoomMenuAction extends BaseMenuItem<HTMLDivElement>
{
  private zoomInButton!: HTMLButtonElement
  private zoomLevelSpan!: HTMLSpanElement
  private zoomOutButton!: HTMLButtonElement

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config = {
      type: "zoom" as const,
      id: `${idPrefix}-zoom`,
      label: "Zoom"
    }
    super(config, editor)
  }

  createElement(): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.id = this.config.id
    wrapper.classList.add("ms-menu-zoom-group", "ms-menu-row")

    // Bouton Zoom In
    this.zoomInButton = document.createElement("button")
    this.zoomInButton.id = `${this.config.id}-in`
    this.zoomInButton.classList.add("ms-menu-button", "square")
    this.zoomInButton.innerHTML = zoomInIcon
    this.zoomInButton.addEventListener("pointerup", () => {
      const currentZoom = this.editor.renderer.getZoom()
      this.editor.renderer.setZoom(currentZoom * 1.2)
      this.updateZoomLevel()
    })

    // Affichage du niveau de zoom
    this.zoomLevelSpan = document.createElement("span")
    this.zoomLevelSpan.id = `${this.config.id}-level`
    this.zoomLevelSpan.classList.add("ms-menu-zoom-level")
    this.zoomLevelSpan.addEventListener("click", () => {
      this.editor.renderer.setZoom(1)
      this.updateZoomLevel()
    })
    this.updateZoomLevel()

    // Bouton Zoom Out
    this.zoomOutButton = document.createElement("button")
    this.zoomOutButton.id = `${this.config.id}-out`
    this.zoomOutButton.classList.add("ms-menu-button", "square")
    this.zoomOutButton.innerHTML = zoomOutIcon
    this.zoomOutButton.addEventListener("pointerup", () => {
      const currentZoom = this.editor.renderer.getZoom()
      this.editor.renderer.setZoom(currentZoom / 1.2)
      this.updateZoomLevel()
    })

    wrapper.appendChild(this.zoomInButton)
    wrapper.appendChild(this.zoomLevelSpan)
    wrapper.appendChild(this.zoomOutButton)

    return wrapper
  }

  private updateZoomLevel(): void
  {
    if (this.zoomLevelSpan) {
      const zoom = this.editor.renderer.getZoom()
      this.zoomLevelSpan.textContent = `${Math.round(zoom * 100)}%`
    }
  }

  update(): void
  {
    this.updateZoomLevel()
    this.updateDisabled()
    this.updateVisible()
  }
}
