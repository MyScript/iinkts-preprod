import type { TPartialDeep } from "@/core"

import { TranslationsEn } from "./TranslationsEn"
import { TranslationsFr } from "./TranslationsFr"

/**
 * @group I18n
 * @summary A label the library shows, by the key it looks it up with
 */
export type TTranslationKey = keyof typeof TranslationsEn

/**
 * @group I18n
 * @summary Labels of one language, by key: built-in keys are typed, any other key is a label of the integrator's own
 */
export type TTranslations = Partial<Record<TTranslationKey, string>> & Record<string, string>

/**
 * @group I18n
 * @summary Labels by language code: a language (`fr`) or a language and its region (`fr_FR`)
 * @example
 * ```ts
 * { fr: { "menu.action.clear": "Tout effacer" }, de: { "menu.action.clear": "Löschen" } }
 * ```
 */
export type TTranslationsConfiguration = Record<string, TTranslations>

/**
 * @group I18n
 * @summary Values replacing the `{name}` placeholders of a label
 */
export type TTranslationParams = Record<string, string | number>

const BUILT_IN_TRANSLATIONS: TTranslationsConfiguration = { en: TranslationsEn, fr: TranslationsFr }

const FALLBACK_LANGUAGE = "en"

/**
 * @group I18n
 * @summary Translates the labels of the library into the language of the recognition
 * @remarks A label is looked up in the language with its region (`fr_FR`), then in the language (`fr`), then in
 * English; at each level the integrator's labels win over the built-in ones. A key no level knows is shown as is.
 * @example
 * ```ts
 * canvas.i18n.add("fr", { "menu.action.clear": "Tout effacer", "my.button": "Télécharger" })
 * canvas.i18n.t("my.button") // "Télécharger" while the recognition is in French
 * ```
 */
export class Translator {
  #language: string
  #custom: TTranslationsConfiguration = {}
  #resolved: Record<string, string> = {}
  #listeners = new Set<() => void>()

  constructor(translations?: TPartialDeep<TTranslationsConfiguration>, language = FALLBACK_LANGUAGE) {
    this.#language = language
    // Coming from a deep-partial configuration: a language or a label may be undefined
    Object.entries(translations ?? {}).forEach(([code, labels]) => this.#merge(code, definedLabels(labels)))
    this.#resolve()
  }

  /** The language code the labels are shown in, as the recognition names it (`fr_FR`) */
  get language(): string {
    return this.#language
  }

  /** Shows the labels in `language`; notifies the listeners when it differs from the current one */
  setLanguage(language: string): void {
    if (language === this.#language) {
      return
    }
    this.#language = language
    this.#resolve()
    this.#notify()
  }

  /** Adds or overrides labels of `language` (`fr` or `fr_FR`), then notifies the listeners */
  add(language: string, translations: TTranslations): void {
    this.#merge(language, translations)
    this.#resolve()
    this.#notify()
  }

  /** The label of `key` in the current language, its `{name}` placeholders replaced by `params` */
  t(key: TTranslationKey | (string & {}), params?: TTranslationParams): string {
    const label = this.#resolved[key] ?? key
    if (!params) {
      return label
    }
    return label.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      name in params ? String(params[name]) : placeholder
    )
  }

  /** Calls `listener` on every change of language or labels; returns what unsubscribes it */
  onChange(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  #merge(language: string, translations: TTranslations): void {
    const code = normalizeLanguage(language)
    this.#custom[code] = { ...this.#custom[code], ...translations }
  }

  /** Flattens the levels of the current language, least specific first, the integrator's labels over the built-in */
  #resolve(): void {
    const code = normalizeLanguage(this.#language)
    const [base] = code.split("_")
    const levels = [...new Set([FALLBACK_LANGUAGE, base, code])]
    this.#resolved = Object.assign(
      {},
      ...levels.flatMap((level) => [BUILT_IN_TRANSLATIONS[level], this.#custom[level]])
    )
  }

  #notify(): void {
    this.#listeners.forEach((listener) => listener())
  }
}

function definedLabels(labels: Record<string, string | undefined> = {}): TTranslations {
  return Object.fromEntries(Object.entries(labels).filter((entry): entry is [string, string] => entry[1] !== undefined))
}

/** `fr-ca`, `fr_CA` and `FR_ca` all name the same language: `fr_CA` */
function normalizeLanguage(language: string): string {
  const [base, region] = language.replace("-", "_").split("_")
  return region ? `${base.toLowerCase()}_${region.toUpperCase()}` : base.toLowerCase()
}
