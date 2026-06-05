import { InteractiveInkEditor } from "@/editor"
import { Modal } from "./Modal"
import { Chart } from "./Chart"
import { Table, TableRow } from "./Table"
import { LoggerCategory, LoggerManager } from "@/logger"
import {
  COLORS,
  flexContainerStyle,
  SPACING,
  sectionStyle,
  cardStyle,
  selectStyle,
  gridContainerStyle,
  flexColumnStyle,
  BORDER_RADIUS
} from "./styles"
import { createColorDot, createButton, createLabeledInput, createSelect } from "./ui-utils"

/**
 * @group Components
 */
export interface EvaluableFunction {
  jiixBlock: {id: string, label: string}
  evaluables: Array<{
    inputName: string
    outputName: string
  }>
  selectedEvaluableIndex: number
  color: string
}

/**
 * @group Components
 */
export interface EvaluationResult {
  func: EvaluableFunction
  points: { [key: string]: number }[][]
}

/**
 * @group Components
 * @remarks Component for evaluating and displaying multiple math functions
 */
export class IIFunctionEvaluator {
  private editor: InteractiveInkEditor
  private jiixBlocks: {id: string, label: string}[]
  private modal?: Modal
  private evaluationResults?: EvaluationResult[]
  private tabContent?: HTMLDivElement
  private currentTab: "graph" | "table" = "graph"
  private functionsToEvaluate: EvaluableFunction[] = []
  private logger = LoggerManager.getLogger(LoggerCategory.MENU)

  // Chart colors for multiple functions
  private static readonly COLORS = [
    "#2196F3", // Blue
    "#F44336", // Red
    "#4CAF50", // Green
    "#FF9800", // Orange
    "#9C27B0", // Purple
    "#00BCD4", // Cyan
    "#FFC107", // Amber
    "#E91E63", // Pink
    "#009688", // Teal
    "#795548"  // Brown
  ]

  constructor(editor: InteractiveInkEditor, jiixBlocks: {id: string, label: string}[]) {
    this.editor = editor
    this.jiixBlocks = [...new Map(
      jiixBlocks.map(block => [block.id, block])
    ).values()]
  }

  /**
   * Show the function evaluator modal
   */
  async show(): Promise<void> {
    // Fetch evaluables for all symbols
    this.functionsToEvaluate = []

    for (let i = 0; i < this.jiixBlocks.length; i++) {
      const jiixBlock = this.jiixBlocks[i]
      if (!jiixBlock.id) continue

      try {
        const evaluables = await this.editor.getEvaluables(jiixBlock.id)
        if (evaluables.length > 0) {
          this.functionsToEvaluate.push({
            jiixBlock,
            evaluables: evaluables,
            selectedEvaluableIndex: 0,
            color: IIFunctionEvaluator.COLORS[i % IIFunctionEvaluator.COLORS.length]
          })
        }
      } catch (error) {
        this.logger.error(`Error fetching evaluables for symbol ${jiixBlock.label}:`, error)
      }
    }

    if (this.functionsToEvaluate.length === 0) {
      alert("No evaluable functions found in the selected symbols")
      return
    }

    // Create modal content
    const container = this.createModalContent(this.functionsToEvaluate)

    // Create modal
    this.modal = new Modal({
      title: "Evaluate Function",
      fields: [],
      customContent: container,
    })

    this.modal.open()
  }

  /**
   * Create the modal content with inputs and tabs
   */
  private createModalContent(functions: EvaluableFunction[]): HTMLDivElement {
    const container = document.createElement("div")
    container.style.cssText = `
     ${flexColumnStyle(SPACING.lg)}
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    `

    // Inputs section
    const inputsSection = this.createInputsSection(functions)
    container.appendChild(inputsSection)

    // Tabs section
    const tabsSection = this.createTabsSection()
    container.appendChild(tabsSection)

    return container
  }

