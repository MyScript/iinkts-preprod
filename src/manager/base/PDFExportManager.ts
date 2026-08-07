import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InkCanvas } from "@/canvas/variants/InkCanvas"
import { LoggerCategory, LoggerManager } from "@/logger"

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
  }
}
