import { InteractiveInkEditor } from "@/editor"
import { Modal } from "./Modal"
import { LoggerCategory, LoggerManager } from "@/logger"
import { getMathDiagnosticMessage } from "@/constants/MathDiagnosticMessages"
import { BORDER_RADIUS, flexColumnStyle } from "./styles"

/**
 * @group Components
 */
export interface SymbolDiagnostic {
  jiixBlockId: string
  computeDiagnostic: string
  evaluationDiagnostic: string
}

/**
 * @group Components
 * @remarks Component for checking and displaying diagnostics for multiple math symbols
 */
export class IIDiagnosticChecker {
  private editor: InteractiveInkEditor
  private jiixBlockIds: string[]
  private modal?: Modal
  private logger = LoggerManager.getLogger(LoggerCategory.MENU)

  constructor(editor: InteractiveInkEditor, jiixBlockIds: string[]) {
    this.editor = editor
    this.jiixBlockIds = [...new Set(jiixBlockIds)]
  }

  /**
   * Show the diagnostic checker modal
   */
  async show(): Promise<void> {
    // Fetch diagnostics for all symbols
    const diagnostics: SymbolDiagnostic[] = []

    for (const jiixBlockId of this.jiixBlockIds) {
      if (!jiixBlockId) {
        this.logger.warn(`Invalid jiixBlockId`)
        continue
      }

      try {
        const [computeDiagnostic, evaluationDiagnostic] = await Promise.all([
          this.editor.getDiagnostic(jiixBlockId, "numerical-computation"),
          this.editor.getDiagnostic(jiixBlockId, "evaluation")
        ])

        diagnostics.push({
          jiixBlockId,
          computeDiagnostic,
          evaluationDiagnostic
        })
      } catch (error) {
        const label = this.editor.jiix.getBlockLabel(jiixBlockId)
        this.logger.error(`Error fetching diagnostics for symbol ${label}:`, error)
      }
    }

    if (diagnostics.length === 0) {
      alert("No diagnostics could be retrieved for the selected symbols")
      return
    }

    // Create modal content
    const container = this.createModalContent(diagnostics)

    // Create modal
    this.modal = new Modal({
      title: `Math Diagnostic${diagnostics.length > 1 ? "s" : ""} (${diagnostics.length} symbol${diagnostics.length > 1 ? "s" : ""})`,
      fields: [],
      customContent: container,
    })

    this.modal.open()
  }

  /**
   * Create the modal content with diagnostics
   */
  private createModalContent(diagnostics: SymbolDiagnostic[]): HTMLDivElement {
    const container = document.createElement("div")
    container.style.cssText = `
      ${flexColumnStyle("20px")}
      width: 100%;
      height: 100%;
      overflow-y: auto;
      padding: 16px;
      box-sizing: border-box;
    `

    // Create a section for each symbol
    diagnostics.forEach(diagnostic => {
      const symbolSection = this.createSymbolDiagnosticSection(diagnostic)
      container.appendChild(symbolSection)
    })

    return container
  }

  /**
   * Create a diagnostic section for a single symbol
   */
  private createSymbolDiagnosticSection(diagnostic: SymbolDiagnostic): HTMLDivElement {
    const section = document.createElement("div")
    section.style.cssText = `
      border: 2px solid #e0e0e0;
      border-radius: ${BORDER_RADIUS.lg};
      padding: 16px;
      background: white;
    `

    // Expression header
    const expressionDiv = document.createElement("div")
    expressionDiv.style.cssText = `
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: 600;
      color: #1976d2;
      padding: 12px;
      background: #e3f2fd;
      border-radius: ${BORDER_RADIUS.sm};
    `
    const label = this.editor.jiix.getBlockLabel(diagnostic.jiixBlockId) || "N/A"
    expressionDiv.innerHTML = `<strong>Expression:</strong> ${label}`
    section.appendChild(expressionDiv)

    // Severity colors configuration
    const severityColors = {
      success: { bg: "#e8f5e9", color: "#2e7d32", icon: "✓" },
      warning: { bg: "#fff3e0", color: "#f57c00", icon: "⚠" },
      error: { bg: "#ffebee", color: "#c62828", icon: "✗" },
      info: { bg: "#e3f2fd", color: "#1976d2", icon: "ℹ" }
    }

    // Get diagnostic info
    const computeInfo = getMathDiagnosticMessage(diagnostic.computeDiagnostic)
    const evalInfo = getMathDiagnosticMessage(diagnostic.evaluationDiagnostic)

    // Numerical computation diagnostic
    section.appendChild(this.createDiagnosticSubSection(
      "🔢 Numerical Computation",
      diagnostic.computeDiagnostic,
      computeInfo,
      severityColors
    ))

    // Evaluation diagnostic
    section.appendChild(this.createDiagnosticSubSection(
      "📊 Function Evaluation",
      diagnostic.evaluationDiagnostic,
      evalInfo,
      severityColors
    ))

    return section
  }

  /**
   * Create a diagnostic sub-section
   */
  private createDiagnosticSubSection(
    taskName: string,
    diagnosticCode: string,
    diagnosticInfo: { title: string, message: string, severity: "success" | "warning" | "error" | "info" },
    severityColors: { [key: string]: { bg: string, color: string, icon: string } }
  ): HTMLDivElement {
    const subSection = document.createElement("div")
    subSection.style.cssText = `
      margin-bottom: 20px;
      padding: 16px;
      background: #fafafa;
      border-radius: ${BORDER_RADIUS.md};
      border: 1px solid #e0e0e0;
    `

    // Task title
    const taskTitle = document.createElement("div")
    taskTitle.style.cssText = `
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #424242;
    `
    taskTitle.textContent = taskName
    subSection.appendChild(taskTitle)

    // Diagnostic code
    const codeDiv = document.createElement("div")
    codeDiv.style.cssText = `
      font-size: 13px;
      margin-bottom: 12px;
      padding: 8px 10px;
      background: #f5f5f5;
      border-radius: ${BORDER_RADIUS.sm};
      font-family: monospace;
      border: 1px solid #e0e0e0;
    `
    codeDiv.innerHTML = `<strong>Code:</strong> ${diagnosticCode}`
    subSection.appendChild(codeDiv)

    // Status indicator
    const statusDiv = document.createElement("div")
    statusDiv.style.cssText = `
      font-size: 16px;
      margin-bottom: 10px;
      padding: 10px 12px;
      border-radius: ${BORDER_RADIUS.sm};
      font-weight: bold;
    `

    const colors = severityColors[diagnosticInfo.severity]
    statusDiv.style.background = colors.bg
    statusDiv.style.color = colors.color
    statusDiv.innerHTML = `${colors.icon} ${diagnosticInfo.title}`
    subSection.appendChild(statusDiv)

    // Message
    const messageDiv = document.createElement("div")
    messageDiv.style.cssText = `
      font-size: 14px;
      line-height: 1.5;
      color: #555;
    `
    messageDiv.textContent = diagnosticInfo.message
    subSection.appendChild(messageDiv)

    return subSection
  }

  /**
   * Close the diagnostic checker
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
  }
}