  /**
   * Create a single function item for display
   */
  private createFunctionItem(func: EvaluableFunction): HTMLDivElement {
    const funcItem = document.createElement("div")
    funcItem.style.cssText = `
      ${flexContainerStyle(SPACING.sm)}
      margin: ${SPACING.xs} 0;
      font-size: 14px;
    `

    const colorDot = createColorDot(func.color)

    const label = document.createElement("span")
    const selectedEvaluable = func.evaluables[func.selectedEvaluableIndex]
    label.textContent = `${selectedEvaluable.outputName} = f(${selectedEvaluable.inputName})`
    label.style.fontFamily = "monospace"
    label.style.flexShrink = "0"

    const symbolLabel = document.createElement("span")
    symbolLabel.textContent = ` - ${func.jiixBlock.label || "N/A"}`
    symbolLabel.style.color = "#666"
    symbolLabel.style.flexShrink = "0"

    funcItem.appendChild(colorDot)
    funcItem.appendChild(label)
    funcItem.appendChild(symbolLabel)

    // Add select dropdown if multiple evaluables
    if (func.evaluables.length > 1) {
      const selectWrapper = document.createElement("div")
      selectWrapper.style.cssText = `
        margin-left: auto;
        ${flexContainerStyle(SPACING.xs)}
      `

      const selectLabel = document.createElement("span")
      selectLabel.textContent = "Variant:"
      selectLabel.style.cssText = `
        font-size: 12px;
        color: ${COLORS.gray[600]};
      `

      const select = createSelect({
        id: `evaluable-select-${func.jiixBlock.id}`,
        customStyle: selectStyle,
        options: func.evaluables.map((ev, evIndex) => ({
          value: String(evIndex),
          label: `${ev.outputName} = f(${ev.inputName})`,
          selected: evIndex === func.selectedEvaluableIndex
        })),
        onChange: (value) => {
          func.selectedEvaluableIndex = parseInt(value)
          const newEvaluable = func.evaluables[func.selectedEvaluableIndex]
          label.textContent = `${newEvaluable.outputName} = f(${newEvaluable.inputName})`
          // Clear evaluation results when changing evaluable
          this.evaluationResults = undefined
          this.renderCurrentTab()
        }
      })

      selectWrapper.appendChild(selectLabel)
      selectWrapper.appendChild(select)
      funcItem.appendChild(selectWrapper)
    }

    return funcItem
  }

  /**
   * Create the functions list display
   */
  private createFunctionsList(functions: EvaluableFunction[]): HTMLDivElement {
    const functionsDiv = document.createElement("div")
    functionsDiv.style.cssText = `
      ${cardStyle}
      margin-bottom: ${SPACING.lg};
    `

    const functionsTitle = document.createElement("div")
    functionsTitle.style.cssText = `
      font-weight: 600;
      margin-bottom: ${SPACING.sm};
      color: ${COLORS.gray[800]};
    `
    functionsTitle.textContent = "Functions to evaluate:"
    functionsDiv.appendChild(functionsTitle)

    functions.forEach(func => {
      const funcItem = this.createFunctionItem(func)
      functionsDiv.appendChild(funcItem)
    })

    return functionsDiv
  }

  /**
   * Create the evaluation inputs grid (from, to, points, step)
   */
  private createEvaluationInputsGrid(): {
    grid: HTMLDivElement
    inputs: {
      from: HTMLDivElement
      to: HTMLDivElement
      pointCount: HTMLDivElement
      step: HTMLDivElement
    }
  } {
    const inputGrid = document.createElement("div")
    inputGrid.style.cssText = gridContainerStyle("repeat(4, 1fr)", SPACING.md)

    const fromInput = createLabeledInput({ id: "from", label: "From:", defaultValue: -10 }).wrapper
    const toInput = createLabeledInput({ id: "to", label: "To:", defaultValue: 10 }).wrapper
    const pointCountInput = createLabeledInput({ id: "pointCount", label: "Points:", defaultValue: 21 }).wrapper
    const stepInput = createLabeledInput({ id: "step", label: "Step:", defaultValue: 1 }).wrapper

    inputGrid.appendChild(fromInput)
    inputGrid.appendChild(toInput)
    inputGrid.appendChild(pointCountInput)
    inputGrid.appendChild(stepInput)

    return {
      grid: inputGrid,
      inputs: { from: fromInput, to: toInput, pointCount: pointCountInput, step: stepInput }
    }
  }

