import { TranslationsEn, TranslationsFr, Translator } from "@/iink"

describe("Translator", () => {
  test("should translate in English by default", () => {
    const i18n = new Translator()
    expect(i18n.language).toEqual("en")
    expect(i18n.t("menu.action.clear")).toEqual(TranslationsEn["menu.action.clear"])
  })

  test("should translate in the built-in language matching the region code", () => {
    const i18n = new Translator(undefined, "fr_FR")
    expect(i18n.t("menu.action.clear")).toEqual(TranslationsFr["menu.action.clear"])
  })

  test("should accept a dash as region separator", () => {
    const i18n = new Translator(undefined, "fr-CA")
    expect(i18n.t("menu.action.clear")).toEqual(TranslationsFr["menu.action.clear"])
  })

  test("should fall back to English for a language without translations", () => {
    const i18n = new Translator(undefined, "vi_VN")
    expect(i18n.t("menu.action.clear")).toEqual(TranslationsEn["menu.action.clear"])
  })

  test("should return the key when no language knows it", () => {
    const i18n = new Translator()
    expect(i18n.t("my.unknown.key")).toEqual("my.unknown.key")
  })

  test("should replace the parameters in braces", () => {
    const i18n = new Translator({ en: { "my.greeting": "Hello {name}, {count} new" } })
    expect(i18n.t("my.greeting", { name: "Ada", count: 3 })).toEqual("Hello Ada, 3 new")
  })

  test("should keep a parameter it is not given", () => {
    const i18n = new Translator({ en: { "my.greeting": "Hello {name}" } })
    expect(i18n.t("my.greeting")).toEqual("Hello {name}")
  })

  describe("integrator translations", () => {
    test("should override a built-in label", () => {
      const i18n = new Translator({ fr: { "menu.action.clear": "Tout effacer" } }, "fr_FR")
      expect(i18n.t("menu.action.clear")).toEqual("Tout effacer")
      expect(i18n.t("menu.action.convert")).toEqual(TranslationsFr["menu.action.convert"])
    })

    test("should prefer the region over the language", () => {
      const i18n = new Translator(
        { fr: { "menu.action.clear": "Effacer tout" }, fr_CA: { "menu.action.clear": "Vider" } },
        "fr_CA"
      )
      expect(i18n.t("menu.action.clear")).toEqual("Vider")
    })

    test("should add a language the library does not ship", () => {
      const i18n = new Translator({ de: { "menu.action.clear": "Löschen" } }, "de_DE")
      expect(i18n.t("menu.action.clear")).toEqual("Löschen")
      expect(i18n.t("menu.action.convert")).toEqual(TranslationsEn["menu.action.convert"])
    })

    test("should add labels of its own", () => {
      const i18n = new Translator({ en: { "my.button": "Download" }, fr: { "my.button": "Télécharger" } }, "fr_FR")
      expect(i18n.t("my.button")).toEqual("Télécharger")
    })

    test("should merge the labels added at runtime with the ones already given", () => {
      const i18n = new Translator({ fr: { "my.a": "A" } }, "fr_FR")
      i18n.add("fr", { "my.b": "B" })
      expect(i18n.t("my.a")).toEqual("A")
      expect(i18n.t("my.b")).toEqual("B")
    })
  })

  describe("change listeners", () => {
    test("should notify when the language changes", () => {
      const i18n = new Translator()
      const listener = jest.fn()
      i18n.onChange(listener)
      i18n.setLanguage("fr_FR")
      expect(i18n.language).toEqual("fr_FR")
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test("should not notify when the language stays the same", () => {
      const i18n = new Translator(undefined, "fr_FR")
      const listener = jest.fn()
      i18n.onChange(listener)
      i18n.setLanguage("fr_FR")
      expect(listener).not.toHaveBeenCalled()
    })

    test("should notify when labels are added", () => {
      const i18n = new Translator()
      const listener = jest.fn()
      i18n.onChange(listener)
      i18n.add("de", { "menu.action.clear": "Löschen" })
      expect(listener).toHaveBeenCalledTimes(1)
    })

    test("should stop notifying once unsubscribed", () => {
      const i18n = new Translator()
      const listener = jest.fn()
      const unsubscribe = i18n.onChange(listener)
      unsubscribe()
      i18n.setLanguage("fr_FR")
      expect(listener).not.toHaveBeenCalled()
    })
  })

  test("should not share the integrator dictionaries with the configuration", () => {
    const translations = { fr: { "my.a": "A" } }
    const i18n = new Translator(translations, "fr_FR")
    i18n.add("fr", { "my.b": "B" })
    expect(translations.fr).toEqual({ "my.a": "A" })
  })
})
