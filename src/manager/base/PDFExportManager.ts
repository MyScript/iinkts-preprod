import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InkCanvas } from "@/canvas/variants/InkCanvas"
import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Manager
 */
export class PDFExportManager {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  canvas: TInteractiveInkCanvas | InkCanvas

  constructor(canvas: TInteractiveInkCanvas | InkCanvas) {
    this.#logger.info("constructor")
    this.canvas = canvas
  }
}