  /**
   * Create the evaluate button
   */
  private createEvaluateButton(
    fromInput: HTMLDivElement,
    toInput: HTMLDivElement,
    pointCountInput: HTMLDivElement
  ): HTMLButtonElement {
    const evaluateBtn = createButton({
      label: "Evaluate",
      backgroundColor: COLORS.primary,
      className: "ms-menu-button",
      onClick: () => {
        this.evaluateFunctions(this.functionsToEvaluate, fromInput, toInput, pointCountInput)
      }
    })
    evaluateBtn.style.cssText += `
      margin-top: ${SPACING.lg};
      width: 100%;
    `
    return evaluateBtn
  }

  /**
   * Create the inputs section
   */
  private createInputsSection(functions: EvaluableFunction[]): HTMLDivElement {
    const section = document.createElement("div")
    section.style.cssText = sectionStyle

    // Functions list
    const functionsList = this.createFunctionsList(functions)
    section.appendChild(functionsList)

    // Input grid
    const { grid: inputGrid, inputs } = this.createEvaluationInputsGrid()
    section.appendChild(inputGrid)

    // Evaluate button
    const evaluateBtn = this.createEvaluateButton(inputs.from, inputs.to, inputs.pointCount)
    section.appendChild(evaluateBtn)

    // Setup input synchronization
    this.setupInputSynchronization(inputs.from, inputs.to, inputs.pointCount, inputs.step)

    return section
  }

  /**
   * Setup input synchronization (step/pointCount)
   */
  private setupInputSynchronization(
    fromWrapper: HTMLDivElement,
    toWrapper: HTMLDivElement,
    pointCountWrapper: HTMLDivElement,
    stepWrapper: HTMLDivElement
  ): void {
    const fromInput = fromWrapper.querySelector("input") as HTMLInputElement
    const toInput = toWrapper.querySelector("input") as HTMLInputElement
    const pointCountInput = pointCountWrapper.querySelector("input") as HTMLInputElement
    const stepInput = stepWrapper.querySelector("input") as HTMLInputElement

    let isUpdatingStep = false
    let isUpdatingPointCount = false
    let lastModified: "step" | "pointCount" = "pointCount"

    const updateStep = () => {
      if (isUpdatingStep) return
      isUpdatingPointCount = true

      const from = parseFloat(fromInput.value)
      const to = parseFloat(toInput.value)
      const pointCount = parseInt(pointCountInput.value)

      if (!isNaN(from) && !isNaN(to) && !isNaN(pointCount) && pointCount > 1) {
        const step = (to - from) / (pointCount - 1)
        stepInput.value = step.toFixed(6)
      }

      isUpdatingPointCount = false
    }

    const updatePointCount = () => {
      if (isUpdatingPointCount) return
      isUpdatingStep = true

      const from = parseFloat(fromInput.value)
      const to = parseFloat(toInput.value)
      const step = parseFloat(stepInput.value)

      if (!isNaN(from) && !isNaN(to) && !isNaN(step) && step > 0) {
        const pointCount = Math.floor((to - from) / step) + 1
        pointCountInput.value = String(Math.max(2, pointCount))
      }

      isUpdatingStep = false
    }

    const updateBasedOnLastModified = () => {
      if (lastModified === "pointCount") {
        updateStep()
      } else {
        updatePointCount()
      }
    }

    fromInput.addEventListener("input", updateBasedOnLastModified)
    toInput.addEventListener("input", updateBasedOnLastModified)
    pointCountInput.addEventListener("input", () => {
      lastModified = "pointCount"
      updateStep()
    })
    stepInput.addEventListener("input", () => {
      lastModified = "step"
      updatePointCount()
    })

    // Initial calculation
    updateStep()
  }

