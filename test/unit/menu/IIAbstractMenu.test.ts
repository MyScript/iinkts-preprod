import { asCanvas, createCanvasMock } from "../__mocks__/createCanvasMock"
import { BaseMenuItem, IIAbstractMenu } from "@/iink"

class TestItem extends BaseMenuItem<HTMLButtonElement> {
  createElement(): HTMLButtonElement {
    return document.createElement("button")
  }
  update(): void {}
}

class TestMenu extends IIAbstractMenu<{ placement: "bottom-left" }> {
  dropdown?: { element: HTMLDivElement; content: HTMLDivElement }

  render(layer: HTMLElement): void {
    const wrapper = document.createElement("div")
    this.wrapper = wrapper
    const column = document.createElement("div")
    this.addItem("first", new TestItem({ id: "first", type: "button" }, this.canvas), column)
    const trigger = document.createElement("button")
    this.dropdown = this.createDropdown(trigger, column, this.config.placement)
    wrapper.appendChild(this.dropdown.element)
    layer.appendChild(wrapper)
  }

  get rendered(): Map<string, BaseMenuItem> {
    return this.items
  }
}

describe("IIAbstractMenu.ts", () => {
  function setup() {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    document.body.appendChild(layer)
    const menu = new TestMenu(asCanvas(canvas), "test-menu", { placement: "bottom-left" })
    menu.render(layer)
    return { menu, layer }
  }

  test("should keep the items it adds and append their elements", () => {
    const { menu } = setup()
    const item = menu.rendered.get("first")
    expect(item).toBeDefined()
    expect(menu.dropdown?.content.contains(item!.getElement())).toBe(true)
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
})
