import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InkCanvas } from "@/canvas/variants/InkCanvas"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TBox } from "@/symbol"
import { convertPixelToMillimeter } from "@/utils"

/**
 * @group Manager
 */
export type TPDFPageFormat = "A4" | "Letter" | "Legal"

/**
 * @group Manager
 */
export type TPDFOrientation = "portrait" | "landscape"

/**
 * @group Manager
 */
export type TPDFPageSizeMm = {
  width: number
  height: number
}

/**
 * @group Manager
 */
export type TPDFPageOptions = {
  format: TPDFPageFormat
  orientation: TPDFOrientation
  scale: number
}

/**
 * @group Manager
 */
export type TPDFPageCount = {
  columns: number
  rows: number
  total: number
}

const PAGE_SIZES_MM: Record<TPDFPageFormat, TPDFPageSizeMm> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
}

const PRINT_CONTAINER_CLASS = "ii-pdf-print-container"

const PRINT_STYLESHEET = `
  .${PRINT_CONTAINER_CLASS} {
    display: none;
  }
  @media print {
    body > *:not(.${PRINT_CONTAINER_CLASS}) {
      display: none !important;
    }
    .${PRINT_CONTAINER_CLASS} {
      display: block !important;
    }
  }
`

/**
 * @group Manager
 */
export class PDFExportManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  canvas: TInteractiveInkCanvas | InkCanvas
  #printContainer?: HTMLDivElement
  #pageStyle?: HTMLStyleElement

  constructor(canvas: TInteractiveInkCanvas | InkCanvas) {
    this.#logger.info("constructor")
    this.canvas = canvas
  }

  #ensurePrintStylesheet(): void {
    if (document.head.querySelector("style[data-ii-pdf-print]")) {
      return
    }
    const style = document.createElement("style")
    style.setAttribute("data-ii-pdf-print", "")
    style.textContent = PRINT_STYLESHEET
    document.head.appendChild(style)
  }

  buildPrintContainer(svgContent: string): HTMLDivElement {
    this.removePrintContainer()
    this.#ensurePrintStylesheet()

    const container = document.createElement("div")
    container.className = PRINT_CONTAINER_CLASS
    container.innerHTML = svgContent
    document.body.appendChild(container)

    this.#printContainer = container
    return container
  }

  removePrintContainer(): void {
    this.#printContainer?.remove()
    this.#printContainer = undefined
    this.#pageStyle?.remove()
    this.#pageStyle = undefined
  }

  #setPageSizeStyle(page: TPDFPageSizeMm): void {
    if (!this.#pageStyle) {
      this.#pageStyle = document.createElement("style")
      this.#pageStyle.setAttribute("data-ii-pdf-page", "")
      document.head.appendChild(this.#pageStyle)
    }
    this.#pageStyle.textContent = `@page { size: ${page.width}mm ${page.height}mm; margin: 0; }`
  }

  getPageDimensionsMm(format: TPDFPageFormat, orientation: TPDFOrientation): TPDFPageSizeMm {
    const size = PAGE_SIZES_MM[format]
    return orientation === "landscape" ? { width: size.height, height: size.width } : { ...size }
  }

  computePageCount(box: TBox, options: TPDFPageOptions): TPDFPageCount {
    const page = this.getPageDimensionsMm(options.format, options.orientation)
    const scaleFactor = options.scale / 100
    const contentWidthMm = convertPixelToMillimeter(box.width) * scaleFactor
    const contentHeightMm = convertPixelToMillimeter(box.height) * scaleFactor

    const columns = Math.max(1, Math.ceil(contentWidthMm / page.width))
    const rows = Math.max(1, Math.ceil(contentHeightMm / page.height))

    return { columns, rows, total: columns * rows }
  }

  computeFitToPageScale(box: TBox, format: TPDFPageFormat, orientation: TPDFOrientation): number {
    const page = this.getPageDimensionsMm(format, orientation)
    const contentWidthMm = convertPixelToMillimeter(box.width)
    const contentHeightMm = convertPixelToMillimeter(box.height)

    return Math.min(page.width / contentWidthMm, page.height / contentHeightMm)
  }

  buildSinglePagePrintContainer(
    svgContent: string,
    box: TBox,
    format: TPDFPageFormat,
    orientation: TPDFOrientation
  ): HTMLDivElement {
    const container = this.buildPrintContainer(svgContent)
    const page = this.getPageDimensionsMm(format, orientation)
    this.#setPageSizeStyle(page)

    const scale = this.computeFitToPageScale(box, format, orientation)
    const svg = container.querySelector("svg")
    if (svg) {
      const widthMm = +(convertPixelToMillimeter(box.width) * scale).toFixed(3)
      const heightMm = +(convertPixelToMillimeter(box.height) * scale).toFixed(3)
      svg.style.width = `${widthMm}mm`
      svg.style.height = `${heightMm}mm`
    }

    return container
  }
}
