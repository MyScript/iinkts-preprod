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

interface ViewPort {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * @group Components
 */
export class Chart {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: Required<ChartConfig>
  private series: number[][][] = [] // Array of series, each series is an array of [x, y] points
  private container: HTMLDivElement
  private tableElement?: HTMLTableElement
  private viewport: ViewPort | null = null
  private defaultViewport: ViewPort | null = null
  private isDragging = false
  private lastMousePos = { x: 0, y: 0 }
  private controlsContainer?: HTMLDivElement

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

    // Create controls
    this.createControls()

    this.canvas = document.createElement("canvas")
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height
    this.canvas.style.cssText = `
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      display: block;
      max-width: 100%;
      cursor: grab;
    `

    const ctx = this.canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas 2D context")
    }
    this.ctx = ctx

    // Add zoom and pan event listeners
    this.setupInteractions()

    this.container.appendChild(this.canvas)
  }

  private createControls(): void {
    this.controlsContainer = document.createElement("div")
    this.controlsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    `

    const createButton = (label: string, onClick: () => void): HTMLButtonElement => {
      const btn = document.createElement("button")
      btn.textContent = label
      btn.style.cssText = `
        padding: 4px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      `
      btn.onclick = onClick
      btn.onmouseenter = () => (btn.style.background = "#e0e0e0")
      btn.onmouseleave = () => (btn.style.background = "white")
      return btn
    }

    const zoomInBtn = createButton("Zoom +", () => this.zoom(1.2))
    const zoomOutBtn = createButton("Zoom −", () => this.zoom(0.8))
    const resetBtn = createButton("Reset", () => this.resetZoom())

    const label = document.createElement("span")
    label.textContent = "Zoom: "
    label.style.cssText = "font-size: 12px; color: #666; margin-left: auto;"

    const info = document.createElement("span")
    info.textContent = "Use mouse wheel to zoom, drag to pan"
    info.style.cssText = "font-size: 11px; color: #999; font-style: italic;"

    this.controlsContainer.appendChild(zoomInBtn)
    this.controlsContainer.appendChild(zoomOutBtn)
    this.controlsContainer.appendChild(resetBtn)
    this.controlsContainer.appendChild(label)
    this.controlsContainer.appendChild(info)

    this.container.appendChild(this.controlsContainer)
  }

  private setupInteractions(): void {
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      this.zoom(zoomFactor, { x: e.offsetX, y: e.offsetY })
    })

    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true
      this.lastMousePos = { x: e.offsetX, y: e.offsetY }
      this.canvas.style.cursor = "grabbing"
    })

    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.isDragging || !this.viewport) return

      const dx = e.offsetX - this.lastMousePos.x
      const dy = e.offsetY - this.lastMousePos.y
      this.lastMousePos = { x: e.offsetX, y: e.offsetY }

      this.pan(dx, dy)
    })

    this.canvas.addEventListener("mouseup", () => {
      this.isDragging = false
      this.canvas.style.cursor = "grab"
    })

    this.canvas.addEventListener("mouseleave", () => {
      this.isDragging = false
      this.canvas.style.cursor = "grab"
    })
  }

  private zoom(factor: number, center?: { x: number; y: number }): void {
    if (!this.viewport) return

    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const chartWidth = this.config.width - margin.left - margin.right
    const chartHeight = this.config.height - margin.top - margin.bottom

    let centerX: number, centerY: number

    if (center) {
      // Zoom towards mouse position
      const relX = (center.x - margin.left) / chartWidth
      const relY = (center.y - margin.top) / chartHeight
      centerX = this.viewport.xMin + relX * (this.viewport.xMax - this.viewport.xMin)
      centerY = this.viewport.yMax - relY * (this.viewport.yMax - this.viewport.yMin)
    } else {
      // Zoom towards center
      centerX = (this.viewport.xMin + this.viewport.xMax) / 2
      centerY = (this.viewport.yMin + this.viewport.yMax) / 2
    }

    const xRange = (this.viewport.xMax - this.viewport.xMin) / factor
    const yRange = (this.viewport.yMax - this.viewport.yMin) / factor

    this.viewport = {
      xMin: centerX - xRange / 2,
      xMax: centerX + xRange / 2,
      yMin: centerY - yRange / 2,
      yMax: centerY + yRange / 2
    }

    this.draw()
  }

  private pan(dx: number, dy: number): void {
    if (!this.viewport) return

    const margin = { top: 40, right: 40, bottom: 60, left: 60 }
    const chartWidth = this.config.width - margin.left - margin.right
    const chartHeight = this.config.height - margin.top - margin.bottom

    const xRange = this.viewport.xMax - this.viewport.xMin
    const yRange = this.viewport.yMax - this.viewport.yMin

    const xShift = (-dx / chartWidth) * xRange
    const yShift = (dy / chartHeight) * yRange

    this.viewport = {
      xMin: this.viewport.xMin + xShift,
      xMax: this.viewport.xMax + xShift,
      yMin: this.viewport.yMin + yShift,
      yMax: this.viewport.yMax + yShift
    }

    this.draw()
  }

  private resetZoom(): void {
    this.viewport = this.defaultViewport ? { ...this.defaultViewport } : null
    this.draw()
  }

  /**
   * Filter outliers using IQR method
   */
  private filterOutliers(values: number[]): number[] {
    if (values.length === 0) return values

    const sorted = [...values].sort((a, b) => a - b)
    const q1Index = Math.floor(sorted.length * 0.25)
    const q3Index = Math.floor(sorted.length * 0.75)
    const q1 = sorted[q1Index]
    const q3 = sorted[q3Index]
    const iqr = q3 - q1
    const lowerBound = q1 - 3 * iqr
    const upperBound = q3 + 3 * iqr

    return values.filter((v) => v >= lowerBound && v <= upperBound)
  }

  /**
   * Calculate default viewport based on median values
   */
  private calculateDefaultViewport(): ViewPort | null {
    // Collect all points from all series
    const allPoints: number[][] = []
    for (const series of this.series) {
      allPoints.push(...series)
    }

    const xValues = allPoints
      .map((p) => p[0])
      .filter((v) => !isNaN(v) && isFinite(v))
    const yValues = allPoints
      .map((p) => p[1])
      .filter((v) => !isNaN(v) && isFinite(v))

    if (xValues.length === 0 || yValues.length === 0) {
      return null
    }

    // Filter outliers for better default view
    const filteredYValues = this.filterOutliers(yValues)

    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...filteredYValues)
    const yMax = Math.max(...filteredYValues)

    // Add padding to ranges
    const xRange = xMax - xMin
    const yRange = yMax - yMin

    // Calculate x padding
    let finalXMin = xMin
    let finalXMax = xMax
    if (xRange === 0) {
      const padding = Math.abs(xMin) * 0.1 || 1
      finalXMin = xMin - padding
      finalXMax = xMax + padding
    }

    // Calculate y padding
    let finalYMin: number
    let finalYMax: number
    if (yRange === 0) {
      const padding = Math.abs(yMin) * 0.1 || 1
      finalYMin = yMin - padding
      finalYMax = yMax + padding
    } else {
      const yPadding = yRange * 0.1
      finalYMin = yMin - yPadding
      finalYMax = yMax + yPadding
    }

    return {
      xMin: finalXMin,
      xMax: finalXMax,
      yMin: finalYMin,
      yMax: finalYMax
    }
  }

  /**
   * Set the data points to plot
   * @param data Can be:
   *   - Single series: number[][] or { [key: string]: number }[]
   *   - Multiple series: number[][][] or { [key: string]: number }[][]
   */
  setData(data: number[][] | { [key: string]: number }[] | number[][][] | { [key: string]: number }[][]): void {
    // Detect if we have multiple series or single series
    let multipleSeries = false

    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0]

      // Check for multiple series:
      // - number[][][]: data[0] is number[][], data[0][0] is number[], data[0][0][0] is number
      // - { [key: string]: number }[][]: data[0] is { [key: string]: number }[], data[0][0] is object

      if (Array.isArray(firstElement) && firstElement.length > 0) {
        const firstSubElement = firstElement[0]

        // Case 1: number[][][] - firstSubElement is a number[]
        if (Array.isArray(firstSubElement)) {
          multipleSeries = true
        }
        // Case 2: { [key: string]: number }[][] - firstSubElement is an object
        else if (typeof firstSubElement === "object" && firstSubElement !== null && !Array.isArray(firstSubElement)) {
          multipleSeries = true
        }
      }
    }

    if (multipleSeries) {
      // Handle multiple series
      this.series = []
      const seriesArray = data as (number[][] | { [key: string]: number }[])[]

      for (const seriesData of seriesArray) {
        const points = this.convertToPoints(seriesData)
        this.series.push(points)
      }
    } else {
      // Handle single series (backward compatibility)
      const points = this.convertToPoints(data as number[][] | { [key: string]: number }[])
      this.series = [points]
    }

    // Calculate default viewport with outlier filtering
    this.defaultViewport = this.calculateDefaultViewport()
    this.viewport = this.defaultViewport ? { ...this.defaultViewport } : null

    this.draw()
    this.updateTable()
  }

  private convertToPoints(data: number[][] | { [key: string]: number }[]): number[][] {
    // Check if data is array of objects { x: val, y: val }
    if (
      data.length > 0 &&
      typeof data[0] === "object" &&
      !Array.isArray(data[0])
    ) {
      const objectArray = data as { [key: string]: number }[]
      return objectArray.map((obj) => [
        obj[this.config.xLabel],
        obj[this.config.yLabel]
      ])
    }
    // Check if data is in format [[x1, x2, ...], [y1, y2, ...]] and convert to [[x1, y1], [x2, y2], ...]
    else if (
      data.length === 2 &&
      Array.isArray(data[0]) &&
      Array.isArray(data[1])
    ) {
      const xValues = data[0] as number[]
      const yValues = data[1] as number[]
      return xValues.map((x, i) => [x, yValues[i]])
    } else {
      return data as number[][]
    }
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

    // Count total points
    const totalPoints = this.series.reduce((sum, s) => sum + s.length, 0)
    if (totalPoints === 0) return

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

    if (this.series.length > 1) {
      const thSeries = document.createElement("th")
      thSeries.textContent = "Series"
      thSeries.style.cssText =
        "border: 1px solid #ddd; padding: 8px; text-align: center; background: #f5f5f5;"
      headerRow.appendChild(thSeries)
    }

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
    let globalIndex = 0

    for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
      const points = this.series[seriesIndex]

      points.forEach(([x, y]) => {
        globalIndex++
        const row = document.createElement("tr")
        row.style.cssText = "hover:background-color: #f9f9f9;"

        const tdIndex = document.createElement("td")
        tdIndex.textContent = String(globalIndex)
        tdIndex.style.cssText =
          "border: 1px solid #ddd; padding: 8px; text-align: center; background: #fafafa;"
        row.appendChild(tdIndex)

        if (this.series.length > 1) {
          const tdSeries = document.createElement("td")
          tdSeries.textContent = String(seriesIndex + 1)
          tdSeries.style.cssText =
            "border: 1px solid #ddd; padding: 8px; text-align: center;"
          row.appendChild(tdSeries)
        }

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
    }
    this.tableElement.appendChild(tbody)

    this.container.appendChild(this.tableElement)
  }

  private draw(): void {
    if (this.series.length === 0) {
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

    // Use viewport if available, otherwise calculate from all data
    let xMin: number, xMax: number, yMin: number, yMax: number

    if (this.viewport) {
      xMin = this.viewport.xMin
      xMax = this.viewport.xMax
      yMin = this.viewport.yMin
      yMax = this.viewport.yMax
    } else {
      // Calculate data bounds from all series (filter out NaN values)
      const allPoints: number[][] = []
      for (const series of this.series) {
        allPoints.push(...series)
      }

      const xValues = allPoints
        .map((p) => p[0])
        .filter((v) => !isNaN(v) && isFinite(v))
      const yValues = allPoints
        .map((p) => p[1])
        .filter((v) => !isNaN(v) && isFinite(v))

      if (xValues.length === 0 || yValues.length === 0) {
        return
      }

      xMin = Math.min(...xValues)
      xMax = Math.max(...xValues)
      yMin = Math.min(...yValues)
      yMax = Math.max(...yValues)

      const xRange = xMax - xMin
      const yRange = yMax - yMin

      if (xRange === 0) {
        const padding = Math.abs(xMin) * 0.1 || 1
        xMin = xMin - padding
        xMax = xMax + padding
      }

      if (yRange === 0) {
        const padding = Math.abs(yMin) * 0.1 || 1
        yMin = yMin - padding
        yMax = yMax + padding
      } else {
        const yPadding = yRange * 0.1
        yMin = yMin - yPadding
        yMax = yMax + yPadding
      }
    }

    // Scale functions
    const scaleX = (x: number) =>
      margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth
    const scaleY = (y: number) =>
      margin.top +
      chartHeight -
      ((y - yMin) / (yMax - yMin)) * chartHeight

    // Calculate position for axes (cross at origin if 0 is in range, otherwise at appropriate edge)
    let xAxisY: number
    let yAxisX: number

    if (yMin <= 0 && yMax >= 0) {
      // Y=0 is in range, cross at origin
      xAxisY = scaleY(0)
    } else if (yMax < 0) {
      // All values are negative Y, axis at top
      xAxisY = margin.top
    } else {
      // All values are positive Y, axis at bottom
      xAxisY = margin.top + chartHeight
    }

    if (xMin <= 0 && xMax >= 0) {
      // X=0 is in range, cross at origin
      yAxisX = scaleX(0)
    } else if (xMax < 0) {
      // All values are negative X, axis at right
      yAxisX = margin.left + chartWidth
    } else {
      // All values are positive X, axis at left
      yAxisX = margin.left
    }

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

    // Draw chart border
    ctx.strokeStyle = "#ccc"
    ctx.lineWidth = 1
    ctx.strokeRect(margin.left, margin.top, chartWidth, chartHeight)

    // Draw axes
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, xAxisY)
    ctx.lineTo(margin.left + chartWidth, xAxisY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(yAxisX, margin.top)
    ctx.lineTo(yAxisX, margin.top + chartHeight)
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

      // Position labels based on axis position
      let labelY: number
      let tickDirection: number

      if (xAxisY <= margin.top + 10) {
        // Axis is at top
        labelY = xAxisY + 15
        tickDirection = 1 // Tick pointing down
      } else if (xAxisY >= margin.top + chartHeight - 10) {
        // Axis is at bottom
        labelY = xAxisY + 20
        tickDirection = -1 // Tick pointing up
      } else {
        // Axis is in the middle (at Y=0)
        labelY = margin.top + chartHeight + 20
        tickDirection = -1
      }

      ctx.fillText(x.toFixed(2), xPos, labelY)

      // Tick mark on the axis
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(xPos, xAxisY)
      ctx.lineTo(xPos, xAxisY + (5 * tickDirection))
      ctx.stroke()
    }

    // Y-axis ticks
    const yTickCount = 5
    for (let i = 0; i <= yTickCount; i++) {
      const y = yMin + ((yMax - yMin) / yTickCount) * i
      const yPos = scaleY(y)

      // Position labels based on axis position
      let labelX: number
      let tickDirection: number

      if (yAxisX >= margin.left + chartWidth - 10) {
        // Axis is at right
        ctx.textAlign = "right"
        labelX = yAxisX - 10
        tickDirection = -1 // Tick pointing left
      } else if (yAxisX <= margin.left + 10) {
        // Axis is at left
        ctx.textAlign = "right"
        labelX = margin.left - 10
        tickDirection = 1 // Tick pointing right
      } else {
        // Axis is in the middle (at X=0)
        ctx.textAlign = "right"
        labelX = margin.left - 10
        tickDirection = 1
      }

      ctx.fillText(y.toFixed(2), labelX, yPos + 4)

      // Tick mark on the axis
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(yAxisX, yPos)
      ctx.lineTo(yAxisX + (5 * tickDirection), yPos)
      ctx.stroke()
    }

    // Draw all curves
    ctx.save()

    // Clip to chart area to prevent lines from going outside
    ctx.beginPath()
    ctx.rect(margin.left, margin.top, chartWidth, chartHeight)
    ctx.clip()

    // Define colors for multiple series
    const colors = [
      this.config.lineColor,
      "#FF5722", // Red
      "#4CAF50", // Green
      "#9C27B0", // Purple
      "#FF9800", // Orange
      "#00BCD4", // Cyan
      "#E91E63"  // Pink
    ]

    // Draw each series
    for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
      const points = this.series[seriesIndex]
      ctx.strokeStyle = colors[seriesIndex % colors.length]
      ctx.lineWidth = this.config.lineWidth
      ctx.beginPath()

      let pathStarted = false
      for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i]

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
    }
    ctx.restore()

    // Draw points
    if (this.config.showPoints) {
      ctx.save()

      // Clip to chart area to prevent points from going outside
      ctx.beginPath()
      ctx.rect(margin.left, margin.top, chartWidth, chartHeight)
      ctx.clip()

      // Define colors for multiple series
      const colors = [
        this.config.lineColor,
        "#FF5722", // Red
        "#4CAF50", // Green
        "#9C27B0", // Purple
        "#FF9800", // Orange
        "#00BCD4", // Cyan
        "#E91E63"  // Pink
      ]

      // Draw points for each series
      for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
        const points = this.series[seriesIndex]
        const pointColor = colors[seriesIndex % colors.length]

        for (const [x, y] of points) {
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
          ctx.fillStyle = pointColor
          ctx.fill()
        }
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
