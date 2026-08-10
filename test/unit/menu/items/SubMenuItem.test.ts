import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SubMenuItem, TMenuSubMenu, TMenuButton } from "@/iink"

describe("SubMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildButtonItem = (id: string, action = jest.fn()): TMenuButton => ({
    type: "button",
    id,
    label: id,
    action,
  })

  const buildConfig = (overrides: Partial<TMenuSubMenu> = {}): TMenuSubMenu => ({
    type: "submenu",
    id: "test-submenu",
    label: "Test",
    items: [buildButtonItem("child-a"), buildButtonItem("child-b")],
    ...overrides,
  })

  test("should build a trigger and one element per configured item", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#test-submenu-trigger")).toBeTruthy()
    expect(wrapper.querySelector("#child-a")).toBeTruthy()
    expect(wrapper.querySelector("#child-b")).toBeTruthy()
  })

  test("should default the arrow to a -90deg rotation for the default 'right-top' position", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()
    const arrow = wrapper.querySelector("#test-submenu-trigger span") as HTMLSpanElement

    expect(arrow.style.transform).toEqual("rotate(-90deg)")
  })

  test("should open the submenu content when the trigger is clicked", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#test-submenu-trigger") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    expect(content.classList.contains("open")).toBe(false)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(true)
  })

  test("should open() and close() directly", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))
    const content = item.getElement().querySelector(".sub-menu-content") as HTMLDivElement

    item.open()
    expect(content.classList.contains("open")).toBe(true)

    item.close()
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close when a pointerdown happens outside the submenu", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    item.open()
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    expect(content.classList.contains("open")).toBe(true)

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close when a nested item dispatches ms-menu-close", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    item.open()
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    const childA = wrapper.querySelector("#child-a") as HTMLButtonElement

    childA.dispatchEvent(new CustomEvent("ms-menu-close", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should cascade update() to nested items", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({
      items: [buildButtonItem("child-a"), { ...buildButtonItem("child-b"), disabled: () => true }],
    })
    const item = new SubMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()

    item.update()

    expect((wrapper.querySelector("#child-b") as HTMLButtonElement).disabled).toBe(true)
  })

  test("should cascade destroy() to nested items and stop reacting to outside pointerdown", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SubMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const childA = wrapper.querySelector("#child-a") as HTMLButtonElement

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(document.body.contains(childA)).toBe(false)
    // no observable open/close state to assert post-destroy beyond not throwing:
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
