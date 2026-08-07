import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { PDFExportManager } from "@/iink"

describe("PDFExportManager.ts", () => {
  test("should create and hold a reference to its canvas", () => {
    const canvas = createCanvasMock()
    const manager = new PDFExportManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.canvas).toBe(canvas)
  })
})
