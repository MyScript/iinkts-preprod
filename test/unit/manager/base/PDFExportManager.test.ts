import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { PDFExportManager } from "@/iink"

describe("PDFExportManager.ts", () => {
  test("should create and hold a reference to its canvas", () => {
    const canvas = createCanvasMock()
    const manager = new PDFExportManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.canvas).toBe(canvas)
  })

  describe("print container", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
    })

    test("should append a container holding the given SVG content to the document body", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const container = manager.buildPrintContainer("<svg><rect /></svg>")

      expect(container.className).toBe("ii-pdf-print-container")
      expect(container.innerHTML).toBe("<svg><rect></rect></svg>")
      expect(document.body.contains(container)).toBe(true)
    })

    test("should inject a single print-only stylesheet hiding everything but the print container", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildPrintContainer("<svg></svg>")
      manager.buildPrintContainer("<svg></svg>")

      const styles = document.head.querySelectorAll("style[data-ii-pdf-print]")
      expect(styles).toHaveLength(1)
      expect(styles[0].textContent).toContain("@media print")
      expect(styles[0].textContent).toContain(".ii-pdf-print-container")
    })

    test("should remove the print container from the document", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const container = manager.buildPrintContainer("<svg></svg>")

      manager.removePrintContainer()

      expect(document.body.contains(container)).toBe(false)
    })
  })
})
