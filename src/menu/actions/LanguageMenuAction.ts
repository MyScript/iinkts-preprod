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
      label: canvas.i18n.t("menu.action.language"),
      menuTitle: canvas.i18n.t("menu.action.language"),
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
        this.changeLanguage(value)
      },
    })
    this.subMenuWrapper?.appendChild(this.select)
    this.loadLanguages(this.select)
    return wrapper
  }

  /**
   * Opens a session in `lang`; the canvas veils itself meanwhile and rebuilds the menus in that language once done.
   * When the server refused it, the select comes back to the current language, the error already reported.
   */
  protected async changeLanguage(lang: string): Promise<void> {
    try {
      await this.canvas.updateRecognitionConfiguration({ lang })
    } catch (error) {
      this.logger.warn(`${this.config.id}.change`, error)
      this.update()
    }
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
