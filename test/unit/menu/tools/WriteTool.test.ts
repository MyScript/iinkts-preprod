import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { WriteTool, CanvasTool, CanvasWriteTool, DEFAULT_PEN_NIB, PEN_NIBS } from "@/iink"

describe("WriteTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a trigger and one button per nib", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))

    const wrapper = tool.getElement()

    expect(wrapper.querySelector("#ms-menu-tool-write-pencil")).toBeTruthy()
    Object.keys(PEN_NIBS).forEach((nib) => {
      expect(wrapper.querySelector(`#ms-menu-tool-write-pencil-${nib}`)).toBeTruthy()
    })
  })

  test("should pick up the pencil on a click on the trigger itself", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-pencil") as HTMLButtonElement

    trigger.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
    expect(trigger.classList.contains("active")).toBe(true)
  })

  test("should write the chosen nib onto the pen style, not keep it to itself", () => {
    // The nib has to reach the style: it is stored on every stroke drawn with it, which is what
    // makes a reopened document redraw each stroke the way it was written.
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-pencil") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")
    const fountain = wrapper.querySelector("#ms-menu-tool-write-pencil-fountain") as HTMLButtonElement

    fountain.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.penStyle.pen).toEqual("fountain")
    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
    expect(trigger.innerHTML).toEqual(fountain.innerHTML)
    expect(trigger.classList.contains("active")).toBe(true)
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should mark the nib the pen actually carries, defaulting when the style names none", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Pencil

    tool.update()
    const fallback = wrapper.querySelector(`#ms-menu-tool-write-pencil-${DEFAULT_PEN_NIB}`) as HTMLButtonElement
    expect(fallback.classList.contains("active")).toBe(true)

    canvas.penStyle = { ...canvas.penStyle, pen: "brush" }
    tool.update()
    const brush = wrapper.querySelector("#ms-menu-tool-write-pencil-brush") as HTMLButtonElement
    expect(brush.classList.contains("active")).toBe(true)
    expect(fallback.classList.contains("active")).toBe(false)
  })

  test("should only be active on update() when both canvas.tool and canvas.writer.tool match", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-write-pencil") as HTMLButtonElement

    canvas.tool = CanvasTool.Write
    canvas.writer.tool = "eraser" as CanvasWriteTool
    tool.update()
    expect(trigger.classList.contains("active")).toBe(false)

    canvas.writer.tool = CanvasWriteTool.Pencil
    tool.update()
    expect(trigger.classList.contains("active")).toBe(true)
  })
})
