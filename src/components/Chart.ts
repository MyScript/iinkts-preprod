/**
 * @group Components
 */
export interface ChartConfig {
  width?: number
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
  lineColor?: string
  lineWidth?: number
  showGrid?: boolean
  showPoints?: boolean
}

/**
 * @group Components
 */
export class Chart {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: Required<ChartConfig>
  private points: number[][] = []
  private container: HTMLDivElement
  private tableElement?: HTMLTableElement

  constructor(config: ChartConfig = {}) {
    this.config = {
      width: config.width ?? 500,
      height: config.height ?? 350,
      title: config.title ?? "",
      xLabel: config.xLabel ?? "x",
      yLabel: config.yLabel ?? "y",
      lineColor: config.lineColor ?? "#2196F3",
      lineWidth: config.lineWidth ?? 2,
      showGrid: config.showGrid ?? true,
      showPoints: config.showPoints ?? true
    }

    // Create container
    this.container = document.createElement("div")
    this.container.style.cssText =
      "display: flex; flex-direction: column; gap: 16px;"

    this.canvas = document.createElement("canvas")
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height
    this.canvas.style.cssText = `
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      display: block;
      max-width: 100%;
    `

    const ctx = this.canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas 2D context")
    }
    this.ctx = ctx

    this.container.appendChild(this.canvas)
  }

  /**
   * Set the data points to plot
   * @param points Array of [x, y] coordinates, array of objects, or array of two arrays [xValues[], yValues[]]
   */
  setData(points: number[][] | { [key: string]: number }[]): void {
    // Check if data is array of objects { x: val, y: val }
    if (
      points.length > 0 &&
      typeof points[0] === "object" &&
      !Array.isArray(points[0])
    ) {
      const objectArray = points as { [key: string]: number }[]
      const keys = Object.keys(objectArray[0])
      if (keys.length >= 2) {
        // Convert objects to [[x, y], ...] format
        this.points = objectArray.map((obj) => [obj[keys[0]], obj[keys[1]]])
      }
    }
    // Check if data is in format [[x1, x2, ...], [y1, y2, ...]] and convert to [[x1, y1], [x2, y2], ...]
    else if (
      points.length === 2 &&
      Array.isArray(points[0]) &&
      Array.isArray(points[1])
    ) {
      const xValues = points[0] as number[]
      const yValues = points[1] as number[]
      this.points = xValues.map((x, i) => [x, yValues[i]])
    } else {
      this.points = points as number[][]
    }

    this.draw()
    this.updateTable()
  }

  /**
   * Get the container element (includes canvas and table)
   */
  getElement(): HTMLDivElement {
    return this.container
  }

  private createTable(): HTMLTableElement {
    const table = document.createElement("table")
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
      display: block;
    `

    return table
  }

  private updateTable(): void {
    // Remove old table if exists
    if (this.tableElement) {
      this.tableElement.remove()
    }

    if (this.points.length === 0) return

    this.tableElement = this.createTable()

    // Create thead
    const thead = document.createElement("thead")
    thead.style.cssText =
      "position: sticky; top: 0; background: white; font-weight: bold;"
    const headerRow = document.createElement("tr")

    const thIndex = document.createElement("th")
    thIndex.textContent = "#"
    thIndex.style.cssText =
      "border: 1px solid #ddd; padding: 8px; text-align: center; background: #f5f5f5;"
    headerRow.appendChild(thIndex)

    const thX = document.createElement("th")
    thX.textContent = this.config.xLabel
    thX.style.cssText =
      "border: 1px solid #ddd; padding: 8px; text-align: center; background: #f5f5f5;"
    headerRow.appendChild(thX)

    const thY = document.createElement("th")
    thY.textContent = this.config.yLabel
    thY.style.cssText =
      "border: 1px solid #ddd; padding: 8px; text-align: center; background: #f5f5f5;"
    headerRow.appendChild(thY)

    thead.appendChild(headerRow)
    this.tableElement.appendChild(thead)

    // Create tbody
    const tbody = document.createElement("tbody")
    this.points.forEach(([x, y], index) => {
      const row = document.createElement("tr")
      row.style.cssText = "hover:background-color: #f9f9f9;"

      const tdIndex = document.createElement("td")
      tdIndex.textContent = String(index + 1)
      tdIndex.style.cssText =
        "border: 1px solid #ddd; padding: 8px; text-align: center; background: #fafafa;"
      row.appendChild(tdIndex)

      const tdX = document.createElement("td")
      tdX.textContent = isNaN(x) || !isFinite(x) ? "N/A" : x.toFixed(4)
      tdX.style.cssText =
        "border: 1px solid #ddd; padding: 8px; text-align: right;"
      if (isNaN(x) || !isFinite(x)) {
        tdX.style.cssText += " color: #999; font-style: italic;"
      }
      row.appendChild(tdX)

      const tdY = document.createElement("td")
      tdY.textContent = isNaN(y) || !isFinite(y) ? "N/A" : y.toFixed(4)
      tdY.style.cssText =
        "border: 1px solid #ddd; padding: 8px; text-align: right;"
      if (isNaN(y) || !isFinite(y)) {
        tdY.style.cssText += " color: #999; font-style: italic;"
      }
      row.appendChild(tdY)

      tbody.appendChild(row)
    })
    this.tableElement.appendChild(tbody)

    this.container.appendChild(this.tableElement)
  }

  private draw(): void {
    if (this.points.length === 0) {
      return
    }

    const ctx = this.ctx
    const width = this.config.width
    const height = this.config.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Define margins
    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Calculate data bounds (filter out NaN values)
    const xValues = this.points
      .map((p) => p[0])
      .filter((v) => !isNaN(v) && isFinite(v))
    const yValues = this.points
      .map((p) => p[1])
      .filter((v) => !isNaN(v) && isFinite(v))

    if (xValues.length === 0 || yValues.length === 0) {
      return
    }

    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)

    // Add padding to y range
    const yRange = yMax - yMin
    const yPadding = yRange * 0.1
    const yMinPadded = yMin - yPadding
    const yMaxPadded = yMax + yPadding

    // Scale functions
    const scaleX = (x: number) =>
      margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth
    const scaleY = (y: number) =>
      margin.top +
      chartHeight -
      ((y - yMinPadded) / (yMaxPadded - yMinPadded)) * chartHeight

    // Draw title
    if (this.config.title) {
      ctx.fillStyle = "#333"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(this.config.title, width / 2, 25)
    }

    // Draw grid
    if (this.config.showGrid) {
      ctx.strokeStyle = "#e0e0e0"
      ctx.lineWidth = 1

      // Vertical grid lines
      const xSteps = 10
      for (let i = 0; i <= xSteps; i++) {
        const x = margin.left + (chartWidth / xSteps) * i
        ctx.beginPath()
        ctx.moveTo(x, margin.top)
        ctx.lineTo(x, margin.top + chartHeight)
        ctx.stroke()
      }

      // Horizontal grid lines
      const ySteps = 10
      for (let i = 0; i <= ySteps; i++) {
        const y = margin.top + (chartHeight / ySteps) * i
        ctx.beginPath()
        ctx.moveTo(margin.left, y)
        ctx.lineTo(margin.left + chartWidth, y)
        ctx.stroke()
      }
    }

    // Draw axes
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top + chartHeight)
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, margin.top)
    ctx.lineTo(margin.left, margin.top + chartHeight)
    ctx.stroke()

    // Draw axis labels
    ctx.fillStyle = "#333"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"

    // X-axis label
    ctx.fillText(this.config.xLabel, width / 2, height - 10)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(this.config.yLabel, 0, 0)
    ctx.restore()

    // Draw tick labels
    ctx.fillStyle = "#666"
    ctx.font = "10px sans-serif"

    // X-axis ticks
    const xTickCount = 5
    for (let i = 0; i <= xTickCount; i++) {
      const x = xMin + ((xMax - xMin) / xTickCount) * i
      const xPos = scaleX(x)
      ctx.textAlign = "center"
      ctx.fillText(x.toFixed(2), xPos, margin.top + chartHeight + 20)

      // Tick mark
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(xPos, margin.top + chartHeight)
      ctx.lineTo(xPos, margin.top + chartHeight + 5)
      ctx.stroke()
    }

    // Y-axis ticks
    const yTickCount = 5
    for (let i = 0; i <= yTickCount; i++) {
      const y = yMinPadded + ((yMaxPadded - yMinPadded) / yTickCount) * i
      const yPos = scaleY(y)
      ctx.textAlign = "right"
      ctx.fillText(y.toFixed(2), margin.left - 10, yPos + 4)

      // Tick mark
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(margin.left - 5, yPos)
      ctx.lineTo(margin.left, yPos)
      ctx.stroke()
    }

    // Draw the curve
    ctx.save()
    ctx.strokeStyle = this.config.lineColor
    ctx.lineWidth = this.config.lineWidth
    ctx.beginPath()

    let pathStarted = false
    for (let i = 0; i < this.points.length; i++) {
      const [x, y] = this.points[i]

      // Skip NaN or Infinite values
      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        pathStarted = false
        continue
      }

      const xPos = scaleX(x)
      const yPos = scaleY(y)

      if (!pathStarted) {
        ctx.moveTo(xPos, yPos)
        pathStarted = true
      } else {
        ctx.lineTo(xPos, yPos)
      }
    }
    ctx.stroke()
    ctx.restore()

    // Draw points
    if (this.config.showPoints) {
      ctx.save()
      for (const [x, y] of this.points) {
        // Skip NaN or Infinite values
        if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
          continue
        }

        const xPos = scaleX(x)
        const yPos = scaleY(y)

        // Draw white border first (larger circle)
        ctx.beginPath()
        ctx.arc(xPos, yPos, 5, 0, Math.PI * 2)
        ctx.fillStyle = "white"
        ctx.fill()

        // Draw colored point on top
        ctx.beginPath()
        ctx.arc(xPos, yPos, 4, 0, Math.PI * 2)
        ctx.fillStyle = this.config.lineColor
        ctx.fill()
      }
      ctx.restore()
    }
  }

  /**
   * Update chart configuration and redraw
   */
  updateConfig(config: Partial<ChartConfig>): void {
    Object.assign(this.config, config)
    this.draw()
  }

  /**
   * Destroy the chart
   */
  destroy(): void {
    this.container.remove()
  }
}
