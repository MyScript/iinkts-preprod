import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIText, buildIIStroke } from "../../helpers"
import { EditContextMenu, type TText } from "@/iink"

describe("EditContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildTextSymbol = (label = "H", x = 0, y = 0) =>
    buildIIText({
      chars: Array.from(label).map((char, i) => ({
        id: `char-${i}`,
        label: char,
        fontSize: 16,
        fontWeight: "normal",
        color: "#000000",
        bounds: { x: x + i * 10, y, width: 10, height: 16 },
      })),
      boundingBox: { x, y, width: label.length * 10, height: 16 },
    })

  const selectTexts = (canvas: ReturnType<typeof createCanvasMock>, texts: TText[]) => {
    texts.forEach((t) => {
      canvas.model.addSymbol(t)
      canvas.model.selectSymbol(t.id)
    })
  }

  const labelOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
    (canvas.model.getSymbol(id) as TText).chars.map((c) => c.label).join("")

  const save = async (item: EditContextMenu) => {
    item.editSaveBtn!.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
    await Promise.resolve()
    await Promise.resolve()
  }

  test("should build a trigger, a textarea and a save button", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-context-edit-trigger")).toBeTruthy()
    expect(item.editInput).toBeInstanceOf(HTMLTextAreaElement)
    expect(item.editSaveBtn?.textContent).toEqual("Save")
  })

  test("should toggle the panel open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-context-edit-trigger") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the panel on outside pointerdown", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should rewrite the selected text's chars from the input value on save", async () => {
    const canvas = createCanvasMock()
    const text = buildTextSymbol()
    selectTexts(canvas, [text])
    const item = new EditContextMenu(asCanvas(canvas))
    document.body.appendChild(item.getElement())
    item.editInput!.value = "Hi"

    await save(item)

    const updatedText = canvas.model.getSymbol(text.id) as TText
    expect(updatedText.chars.map((c) => c.label)).toEqual(["H", "i"])
    expect(updatedText.chars[0].color).toEqual("#000000")
    expect(canvas.selector.drawSelectedGroup).toHaveBeenCalledWith([updatedText])
  })

  test("should show every selected word in reading order, one line per row", () => {
    const canvas = createCanvasMock()
    selectTexts(canvas, [buildTextSymbol("you", 0, 40), buildTextSymbol("are", 50, 0), buildTextSymbol("How", 0, 0)])
    const item = new EditContextMenu(asCanvas(canvas))
    item.getElement()

    item.update()

    expect(item.editInput!.value).toEqual("How are\nyou")
  })

  test("should be visible only when the selection is made of texts only", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()

    item.update()
    expect(wrapper.style.display).toEqual("none")

    selectTexts(canvas, [buildTextSymbol("How")])
    item.update()
    expect(wrapper.style.display).toEqual("")

    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    item.update()
    expect(wrapper.style.display).toEqual("none")
  })

  test("should write each edited word back to its text in one update", async () => {
    const canvas = createCanvasMock()
    const how = buildTextSymbol("How", 0, 0)
    const are = buildTextSymbol("are", 50, 0)
    const you = buildTextSymbol("you", 0, 40)
    selectTexts(canvas, [how, are, you])
    const item = new EditContextMenu(asCanvas(canvas))
    item.getElement()
    item.update()
    item.editInput!.value = "Who are\nthey"

    await save(item)

    expect(canvas.updateSymbols).toHaveBeenCalledTimes(1)
    expect((canvas.updateSymbols as jest.Mock).mock.calls[0][0]).toEqual([how.id, you.id])
    expect([how, are, you].map((t) => labelOf(canvas, t.id))).toEqual(["Who", "are", "they"])
    expect(canvas.removeSymbols).not.toHaveBeenCalled()
  })

  test("should give the extra words to the last text", async () => {
    const canvas = createCanvasMock()
    const how = buildTextSymbol("How", 0, 0)
    const are = buildTextSymbol("are", 50, 0)
    selectTexts(canvas, [how, are])
    const item = new EditContextMenu(asCanvas(canvas))
    item.getElement()
    item.editInput!.value = "How are you"

    await save(item)

    expect(labelOf(canvas, how.id)).toEqual("How")
    expect(labelOf(canvas, are.id)).toEqual("are you")
  })

  test("should remove the texts left without a word", async () => {
    const canvas = createCanvasMock()
    const how = buildTextSymbol("How", 0, 0)
    const are = buildTextSymbol("are", 50, 0)
    const you = buildTextSymbol("you", 100, 0)
    selectTexts(canvas, [how, are, you])
    const item = new EditContextMenu(asCanvas(canvas))
    item.getElement()
    item.editInput!.value = "How"

    await save(item)

    expect(canvas.updateSymbols).not.toHaveBeenCalled()
    expect(canvas.removeSymbols).toHaveBeenCalledWith([are.id, you.id])
    expect(canvas.selector.drawSelectedGroup).toHaveBeenCalledWith([canvas.model.getSymbol(how.id)])
  })

  test("should change nothing when the edited value is empty", async () => {
    const canvas = createCanvasMock()
    selectTexts(canvas, [buildTextSymbol("How")])
    const item = new EditContextMenu(asCanvas(canvas))
    item.getElement()
    item.editInput!.value = "  "

    await save(item)

    expect(canvas.updateSymbols).not.toHaveBeenCalled()
    expect(canvas.removeSymbols).not.toHaveBeenCalled()
  })

  test("should route a failing save through manageError instead of leaving it unhandled", async () => {
    const canvas = createCanvasMock()
    selectTexts(canvas, [buildTextSymbol()])
    const boom = new Error("backend refused the update")
    canvas.updateSymbols = jest.fn().mockRejectedValue(boom)
    const item = new EditContextMenu(asCanvas(canvas))
    document.body.appendChild(item.getElement())
    item.editInput!.value = "Hi"

    await save(item)

    expect(canvas.manageError).toHaveBeenCalledWith(boom)
    expect(canvas.selector.drawSelectedGroup).not.toHaveBeenCalled()
  })

  test("should do nothing on save when no text symbol is selected", async () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    item.editInput!.value = "Hi"

    item.editSaveBtn!.dispatchEvent(new Event("pointerdown", { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(canvas.updateSymbols).not.toHaveBeenCalled()
  })

  test("should not throw and remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const item = new EditContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    item.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
