import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { buildIIStroke } from "../helpers"
import { ExportContextMenu } from "@/iink"

describe("ExportContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("clicking PDF calls canvas.printAsPDF with selection=false when nothing is selected", () => {
    const canvas = createCanvasMock()
    const action = new ExportContextMenu(asCanvas(canvas))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-context-export-pdf") as HTMLButtonElement
    expect(button).toBeTruthy()

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.printAsPDF).toHaveBeenCalledWith(false)
  })

  test("clicking PDF calls canvas.printAsPDF with selection=true when symbols are selected", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectedIds.add(stroke.id)
    const action = new ExportContextMenu(asCanvas(canvas))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-context-export-pdf") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.printAsPDF).toHaveBeenCalledWith(true)
  })

  test("does not build the PDF button when disabled via config", () => {
    const canvas = createCanvasMock()
    const action = new ExportContextMenu(asCanvas(canvas), "ms-menu-context", { pdf: false })
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-context-export-pdf")).toBeNull()
  })
})
