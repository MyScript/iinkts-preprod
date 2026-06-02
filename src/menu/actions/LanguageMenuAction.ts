import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { getAvailableLanguageList } from "@/utils"
import languageIcon from "@/assets/svg/language.svg"

/**
 * @group Menu
 * @remarks Menu action Language - Sélection de la langue
 */
export class LanguageMenuAction extends BaseMenuItem<HTMLDivElement>
{
  private select!: HTMLSelectElement
  private subMenuWrapper!: HTMLDivElement
  private subMenuContent!: HTMLDivElement

  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const config = {
      type: "language" as const,
      id: `${idPrefix}-language`,
      label: "Language"
    }
    super(config, editor)
  }

  createElement(): HTMLDivElement
  {
    const triggerBtn = document.createElement("button")
    triggerBtn.id = `${this.config.id}-trigger`
    triggerBtn.classList.add("ms-menu-button", "square")
    triggerBtn.innerHTML = languageIcon

    this.select = document.createElement("select")
    this.select.classList.add("select-language")
    this.select.id = this.config.id

    // Chargement asynchrone des langues disponibles
    getAvailableLanguageList(this.editor.configuration)
      .then(json => {
        const languages = json.result as { [key: string]: string }
        for (const key in languages) {
          const selected = key === this.editor.configuration.recognition.lang
          const opt = new Option(languages[key], key, selected, selected)
          this.select.appendChild(opt)
        }
      })

    this.select.addEventListener("change", (e) => {
      this.logger.info(`${this.config.id}.change`)
      const value = (e.target as HTMLSelectElement).value
      this.editor.changeLanguage(value)
    })

    this.subMenuWrapper = document.createElement("div")
    this.subMenuWrapper.classList.add("sub-menu")
    this.subMenuWrapper.appendChild(triggerBtn)

    this.subMenuContent = document.createElement("div")
    this.subMenuContent.classList.add("sub-menu-content", "bottom-right")
    this.subMenuContent.appendChild(this.select)
    this.subMenuWrapper.appendChild(this.subMenuContent)

    // Event listeners
    triggerBtn.addEventListener("pointerdown", () => this.subMenuContent.classList.toggle("open"))
    document.addEventListener("pointerdown", (e) => {
      if (!this.subMenuWrapper.contains(e.target as HTMLElement)) {
        this.subMenuContent.classList.remove("open")
      }
    })

    return this.subMenuWrapper
  }

  /**
   * Wraps/unwraps according to screen size (mobile)
   */
  wrap(): void
  {
    if (this.subMenuContent && this.subMenuWrapper) {
      this.subMenuContent.classList.add("sub-menu-content")
      this.subMenuWrapper.appendChild(this.subMenuContent)
      this.subMenuWrapper.style.display = "block"
    }
  }

  unwrap(): void
  {
    if (this.subMenuContent && this.subMenuWrapper) {
      this.subMenuContent.classList.remove("sub-menu-content")
      this.subMenuWrapper.insertAdjacentElement("beforebegin", this.subMenuContent)
      this.subMenuWrapper.style.display = "none"
    }
  }

  update(): void
  {
    if (this.select) {
      this.select.value = this.editor.configuration.recognition.lang
    }
    this.updateDisabled()
    this.updateVisible()
  }
}
