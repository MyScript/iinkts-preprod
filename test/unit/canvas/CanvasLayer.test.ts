import { CanvasLayer, Translator } from "@/iink"

describe("CanvasLayer.ts", () => {
  describe("veil", () => {
    let layer: CanvasLayer

    beforeEach(() => {
      jest.useFakeTimers()
      layer = new CanvasLayer(document.createElement("div"))
      layer.render()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test("should cover the canvas once the delay elapsed", () => {
      layer.showVeil(300)
      expect(layer.veil.classList.contains("open")).toBe(false)
      jest.advanceTimersByTime(300)
      expect(layer.veil.classList.contains("open")).toBe(true)
      expect(layer.root.contains(layer.veil)).toBe(true)
    })

    test("should never show when hidden before the delay", () => {
      layer.showVeil(300)
      layer.hideVeil()
      jest.advanceTimersByTime(300)
      expect(layer.veil.classList.contains("open")).toBe(false)
    })

    test("should hide once shown", () => {
      layer.showVeil(0)
      jest.advanceTimersByTime(0)
      layer.hideVeil()
      expect(layer.veil.classList.contains("open")).toBe(false)
    })
  })

  describe("canvas state badge", () => {
    let layer: CanvasLayer

    beforeEach(() => {
      layer = new CanvasLayer(document.createElement("div"))
    })

    test("should render a hidden-count badge for online-idle", () => {
      layer.updateCanvasState("online-idle", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.root.className).toEqual("ms-ink-state ms-ink-state-online-idle")
      expect(layer.ui.state.tooltip.textContent).toEqual("Connected")
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should show the queued count with an explanatory tooltip for syncing", () => {
      layer.updateCanvasState("syncing", { queuedCount: 3, activeOperations: [] })
      expect(layer.ui.state.root.className).toEqual("ms-ink-state ms-ink-state-syncing")
      expect(layer.ui.state.count.textContent).toEqual("3")
      expect(layer.ui.state.count.style.display).toEqual("flex")
      expect(layer.ui.state.tooltip.textContent).toContain("3 change(s) waiting to be sent")
    })

    test("should hide the count when syncing has nothing queued yet", () => {
      layer.updateCanvasState("syncing", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should list active operation labels in the tooltip when online-working", () => {
      layer.updateCanvasState("online-working", { queuedCount: 0, activeOperations: ["Converting", "Synchronizing"] })
      expect(layer.ui.state.tooltip.textContent).toEqual("Converting, Synchronizing")
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should fall back to the generic tooltip when online-working has no labels yet", () => {
      layer.updateCanvasState("online-working", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.tooltip.textContent).toEqual("Processing…")
    })

    test("should update the icon markup for each state", () => {
      layer.updateCanvasState("error", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.icon.innerHTML).not.toEqual("")
      const errorIcon = layer.ui.state.icon.innerHTML
      layer.updateCanvasState("offline", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.icon.innerHTML).not.toEqual(errorIcon)
    })

    test("should toggle the tooltip open on click and close it on an outside click", () => {
      const { root, tooltip } = layer.ui.state
      expect(tooltip.classList.contains("open")).toBe(false)

      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(true)

      document.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(false)
    })

    test("should toggle the tooltip closed on a second click on the badge", () => {
      const { root, tooltip } = layer.ui.state
      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(true)

      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(false)
    })

    test("should translate the tooltip and the operation labels", () => {
      const french = new CanvasLayer(document.createElement("div"), "ms-ink", new Translator(undefined, "fr_FR"))
      french.updateCanvasState("online-idle", { queuedCount: 0, activeOperations: [] })
      expect(french.ui.state.tooltip.textContent).toEqual("Connecté")
      french.updateCanvasState("online-working", { queuedCount: 0, activeOperations: ["Converting", "custom"] })
      expect(french.ui.state.tooltip.textContent).toEqual("Conversion, custom")
    })

    test("should translate the tooltip again when the language changes", () => {
      const i18n = new Translator()
      const translated = new CanvasLayer(document.createElement("div"), "ms-ink", i18n)
      translated.updateCanvasState("syncing", { queuedCount: 2, activeOperations: [] })
      i18n.setLanguage("fr_FR")
      expect(translated.ui.state.tooltip.textContent).toEqual(
        "Reconnexion — traits en attente d'envoi — 2 modification(s) en attente d'envoi"
      )
    })

    test("should stop following the language once destroyed", () => {
      const i18n = new Translator()
      const translated = new CanvasLayer(document.createElement("div"), "ms-ink", i18n)
      translated.updateCanvasState("online-idle", { queuedCount: 0, activeOperations: [] })
      translated.destroy()
      i18n.setLanguage("fr_FR")
      expect(translated.ui.state.tooltip.textContent).toEqual("Connected")
    })

    test("should remove the document click listener on destroy", () => {
      const removeSpy = jest.spyOn(document, "removeEventListener")
      layer.destroy()
      expect(removeSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function))
      removeSpy.mockRestore()
    })
  })
})
