import { InteractiveInkEditor } from "@/editor"
import { isRecognizedMathSymbol, IIRecognizedMath } from "@/symbol"
import { Modal } from "./Modal"
import { Table, TableRow } from "./Table"
import { FunctionEvaluator } from "./FunctionEvaluator"
import { DiagnosticChecker } from "./DiagnosticChecker"
import { COLORS, flexContainerStyle, SPACING } from "./styles"
import { createButton, createStatusBadge } from "./ui-utils"

/**
 * @group Components
 */
export interface MathSymbolCapabilities {
  symbol: IIRecognizedMath
  canCheckDiagnostic: boolean
  canEditVariables: boolean
  canCompute: boolean
  canEvaluate: boolean
}

/**
 * @group Components
 * @remarks Component for displaying math symbols capabilities in a table
 */
export class MathCapabilitiesTable {
  private editor: InteractiveInkEditor
  private modal?: Modal
  private table?: Table
  private capabilities: MathSymbolCapabilities[] = []
  private actionButtons: {
    checkDiagnostic?: HTMLButtonElement
    editVariables?: HTMLButtonElement
    computeResult?: HTMLButtonElement
    evaluateFunction?: HTMLButtonElement
  } = {}

  constructor(editor: InteractiveInkEditor) {
    this.editor = editor
  }

  /**
   * Fetch capabilities for a single math symbol
   */
  private async fetchSymbolCapabilities(mathSymbol: IIRecognizedMath): Promise<MathSymbolCapabilities> {
    let canCheckDiagnostic = false
    let canEditVariables = false
    let canCompute = false
    let canEvaluate = false

    if (mathSymbol.jiixId) {
      try {
        const [actions, variables, evaluables] = await Promise.all([
          this.editor.getAvailableActions(mathSymbol.jiixId),
          this.editor.getVariables(mathSymbol.jiixId),
          this.editor.getEvaluables(mathSymbol.jiixId)
        ])

        canCheckDiagnostic = true // Always available if jiixId exists
        canEditVariables = Object.keys(variables).length > 0
        canCompute = actions?.includes("numerical-computation") && !mathSymbol.solverOutputStrokeIds
        canEvaluate = evaluables?.length ? true : false
      } catch (error) {
        console.error("Error fetching capabilities:", error)
      }
    }

    return {
      symbol: mathSymbol,
      canCheckDiagnostic,
      canEditVariables,
      canCompute,
      canEvaluate
    }
  }

  /**
   * Create the table element
   */
  private createTable(capabilities: MathSymbolCapabilities[]): Table {
    // Store capabilities for action buttons
    this.capabilities = capabilities

    // Prepare rows
    const rows: TableRow[] = capabilities.map(cap => {
      // Symbol label cell
      const symbolCell = document.createElement("span")
      symbolCell.textContent = cap.symbol.label || "N/A"
      symbolCell.title = cap.symbol.label || ""
      symbolCell.style.cssText = `
        font-family: monospace;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      `

      // Create capability marks
      const capabilityValues = [
        cap.canCheckDiagnostic,
        cap.canEditVariables,
        cap.canCompute,
        cap.canEvaluate
      ]

      const capabilityCells = capabilityValues.map(canDo => {
        return createStatusBadge(canDo)
      })

      return {
        cells: [symbolCell, ...capabilityCells],
        data: cap.symbol // Store symbol reference in row data
      }
    })

    // Create table
    const table = new Table({
      columns: [
        { header: "Symbol", align: "left" },
        { header: "Check Diagnostic", align: "center" },
        { header: "Edit Variables", align: "center" },
        { header: "Compute Result", align: "center" },
        { header: "Evaluate Function", align: "center" }
      ],
      rows,
      stickyHeader: false,
      hoverEffect: true,
      selectable: true,
      multiSelect: true,
      onRowClick: this.handleRowSelection.bind(this)
    })

    return table
  }

  /**
   * Handle row selection
   */
  private handleRowSelection(): void {
    if (!this.table) return

    // Get selected symbols from table
    const selectedSymbols = this.table.getSelectedRowsData() as IIRecognizedMath[]
    const selectedIds = selectedSymbols.map(s => s.id)

    // Update editor selection
    this.editor.select(selectedIds)

    // Update action buttons state
    this.updateActionButtons()
  }

  /**
   * Update action buttons enabled/disabled state based on selected rows
   */
  private updateActionButtons(): void {
    if (!this.table) return

    const selectedIndices = this.table.getSelectedRows()
    const selectedCapabilities = selectedIndices.map(index => this.capabilities[index])

    // Check if any selected row can perform each action
    const canCheckDiagnostic = selectedCapabilities.some(cap => cap.canCheckDiagnostic)
    const canEditVariables = selectedCapabilities.some(cap => cap.canEditVariables)
    const canCompute = selectedCapabilities.some(cap => cap.canCompute)
    const canEvaluate = selectedCapabilities.some(cap => cap.canEvaluate)

    // Update button states
    if (this.actionButtons.checkDiagnostic) {
      this.actionButtons.checkDiagnostic.disabled = !canCheckDiagnostic
      this.actionButtons.checkDiagnostic.style.opacity = canCheckDiagnostic ? "1" : "0.5"
    }
    if (this.actionButtons.editVariables) {
      this.actionButtons.editVariables.disabled = !canEditVariables
      this.actionButtons.editVariables.style.opacity = canEditVariables ? "1" : "0.5"
    }
    if (this.actionButtons.computeResult) {
      this.actionButtons.computeResult.disabled = !canCompute
      this.actionButtons.computeResult.style.opacity = canCompute ? "1" : "0.5"
    }
    if (this.actionButtons.evaluateFunction) {
      this.actionButtons.evaluateFunction.disabled = !canEvaluate
      this.actionButtons.evaluateFunction.style.opacity = canEvaluate ? "1" : "0.5"
    }
  }

