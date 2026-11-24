import type { TInteractiveInkCanvas } from "@/canvas"
import { getAvailableLanguageList } from "@/client"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu action Language - picks the recognition language among the ones the server offers
 */
export class LanguageMenuAction extends SubMenuItem {
  private select?: HTMLSelectElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-language`,
      label: "Language",
      menuTitle: "Language",
      position: "right-top",
      items: [],
    }
    super(config, canvas)
  }

  createElement(): HTMLDivElement {
    const wrapper = super.createElement()
    this.select = this.dom.select({
      id: `${this.config.id}-input`,
      options: [],
      className: "select-language",
      onChange: (value) => {
        this.logger.info(`${this.config.id}.change`)
        this.canvas.updateRecognitionConfiguration({ lang: value })
      },
    })
    this.subMenuWrapper?.appendChild(this.select)
    this.loadLanguages(this.select)
    return wrapper
  }

  /** Fills `select` with the languages the server offers, the current one selected */
  protected loadLanguages(select: HTMLSelectElement): void {
    getAvailableLanguageList(this.canvas.configuration)
      .then((json) => {
        const languages = json.result as Record<string, string>
        for (const key in languages) {
          const selected = key === this.canvas.configuration.recognition.lang
          select.appendChild(new Option(languages[key], key, selected, selected))
        }
      })
      // No list to pick from: the select stays empty and recognition keeps its language
      .catch((error) => this.logger.error("getAvailableLanguageList", error))
  }

  update(): void {
    if (this.select) {
      this.select.value = this.canvas.configuration.recognition.lang
    }
    super.update()
  }
}
