import { asCanvas, createCanvasMock } from "../__mocks__/createCanvasMock"
import { StubMenuItem } from "../helpers"
import { BaseMenuItem, IIAbstractMenu, TMenuItemOptions, TMenuZone } from "@/iink"

class TestMenu extends IIAbstractMenu<{ items: { key: string; options?: TMenuItemOptions }[] }> {
  readonly defaultZone: TMenuZone = "dropdown"
  dropdown?: { element: HTMLDivElement; content: HTMLDivElement }

  render(layer: HTMLElement): void {
    this.wrapper = document.createElement("div")
    this.config.items.forEach(({ key, options }) =>
      this.addItem(key, new StubMenuItem(key, this.canvas), options)
    )
    layer.appendChild(this.wrapper)
  }

  protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement {
    if (zone === "bar") {
      return wrapper
    }
    const column = document.createElement("div")
    this.dropdown = this.createDropdown(document.createElement("button"), column, "bottom-left")
    wrapper.appendChild(this.dropdown.element)
    return column
  }

  get rendered(): Map<string, BaseMenuItem> {
    return this.items
  }

  addOutsideRender(key: string): void {
    this.addItem(key, new StubMenuItem(key, this.canvas))
  }
}

describe("IIAbstractMenu.ts", () => {
  function setup(items: { key: string; options?: TMenuItemOptions }[] = [{ key: "first" }]) {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    document.body.appendChild(layer)
    const menu = new TestMenu(asCanvas(canvas), "test-menu", { items })
    menu.render(layer)
    return { menu, layer }
  }

  test("should put an item in the default zone when it names none", () => {
    const { menu } = setup()
    expect(menu.dropdown?.content.contains(menu.rendered.get("first")!.getElement())).toBe(true)
  })

  test("should put an item in the zone it names", () => {
    const { menu } = setup([{ key: "first", options: { zone: "bar" } }])
    expect(menu.wrapper?.contains(menu.rendered.get("first")!.getElement())).toBe(true)
  })

  test("should build a zone only once an item goes to it", () => {
    const { menu } = setup([{ key: "first", options: { zone: "bar" } }])
    // No dropdown item: no empty dropdown, no document listener
    expect(menu.dropdown).toBeUndefined()
  })

  test("should build each zone once, whatever the number of items", () => {
    const { menu } = setup([{ key: "first" }, { key: "second" }])
    expect(menu.wrapper?.querySelectorAll(".sub-menu")).toHaveLength(1)
    expect(menu.dropdown?.content.querySelectorAll("button")).toHaveLength(2)
  })

  test("should refuse an item added before render() set the wrapper", () => {
    const menu = new TestMenu(asCanvas(createCanvasMock()), "test-menu", { items: [] })
    expect(() => menu.addOutsideRender("early")).toThrow("test-menu: items are added during render()")
  })

  test("should update every item", () => {
    const { menu } = setup()
    const update = jest.spyOn(menu.rendered.get("first")!, "update")
    menu.update()
    expect(update).toHaveBeenCalledTimes(1)
  })

  test("should toggle the dropdown from its trigger and close it on a pointerdown outside", () => {
    const { menu } = setup()
    const { element, content } = menu.dropdown!
    const trigger = element.querySelector("button")!

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)
    expect(content.classList.contains("bottom-left")).toBe(true)

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should show and hide through the wrapper's visibility", () => {
    const { menu } = setup()
    menu.hide()
    expect(menu.wrapper?.style.visibility).toBe("hidden")
    menu.show()
    expect(menu.wrapper?.style.visibility).toBe("visible")
  })

  test("should destroy its items, detach its wrapper and stop listening to the document", () => {
    const { menu, layer } = setup()
    const destroy = jest.spyOn(menu.rendered.get("first")!, "destroy")
    const removeListener = jest.spyOn(document, "removeEventListener")
    const { content } = menu.dropdown!

    menu.destroy()

    expect(destroy).toHaveBeenCalledTimes(1)
    expect(menu.rendered.size).toBe(0)
    expect(menu.wrapper).toBeUndefined()
    expect(layer.children).toHaveLength(0)
    expect(removeListener).toHaveBeenCalledWith("pointerdown", expect.any(Function))
    // The listener is gone: an outside pointerdown no longer reaches the destroyed dropdown
    content.classList.add("open")
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)
    removeListener.mockRestore()
  })

  test("should start over when rendered again without a destroy, refusing nothing", () => {
    const { menu } = setup([{ key: "first" }, { key: "second", options: { zone: "bar" } }])
    const otherLayer = document.createElement("div")

    menu.render(otherLayer)

    // Same keys again: the previous render's items belong to the previous wrapper, not to this one
    expect(otherLayer.querySelectorAll("button#first, button#second")).toHaveLength(2)
    expect(menu.rendered.size).toBe(2)
  })

  test("should build its zones again after a destroy", () => {
    const { menu, layer } = setup()
    menu.destroy()
    menu.render(layer)
    expect(menu.wrapper?.querySelectorAll(".sub-menu")).toHaveLength(1)
  })
})
