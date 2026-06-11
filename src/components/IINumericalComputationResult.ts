import { InteractiveInkEditor } from "@/editor"
import { IIRecognizedMath } from "@/symbol"
import { Modal } from "./Modal"
import { LoggerCategory, LoggerManager } from "@/logger"
import { BORDER_RADIUS, flexColumnStyle, SPACING } from "./styles"

/**
 * @group Components
 */
export interface NumericalComputationResult {
  symbol: IIRecognizedMath
  value?: number
  error?: string
}

/**
 * @group Components
 * @remarks Component for computing and displaying numerical results for multiple math symbols
 */
export class IINumericalComputationResult {
  private editor: InteractiveInkEditor
  private symbols: IIRecognizedMath[]
  private modal?: Modal
  private logger = LoggerManager.getLogger(LoggerCategory.MENU)

  constructor(editor: InteractiveInkEditor, symbols: IIRecognizedMath[]) {
    this.editor = editor
    this.symbols = symbols
  }

  /**
   * Compute numerical results for all symbols
   */
  private async computeResults(): Promise<NumericalComputationResult[]> {
    const results: NumericalComputationResult[] = []

    for (const symbol of this.symbols) {
      try {
        const result = await this.editor.computeMathNumericalResult(symbol, this.editor.drawComputationResult)

        if (!this.editor.drawComputationResult && result.value !== undefined) {
          results.push({
            symbol,
            value: result.value
          })
        } else if (this.editor.drawComputationResult) {
          results.push({
            symbol,
            value: result.value
          })
        }
      } catch (error) {
        this.logger.error("computeResults", error)
        results.push({
          symbol,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  /**
   * Create the results display
   */
  private createResultsDisplay(results: NumericalComputationResult[]): HTMLDivElement {
    const container = document.createElement("div")
    container.style.cssText = `
      ${flexColumnStyle(SPACING.md)}
      max-height: 500px;
      overflow-y: auto;
    `

    results.forEach(result => {
      const resultItem = document.createElement("div")
      resultItem.style.cssText = `
        padding: 12px;
        background: #f9f9f9;
        border-radius: ${BORDER_RADIUS.md};
        border: 1px solid #ddd;
      `

      const symbolLabel = document.createElement("div")
      symbolLabel.style.cssText = `
        font-weight: 600;
        margin-bottom: 8px;
        color: #424242;
        font-family: monospace;
      `
      symbolLabel.textContent = result.symbol.label || "N/A"

      resultItem.appendChild(symbolLabel)

      if (result.error) {
        const errorDiv = document.createElement("div")
        errorDiv.style.cssText = `
          color: #f44336;
          font-size: 14px;
          padding: 8px;
          background: #ffebee;
          border-radius: ${BORDER_RADIUS.sm};
        `
        errorDiv.textContent = `Error: ${result.error}`
        resultItem.appendChild(errorDiv)
      } else if (result.value !== undefined) {
        const valueDiv = document.createElement("div")
        valueDiv.style.cssText = `
          font-size: 18px;
          font-weight: 500;
          color: #4CAF50;
          font-family: monospace;
          padding: 8px;
          background: #e8f5e9;
          border-radius: ${BORDER_RADIUS.sm};
        `
        valueDiv.textContent = `Result: ${result.value}`
        resultItem.appendChild(valueDiv)
      } else {
        const infoDiv = document.createElement("div")
        infoDiv.style.cssText = `
          color: #666;
          font-size: 14px;
          font-style: italic;
        `
        infoDiv.textContent = this.editor.drawComputationResult
          ? "Result drawn in editor"
          : "No numerical value returned"
        resultItem.appendChild(infoDiv)
      }

      container.appendChild(resultItem)
    })

    return container
  }

  /**
   * Show the numerical computation results modal
   */
  async show(): Promise<void> {
    this.logger.info("show", { symbols: this.symbols })

    // Compute results
    const results = await this.computeResults()

    // Create results display
    const resultsDisplay = this.createResultsDisplay(results)

    // Create modal
    this.modal = new Modal({
      title: `Numerical Computation Results (${this.symbols.length} symbol${this.symbols.length > 1 ? "s" : ""})`,
      fields: [],
      customContent: resultsDisplay,
      buttons: [
        {
          label: "Close",
          type: "secondary",
          callback: (): void => this.close()
        }
      ]
    })

    this.modal.open()
  }

  /**
   * Close the modal
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
  }
}
