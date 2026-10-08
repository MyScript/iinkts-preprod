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

  test("should group each gesture in its own submenu with an enable checkbox and an explicit action select", () => {
    const canvas = createCanvasMock()
    const item = new GestureMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()
    const surroundMenu = wrapper.querySelector("#ms-menu-action-gesture-surround-menu") as HTMLElement

    expect(surroundMenu.querySelector("#ms-menu-action-gesture-surround-menu-trigger")?.textContent).toContain(
      "Surround"
    )
    expect(surroundMenu.querySelector("#ms-menu-action-gesture-surround-enable-input")).toBeTruthy()
    expect(surroundMenu.querySelector("#ms-menu-action-gesture-surround-input")).toBeTruthy()
    expect(surroundMenu.textContent).toContain("Enable")
    expect(surroundMenu.textContent).toContain("Action on detection")
  })

  test("should reflect and toggle the gesture in the recognition configuration from the enable checkbox", () => {
    const canvas = createCanvasMock()
    const item = new GestureMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-gesture-surround-enable-input") as HTMLInputElement

    expect(checkbox.checked).toBe(true)

    checkbox.checked = false
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    const conf = jest.mocked(canvas.updateRecognitionConfiguration).mock.calls[0][0]
    expect(conf["raw-content"]?.gestures).not.toContain("surround")
    expect(conf["raw-content"]?.gestures).toContain("underline")
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
