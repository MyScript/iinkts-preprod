import { CanvasLayer, LayoutManager, LoggerCategory, LoggerManager, TLayoutConfiguration } from "@/iink"

const INTERACTIVE_OCCUPANTS = ["action", "style", "tool", "state", "minimap"]

describe("LayoutManager.ts", () => {
  function build(configuration?: TLayoutConfiguration, occupants: string[] = INTERACTIVE_OCCUPANTS) {
    const layers = new CanvasLayer(document.createElement("div"))
    return { layers, layout: new LayoutManager(layers, occupants, configuration) }
  }

  describe("placement", () => {
    test("should place every occupant in its default slot", () => {
      const { layout } = build()
      expect(layout.slotOf("action")).toBe("top-left")
      expect(layout.slotOf("style")).toBe("top-right")
      expect(layout.slotOf("tool")).toBe("bottom-center")
      expect(layout.slotOf("state")).toBe("bottom-left")
      expect(layout.slotOf("minimap")).toBe("bottom-right")
    })

    test("should move an occupant out of its default slot, the others keeping theirs", () => {
      const { layout } = build({ "bottom-center": ["action", "tool"] })
      // Moved: not in its default slot as well, which a merged array would have kept
      expect(layout.slotOf("action")).toBe("bottom-center")
      expect(layout.slotOf("tool")).toBe("bottom-center")
      expect(layout.slotOf("style")).toBe("top-right")
    })

    test("should keep only the first slot naming an occupant twice, with a warning", () => {
      const warn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CANVAS), "warn")
      const { layout } = build({ "top-center": ["tool"], "bottom-center": ["tool"] })
      expect(layout.slotOf("tool")).toBe("top-center")
      expect(warn).toHaveBeenCalledWith("layout", '"tool" is already placed: ignored in "bottom-center"')
      warn.mockRestore()
    })

    test("should ignore, with a warning, an occupant this canvas lacks", () => {
      const warn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CANVAS), "warn")
      const { layout } = build({ "top-center": ["action"] }, ["state"])
      expect(layout.slotOf("action")).toBeUndefined()
      expect(warn).toHaveBeenCalledWith("layout", 'No "action" in this canvas: ignored in "top-center"')
      warn.mockRestore()
    })

    test("should place none of the default menus in a canvas without menus", () => {
      const { layout } = build(undefined, ["state"])
      expect(layout.slotOf("action")).toBeUndefined()
      expect(layout.slotOf("state")).toBe("bottom-left")
    })

    test("should empty a slot configured with no occupant", () => {
      const { layout } = build({ "top-right": [] })
      expect(layout.slotOf("style")).toBeUndefined()
    })
  })

  describe("render", () => {
    test("should build only the slots holding occupants, with a host per occupant in table order", () => {
      const { layers, layout } = build({ "bottom-center": ["action", "tool"] })
      layout.render()

      const slots = layers.ui.root.querySelectorAll(".ms-layout-slot")
      expect(Array.from(slots).map((slot) => slot.className)).toEqual([
        "ms-layout-slot ms-layout-top-right",
        "ms-layout-slot ms-layout-bottom-left",
        "ms-layout-slot ms-layout-bottom-center",
        "ms-layout-slot ms-layout-bottom-right",
      ])
      const bottomCenter = layers.ui.root.querySelector(".ms-layout-bottom-center")!
      expect(Array.from(bottomCenter.children)).toEqual([layout.host("action"), layout.host("tool")])
    })

    test("should move the connection state into its slot", () => {
      const { layers, layout } = build({ "top-center": ["state"] })
      layout.render()
      expect(layers.ui.state.root.parentElement).toBe(layout.host("state"))
      expect(layout.host("state")?.parentElement?.classList.contains("ms-layout-top-center")).toBe(true)
    })

    test("should have no host before render nor for an occupant this canvas lacks", () => {
      const { layout } = build(undefined, ["state"])
      expect(layout.host("state")).toBeUndefined()
      layout.render()
      expect(layout.host("action")).toBeUndefined()
    })

    test("should remove its slots on destroy", () => {
      const { layers, layout } = build()
      layout.render()
      layout.destroy()
      expect(layers.ui.root.querySelector(".ms-layout-slot")).toBeNull()
      expect(layout.host("tool")).toBeUndefined()
    })
  })
})
