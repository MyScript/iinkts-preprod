import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { InteractiveInkCanvasConfiguration } from "@/canvas/variants/InteractiveInkCanvasConfiguration"
import type { WebSocketClient } from "@/client"
import type { TBox } from "@/core/geometry"
import { BoxOps } from "@/core/geometry"
import { jiixToLLM, jiixToMarkdown, jiixToMermaid, jiixToPlantUML } from "@/export"
import type { TExporterMap } from "@/manager/base/ExportManager"
import { ExportManager } from "@/manager/base/ExportManager"
import type { PDFExportManager } from "@/manager/base/PDFExportManager"
import type { TJIIXExport } from "@/model"
import { ExportType } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { TSymbol } from "@/symbol"
import { isMath, isStroke, isText } from "@/symbol"
import { MathOps } from "@/symbol/math/Math"
import { TextOps } from "@/symbol/text/Text"

/** JIIX stand-in used when the content has not been recognized yet, so exports stay empty instead of throwing */
const EMPTY_JIIX: TJIIXExport = { type: "Container", id: "", version: "" }

/**
 * Export manager for {@link InteractiveInkCanvas}.
 *
 * Adds the recognition-derived formats to the local ones handled by {@link ExportManager}: `text`
 * from the JIIX stroke index, and `jiix`/`markdown`/`mermaid`/`plantuml`/`llm` from the single
 * JIIX export the server produces.
 *
 * @group Manager
 */
export class IIExportManager extends ExportManager {
  protected managerName = "IIExportManager"

  constructor(canvas: TInteractiveInkCanvas, pdfExport: PDFExportManager) {
    super(canvas, pdfExport)
  }

  get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  get client(): WebSocketClient {
    return this.canvas.client
  }

  get configuration(): InteractiveInkCanvasConfiguration {
    return this.canvas.configuration
  }

  protected get exporters(): TExporterMap {
    return {
      ...this.localExporters,
      text: (options) => Promise.resolve(this.extractTextFromSymbols(this.resolveSymbols(options))),
      jiix: () => this.exportJiix(),
      markdown: async () => jiixToMarkdown(await this.exportJiix()),
      mermaid: async () => jiixToMermaid(await this.exportJiix()),
      plantuml: async () => jiixToPlantUML(await this.exportJiix()),
      llm: async () => jiixToLLM(await this.exportJiix()),
    }
  }

  /**
   * Single access point to the JIIX export — every recognition-derived format goes through it.
   *
   * @remarks
   * JIIX is produced server-side for the whole content, so the export options do not apply:
   * `scope` and `symbols` are ignored by the formats derived from it.
   */
  protected async exportJiix(): Promise<TJIIXExport> {
    const exports = await this.canvas.export([ExportType.JIIX])
    return exports[ExportType.JIIX] ?? EMPTY_JIIX
  }

  /**
   * Extract the recognized text of the given symbols in reading order.
   *
   * Strokes carrying JIIX metadata contribute their block label once, whatever the number of
   * strokes the block spans, and sort by their own bounding box rather than by draw order.
   */
  protected extractTextFromSymbols(symbols: TSymbol[]): string {
    const entries: { box: TBox; label: string }[] = []
    const seenElementIds = new Set<string>()

    symbols.forEach((s) => {
      if (isText(s)) {
        const content = TextOps.getLabel(s)
        if (content) {
          entries.push({ box: BoxOps.createFromPoints(s.vertices), label: content })
        }
      } else if (isMath(s)) {
        const content = MathOps.getLabel(s)
        if (content) {
          entries.push({ box: BoxOps.createFromPoints(s.vertices), label: content })
        }
      } else if (isStroke(s)) {
        const element = this.canvas.jiix.getElementForStroke(s.id)
        if (element && !seenElementIds.has(element.id)) {
          seenElementIds.add(element.id)
          const label = this.canvas.jiix.getBlockLabel(element.id)
          if (label) {
            const box = element["bounding-box"] ?? BoxOps.createFromPoints(s.vertices)
            entries.push({ box, label })
          }
        }
      }
    })

    return this.#groupEntriesIntoLines(entries)
      .map((line) => line.map((e) => e.label).join(" "))
      .join("\n")
  }

  /**
   * Group entries (words, math expressions) sharing a vertical extent into the same reading line,
   * ordered top-to-bottom then left-to-right, so words drawn on the same line stay on the same
   * line in the export.
   */
  #groupEntriesIntoLines<T extends { box: TBox }>(entries: T[]): T[][] {
    const sortedByTop = [...entries].sort((a, b) => a.box.y - b.box.y)
    const lines: { bottom: number; entries: T[] }[] = []

    sortedByTop.forEach((entry) => {
      const bottom = entry.box.y + entry.box.height
      const currentLine = lines[lines.length - 1]
      if (currentLine && entry.box.y < currentLine.bottom) {
        currentLine.entries.push(entry)
        currentLine.bottom = Math.max(currentLine.bottom, bottom)
      } else {
        lines.push({ bottom, entries: [entry] })
      }
    })

    return lines.map((line) => line.entries.sort((a, b) => a.box.x - b.box.x))
  }
}