  /**
   * Create a single action button
   */
  private createActionButton(config: {
    label: string
    backgroundColor: string
    onClick: () => void
  }): HTMLButtonElement {
    const button = createButton({
      label: config.label,
      backgroundColor: config.backgroundColor,
      onClick: config.onClick,
      disabled: true,
      className: "ms-menu-button"
    })
    return button
  }

  /**
   * Create action buttons container
   */
  private createActionButtons(): HTMLDivElement {
    const container = document.createElement("div")
    container.style.cssText = `
      ${flexContainerStyle(SPACING.sm)}
      padding: ${SPACING.lg};
      border-top: 2px solid #ddd;
      background: ${COLORS.gray[100]};
      flex-wrap: wrap;
    `

    // Define button configurations
    const buttonConfigs = [
      {
        label: "Check Diagnostic",
        backgroundColor: COLORS.primary,
        onClick: () => this.executeCheckDiagnostic(),
        key: "checkDiagnostic" as const
      },
      {
        label: "Edit Variables",
        backgroundColor: COLORS.secondary,
        onClick: () => this.executeEditVariables(),
        key: "editVariables" as const
      },
      {
        label: "Compute Result",
        backgroundColor: COLORS.success,
        onClick: () => this.executeComputeResult(),
        key: "computeResult" as const
      },
      {
        label: "Evaluate Function",
        backgroundColor: COLORS.purple,
        onClick: () => this.executeEvaluateFunction(),
        key: "evaluateFunction" as const
      }
    ]

    // Create and append buttons
    buttonConfigs.forEach(config => {
      const button = this.createActionButton(config)
      this.actionButtons[config.key] = button
      container.appendChild(button)
    })

    return container
  }

  /**
   * Execute Check Diagnostic action for selected rows
   */
  private async executeCheckDiagnostic(): Promise<void> {
    if (!this.table) return

    const selectedIndices = this.table.getSelectedRows()
    const selectedSymbols = selectedIndices
      .map(index => this.capabilities[index])
      .filter(cap => cap.canCheckDiagnostic)
      .map(cap => cap.symbol)

    if (selectedSymbols.length === 0) return

    // Use DiagnosticChecker component
    const checker = new DiagnosticChecker(this.editor, selectedSymbols)
    await checker.show()
  }

  /**
   * Execute Edit Variables action for selected rows
   */
  private async executeEditVariables(): Promise<void> {
    if (!this.table) return

    const selectedIndices = this.table.getSelectedRows()
    const selectedCapabilities = selectedIndices
      .map(index => this.capabilities[index])
      .filter(cap => cap.canEditVariables)

    if (selectedCapabilities.length === 0) return

    alert(`Edit Variables will be executed for ${selectedCapabilities.length} symbol(s)`)
    // TODO: Implement actual variable editing
  }

  /**
   * Execute Compute Result action for selected rows
   */
  private async executeComputeResult(): Promise<void> {
    if (!this.table) return

    const selectedIndices = this.table.getSelectedRows()
    const selectedCapabilities = selectedIndices
      .map(index => this.capabilities[index])
      .filter(cap => cap.canCompute)

    if (selectedCapabilities.length === 0) return

    for (const cap of selectedCapabilities) {
      try {
        await this.editor.computeMathNumericalResult(cap.symbol, this.editor.mathComputationMode)
      } catch (error) {
        console.error(`Error computing result for ${cap.symbol.label}:`, error)
      }
    }
  }

  /**
   * Execute Evaluate Function action for selected rows
   */
  private async executeEvaluateFunction(): Promise<void> {
    if (!this.table) return

    const selectedIndices = this.table.getSelectedRows()
    const selectedSymbols = selectedIndices
      .map(index => this.capabilities[index])
      .filter(cap => cap.canEvaluate)
      .map(cap => cap.symbol)

    if (selectedSymbols.length === 0) return

    // Use FunctionEvaluator component
    const evaluator = new FunctionEvaluator(this.editor, selectedSymbols)
    await evaluator.show()
  }

  /**
   * Show the capabilities overview modal
   */
  async show(): Promise<void> {
    // Get all math symbols
    const mathSymbols = this.editor.model.symbols.filter(isRecognizedMathSymbol) as IIRecognizedMath[]

    if (mathSymbols.length === 0) {
      alert("No math symbols found in the model")
      return
    }

    // Fetch capabilities for all symbols
    const capabilities: MathSymbolCapabilities[] = []
    for (const mathSymbol of mathSymbols) {
      const cap = await this.fetchSymbolCapabilities(mathSymbol)
      capabilities.push(cap)
    }

    // Create table
    this.table = this.createTable(capabilities)

    // Create action buttons
    const actionButtons = this.createActionButtons()

    // Create container
    const container = document.createElement("div")
    container.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    `

    const tableWrapper = document.createElement("div")
    tableWrapper.style.cssText = `
      overflow: auto;
      flex: 1;
    `
    tableWrapper.appendChild(this.table.getElement())

    container.appendChild(tableWrapper)
    container.appendChild(actionButtons)

    // Show modal
    this.modal = new Modal({
      title: `Math Symbols Capabilities (${mathSymbols.length} symbols)`,
      fields: [],
      customContent: container,
      buttons: [
        {
          label: "Close",
          type: "primary",
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
    this.table = undefined
    this.capabilities = []
    this.actionButtons = {}
  }
}