  /**
   * Create the tabs section (Graph and Table)
   */
  private createTabsSection(): HTMLDivElement {
    const section = document.createElement("div")
    section.style.cssText = `
      border: 1px solid #ddd;
      border-radius: ${BORDER_RADIUS.lg};
      overflow: hidden;
    `

    // Tab headers
    const tabHeaders = document.createElement("div")
    tabHeaders.style.cssText = `
      ${flexContainerStyle(SPACING.sm)}
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
    `

    const graphTab = this.createTabHeader("Graph", true)
    const tableTab = this.createTabHeader("Table", false)

    tabHeaders.appendChild(graphTab)
    tabHeaders.appendChild(tableTab)
    section.appendChild(tabHeaders)

    // Tab content
    const tabContent = document.createElement("div")
    tabContent.style.cssText = `
      padding: 16px;
      background: white;
      min-height: 400px;
    `
    section.appendChild(tabContent)

    // Store reference
    this.tabContent = tabContent

    // Initial message
    const initialMessage = document.createElement("div")
    initialMessage.style.cssText = `
      text-align: center;
      padding: 80px 20px;
      color: #999;
      font-size: 16px;
    `
    initialMessage.textContent = "Click 'Evaluate' to display results"
    tabContent.appendChild(initialMessage)

    // Tab switching
    graphTab.addEventListener("click", () => {
      if (this.currentTab === "graph") return
      this.currentTab = "graph"
      graphTab.classList.add("active")
      tableTab.classList.remove("active")
      this.renderCurrentTab()
    })

    tableTab.addEventListener("click", () => {
      if (this.currentTab === "table") return
      this.currentTab = "table"
      tableTab.classList.add("active")
      graphTab.classList.remove("active")
      this.renderCurrentTab()
    })

    return section
  }

