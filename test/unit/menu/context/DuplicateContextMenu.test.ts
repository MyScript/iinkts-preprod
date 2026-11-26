import { DuplicateContextMenu } from "@/iink"

import { asCanvas, createCanvasMock } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"

describe("DuplicateContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a labeled button", () => {
    const canvas = createCanvasMock()
    const item = new DuplicateContextMenu(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-context-duplicate")
    expect(button.textContent).toEqual("Duplicate")
  })

  test("should duplicate the selected symbols on click", async () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const item = new DuplicateContextMenu(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()

    expect(canvas.duplicate).toHaveBeenCalledWith([stroke])
  })
})
