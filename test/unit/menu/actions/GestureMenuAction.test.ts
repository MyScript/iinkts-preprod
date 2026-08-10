import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { GestureMenuAction, CanvasTool, CanvasWriteTool, SurroundAction } from "@/iink"

describe("GestureMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build the detect checkbox and the surround/strikethrough/underline selects enabled by default (not insert)", () => {
    const canvas = createCanvasMock()
    const item = new GestureMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-gesture-detect-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-gesture-surround-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-gesture-strikethrough-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-gesture-underline-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-gesture-insert-input")).toBeNull()
  })

  test("should omit an item when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new GestureMenuAction(asCanvas(canvas), "ms-menu-action", { surround: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-gesture-surround-input")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-action-gesture-detect-input")).toBeTruthy()
  })

  test("should toggle detectGesture and reset to the pencil writer tool from the checkbox", () => {
    const canvas = createCanvasMock()
    canvas.writer.detectGesture = false
    const item = new GestureMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-gesture-detect-input") as HTMLInputElement

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.writer.detectGesture).toBe(true)
    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
  })

  test("should set the surround action and reset to the pencil writer tool from the select", () => {
    const canvas = createCanvasMock()
    const item = new GestureMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const select = wrapper.querySelector("#ms-menu-action-gesture-surround-input") as HTMLSelectElement

    select.value = SurroundAction.Highlight
    select.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.gesture.surroundAction).toEqual(SurroundAction.Highlight)
    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
  })
})