  /**
   * Create a tab header
   */
  private createTabHeader(label: string, active: boolean): HTMLButtonElement {
    const tab = document.createElement("button")
    tab.textContent = label
    tab.className = active ? "active" : ""
    tab.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
    `

    if (active) {
      tab.style.color = COLORS.primary
      tab.style.borderBottom = `3px solid ${COLORS.primary}`
      tab.style.fontWeight = "600"
    }

    tab.addEventListener("pointerenter", () => {
      if (!tab.classList.contains("active")) {
        tab.style.background = "#f0f0f0"
      }
    })

    tab.addEventListener("pointerleave", () => {
      tab.style.background = "transparent"
    })

    // Update styles when active class changes
    const observer = new MutationObserver(() => {
      if (tab.classList.contains("active")) {
        tab.style.color = COLORS.primary
        tab.style.borderBottom = `3px solid ${COLORS.primary}`
        tab.style.fontWeight = "600"
      } else {
        tab.style.color = "#666"
        tab.style.borderBottom = "none"
        tab.style.fontWeight = "500"
      }
    })
    observer.observe(tab, { attributes: true, attributeFilter: ["class"] })

    return tab
  }

  /**
   * Evaluate all functions
   */
  private async evaluateFunctions(
    functions: EvaluableFunction[],
    fromWrapper: HTMLDivElement,
    toWrapper: HTMLDivElement,
    pointCountWrapper: HTMLDivElement
  ): Promise<void> {
    const fromInput = fromWrapper.querySelector("input") as HTMLInputElement
    const toInput = toWrapper.querySelector("input") as HTMLInputElement
    const pointCountInput = pointCountWrapper.querySelector("input") as HTMLInputElement

    const from = parseFloat(fromInput.value)
    const to = parseFloat(toInput.value)
    const pointCount = parseInt(pointCountInput.value)

    if (isNaN(from) || isNaN(to) || isNaN(pointCount)) {
      alert("Invalid input values")
      return
    }

    try {
      // Evaluate all functions
      const allResults: EvaluationResult[] = []

      for (const func of functions) {
        const selectedEvaluable = func.evaluables[func.selectedEvaluableIndex]
        const points = await this.editor.evaluateMathFunction(func.jiixBlock, {
          inputVariableName: selectedEvaluable.inputName,
          outputVariableName: selectedEvaluable.outputName,
          from,
          to,
          pointCount
        })
        allResults.push({ func, points })
      }

      // Store results for rendering
      this.evaluationResults = allResults

      // Render current tab
      this.renderCurrentTab()

    } catch (error) {
      this.logger.error("Error evaluating functions:", error)
      alert("Error evaluating functions")
    }
  }

  /**
   * Render the current tab content
   */
  private renderCurrentTab(): void {
    if (!this.tabContent) return

    // Clear container
    this.tabContent.innerHTML = ""

    const results = this.evaluationResults

    if (!results || results.length === 0) {
      const message = document.createElement("div")
      message.style.cssText = `
        text-align: center;
        padding: 80px 20px;
        color: #999;
        font-size: 16px;
      `
      message.textContent = "Click 'Evaluate' to display results"
      this.tabContent.appendChild(message)
      return
    }

    if (this.currentTab === "graph") {
      this.renderGraph(results)
    } else {
      this.renderTable(results)
    }
  }

  /**
   * Render the graph tab
   */
  private renderGraph(
    results: EvaluationResult[]
  ): void {
    if (!this.tabContent) return
    const tabContent = this.tabContent

    // Group results by inputName
    const groupedByInput = new Map<string, EvaluationResult[]>()

    results.forEach(result => {
      const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
      const inputName = evalSelected.inputName

      if (!groupedByInput.has(inputName)) {
        groupedByInput.set(inputName, [])
      }
      groupedByInput.get(inputName)!.push(result)
    })

    // Create a chart for each input group
    groupedByInput.forEach((groupResults, inputName) => {
      // Collect all output names for this group
      const outputNames = new Set<string>()
      groupResults.forEach(result => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        outputNames.add(evalSelected.outputName)
      })

      // Collect data for this group and collect colors
      const normalizedData: number[][][] = []
      const seriesColors: string[] = []

      groupResults.forEach(result => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        const inputVarName = evalSelected.inputName
        const outputVarName = evalSelected.outputName

        // Process each series of points
        // Normalize to [[x, y], [x, y], ...] format
        result.points.forEach(pointSeries => {
          const normalizedSeries = pointSeries.map(point => [
            point[inputVarName],
            point[outputVarName]
          ])
          normalizedData.push(normalizedSeries)
          seriesColors.push(result.func.color)
        })
      })

      // Create chart title with input and outputs
      const outputNamesStr = Array.from(outputNames).join(", ")
      const chartTitle = `${outputNamesStr} = f(${inputName})`

      // Create chart with actual variable names
      const chart = new Chart({
        width: Math.max(650, window.innerWidth * 0.6),
        height: 400,
        title: chartTitle,
        xLabel: inputName,
        yLabel: outputNamesStr,
        lineColor: COLORS.primary,
        showGrid: true,
        showPoints: true,
        seriesColors: seriesColors
      })

      chart.setData(normalizedData)
      tabContent.appendChild(chart.getElement())

      // Add spacing between charts
      if (groupedByInput.size > 1) {
        const spacer = document.createElement("div")
        spacer.style.height = "20px"
        tabContent.appendChild(spacer)
      }
    })
  }

  /**
   * Group evaluation results by input variable name
   */
  private groupResultsByInputName(results: EvaluationResult[]): Map<string, EvaluationResult[]> {
    const groupedByInput = new Map<string, EvaluationResult[]>()

    results.forEach(result => {
      const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
      const inputName = evalSelected.inputName

      if (!groupedByInput.has(inputName)) {
        groupedByInput.set(inputName, [])
      }
      groupedByInput.get(inputName)!.push(result)
    })

    return groupedByInput
  }

  /**
   * Create table title element
   */
  private createTableTitle(inputName: string): HTMLDivElement {
    const tableTitle = document.createElement("div")
    tableTitle.style.cssText = `
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 12px;
      color: #1976d2;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: ${BORDER_RADIUS.sm};
    `
    tableTitle.textContent = `Input: ${inputName}`
    return tableTitle
  }

  /**
   * Create table columns for a group of results
   */
  private createTableColumns(
    groupResults: EvaluationResult[],
    inputName: string
  ): (string | { header: string | HTMLElement; align?: "left" | "center" | "right"; width?: string })[] {
    const columns: (string | { header: string | HTMLElement; align?: "left" | "center" | "right"; width?: string })[] = [
      { header: "#", align: "center" as const },
      { header: inputName, align: "center" as const }
    ]

    // Add columns for each function and each series
    groupResults.forEach(result => {
      const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
      const outputName = evalSelected.outputName || "y"
      const color = result.func.color

      if (result.points.length === 1) {
        // Single series: one column
        const header = document.createElement("span")
        header.textContent = outputName
        header.style.cssText = `
          color: ${color};
          font-weight: 600;
        `
        columns.push({
          header: header,
          align: "center" as const
        })
      } else {
        // Multiple series: multiple columns
        result.points.forEach((_, seriesIndex) => {
          const header = document.createElement("span")
          header.textContent = `${outputName} #${seriesIndex + 1}`
          header.style.cssText = `
            color: ${color};
            font-weight: 600;
          `
          columns.push({
            header: header,
            align: "center" as const
          })
        })
      }
    })

    return columns
  }

  /**
   * Create table rows for a group of results
   */
  private createTableRows(
    groupResults: EvaluationResult[],
    numPoints: number
  ): TableRow[] {
    const rows: TableRow[] = []

    for (let i = 0; i < numPoints; i++) {
      const cells: HTMLElement[] = []

      // Row number
      const indexCell = document.createElement("span")
      indexCell.textContent = String(i + 1)
      indexCell.style.fontWeight = "500"
      cells.push(indexCell)

      // Input value - get from first result's first series
      const firstEvalSelected = groupResults[0].func.evaluables[groupResults[0].func.selectedEvaluableIndex]
      const xValue = groupResults[0].points[0][i][firstEvalSelected.inputName]
      const xCell = document.createElement("span")
      xCell.textContent = typeof xValue === "number" ? xValue.toFixed(4) : String(xValue)
      xCell.style.fontFamily = "monospace"
      cells.push(xCell)

      // Output values for each function and each series
      groupResults.forEach(result => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        const color = result.func.color

        result.points.forEach(pointSeries => {
          const yValue = pointSeries[i][evalSelected.outputName]
          const yCell = document.createElement("span")

          if (typeof yValue === "number") {
            if (isNaN(yValue)) {
              yCell.textContent = "NaN"
              yCell.style.color = "#999"
              yCell.style.fontStyle = "italic"
            } else if (!isFinite(yValue)) {
              yCell.textContent = yValue > 0 ? "+∞" : "-∞"
              yCell.style.color = "#ff9800"
              yCell.style.fontWeight = "bold"
            } else {
              yCell.textContent = yValue.toFixed(4)
              yCell.style.color = color
            }
          } else {
            yCell.textContent = String(yValue)
          }

          yCell.style.fontFamily = "monospace"
          cells.push(yCell)
        })
      })

      rows.push({ cells })
    }

    return rows
  }

  /**
   * Render the table tab
   */
  private renderTable(
    results: EvaluationResult[]
  ): void {
    if (!this.tabContent) return
    const tabContent = this.tabContent

    // Group results by inputName
    const groupedByInput = this.groupResultsByInputName(results)

    // Create a table for each input group
    groupedByInput.forEach((groupResults, inputName) => {
      // Add title for this table if multiple groups
      if (groupedByInput.size > 1) {
        const tableTitle = this.createTableTitle(inputName)
        tabContent.appendChild(tableTitle)
      }

      // Get the number of points from first result's first series
      const numPoints = groupResults[0].points[0].length

      // Build columns and rows
      const columns = this.createTableColumns(groupResults, inputName)
      const rows = this.createTableRows(groupResults, numPoints)

      // Create table
      const table = new Table({
        columns,
        rows,
        stickyHeader: true,
        hoverEffect: true
      })

      const tableWrapper = document.createElement("div")
      tableWrapper.style.cssText = `
        max-height: 400px;
        overflow: auto;
        margin-bottom: 24px;
      `
      tableWrapper.appendChild(table.getElement())
      tabContent.appendChild(tableWrapper)
    })
  }

  /**
   * Close the evaluator
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
    this.tabContent = undefined
    this.evaluationResults = undefined
    this.currentTab = "graph"
    this.functionsToEvaluate = []
  }
}
