import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { ExportMenuAction } from "@/iink"

describe("ExportMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("clicking PDF calls canvas.printAsPDF", () => {
    const canvas = createCanvasMock()
    const action = new ExportMenuAction(asCanvas(canvas))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-action-export-pdf") as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.textContent).toBe("PDF")

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.printAsPDF).toHaveBeenCalledTimes(1)
  })

  test("does not build the PDF button when disabled via config", () => {
    const canvas = createCanvasMock()
    const action = new ExportMenuAction(asCanvas(canvas), "ms-menu-action", { pdf: false })
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-export-pdf")).toBeNull()
  })
})
