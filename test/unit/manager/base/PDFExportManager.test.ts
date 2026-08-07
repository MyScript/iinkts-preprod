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

  describe("page dimensions and page count", () => {
    const manager = new PDFExportManager(asCanvas(createCanvasMock()))

    test("should return A4 portrait dimensions in millimeters", () => {
      expect(manager.getPageDimensionsMm("A4", "portrait")).toEqual({ width: 210, height: 297 })
    })

    test("should swap width/height for landscape orientation", () => {
      expect(manager.getPageDimensionsMm("A4", "landscape")).toEqual({ width: 297, height: 210 })
    })

    test("should return Letter portrait dimensions in millimeters", () => {
      expect(manager.getPageDimensionsMm("Letter", "portrait")).toEqual({ width: 215.9, height: 279.4 })
    })

    test("should compute a single page when content fits within one page at 100% scale", () => {
      const box = { x: 0, y: 0, width: 700, height: 1000 } // ~185x264mm at 96dpi
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 100 })
      expect(result).toEqual({ columns: 1, rows: 1, total: 1 })
    })

    test("should compute multiple pages when content exceeds one page at given scale", () => {
      const box = { x: 0, y: 0, width: 1600, height: 1000 } // ~423x264mm at 96dpi, wider than 2 A4 portrait pages
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 100 })
      expect(result).toEqual({ columns: 3, rows: 1, total: 3 })
    })

    test("should scale content before computing page count", () => {
      const box = { x: 0, y: 0, width: 700, height: 1000 }
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 200 })
      expect(result).toEqual({ columns: 2, rows: 2, total: 4 })
    })
  })

  describe("single-page fit-to-scale mode", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-page]").forEach((el) => el.remove())
    })

    test("should shrink content that exceeds the page to fit within it", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 2000, height: 1000 } // ~529x265mm, wider than A4 portrait
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(scale).toBeCloseTo(210 / (2000 * (25.4 / 96)), 3)
    })

    test("should grow content smaller than the page to fill it", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 } // ~106x159mm, smaller than A4 portrait
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(scale).toBeCloseTo(297 / (600 * (25.4 / 96)), 3)
    })

    test("should set @page size matching the requested format/orientation", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildSinglePagePrintContainer("<svg><rect /></svg>", { x: 0, y: 0, width: 400, height: 600 }, "A4", "landscape")

      const style = document.head.querySelector("style[data-ii-pdf-page]")
      expect(style?.textContent).toContain("@page")
      expect(style?.textContent).toContain("297mm 210mm")
    })

    test("should scale the SVG element to the fitted physical size", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 }
      const container = manager.buildSinglePagePrintContainer("<svg><rect /></svg>", box, "A4", "portrait")

      const svg = container.querySelector("svg") as SVGElement
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      const expectedWidthMm = 400 * (25.4 / 96) * scale
      expect(parseFloat(svg.style.width)).toBeCloseTo(expectedWidthMm, 2)
    })
  })
})
