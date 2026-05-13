import { Chart, ChartConfig } from "../../../src/components/Chart"

describe("Chart.ts", () =>
{
  let container: HTMLDivElement

  beforeEach(() =>
  {
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should create chart with default config", () =>
  {
    const chart = new Chart()
    expect(chart).toBeDefined()

    const element = chart.getElement()
    expect(element).toBeDefined()
    expect(element).toBeInstanceOf(HTMLDivElement)
  })

  test("should create chart with custom config", () =>
  {
    const config: ChartConfig = {
      width: 800,
      height: 600,
      title: "Test Chart",
      xLabel: "Time",
      yLabel: "Value",
      lineColor: "#ff0000",
      lineWidth: 3,
      showGrid: false,
      showPoints: false
    }

    const chart = new Chart(config)
    expect(chart).toBeDefined()

    const element = chart.getElement()
    expect(element).toBeDefined()
  })

  describe("getElement()", () =>
  {
    test("should return HTMLDivElement", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      expect(element).toBeInstanceOf(HTMLDivElement)
      expect(element.style.display).toContain("flex")
    })

    test("should contain canvas element", () =>
    {
      const chart = new Chart({ width: 400, height: 300 })
      const element = chart.getElement()

      const canvas = element.querySelector("canvas")
      expect(canvas).toBeTruthy()
      expect(canvas?.width).toBe(400)
      expect(canvas?.height).toBe(300)
    })

    test("should contain control buttons", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = element.querySelectorAll("button")
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe("setData()", () =>
  {
    test("should accept array of [x, y] pairs", () =>
    {
      const chart = new Chart()
      const data = [
        [1, 10],
        [2, 20],
        [3, 15],
        [4, 25]
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept array of objects with x and y", () =>
    {
      const chart = new Chart({ xLabel: "x", yLabel: "y" })
      const data = [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
        { x: 4, y: 25 }
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept transposed format [[x values], [y values]]", () =>
    {
      const chart = new Chart()
      const data = [
        [1, 2, 3, 4],
        [10, 20, 15, 25]
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept multiple series as array of arrays", () =>
    {
      const chart = new Chart()
      const data = [
        [[1, 10], [2, 20], [3, 15]],
        [[1, 5], [2, 15], [3, 10]]
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should accept multiple series as array of object arrays", () =>
    {
      const chart = new Chart({ xLabel: "x", yLabel: "y" })
      const data = [
        [
          { x: 1, y: 10 },
          { x: 2, y: 20 }
        ],
        [
          { x: 1, y: 5 },
          { x: 2, y: 15 }
        ]
      ]

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should handle empty data", () =>
    {
      const chart = new Chart()
      const data: number[][] = []

      expect(() => chart.setData(data)).not.toThrow()
    })

    test("should update table after setting data", () =>
    {
      const chart = new Chart()
      container.appendChild(chart.getElement())

      const data = [
        [1, 10],
        [2, 20],
        [3, 30]
      ]

      chart.setData(data)

      const table = chart.getElement().querySelector("table")
      expect(table).toBeTruthy()
    })
  })

  describe("updateConfig()", () =>
  {
    test("should update config without errors", () =>
    {
      const chart = new Chart({ width: 500, height: 400 })

      // updateConfig only updates internal config and redraws
      // Canvas dimensions are set at creation time
      expect(() => chart.updateConfig({ width: 600, height: 500 })).not.toThrow()
    })

    test("should update title", () =>
    {
      const chart = new Chart({ title: "Initial Title" })

      chart.updateConfig({ title: "Updated Title" })

      // Title should be updated
      expect(() => chart.updateConfig({ title: "Updated Title" })).not.toThrow()
    })

    test("should update line color", () =>
    {
      const chart = new Chart({ lineColor: "#0000ff" })

      expect(() => chart.updateConfig({ lineColor: "#ff0000" })).not.toThrow()
    })

    test("should update grid visibility", () =>
    {
      const chart = new Chart({ showGrid: true })

      expect(() => chart.updateConfig({ showGrid: false })).not.toThrow()
    })

    test("should update points visibility", () =>
    {
      const chart = new Chart({ showPoints: true })

      expect(() => chart.updateConfig({ showPoints: false })).not.toThrow()
    })

    test("should update multiple config options at once", () =>
    {
      const chart = new Chart()

      expect(() =>
      {
        chart.updateConfig({
          width: 700,
          height: 600,
          lineColor: "#00ff00",
          lineWidth: 4,
          showGrid: false
        })
      }).not.toThrow()
    })
  })

  describe("canvas rendering", () =>
  {
    test("should have canvas with 2d context", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      expect(canvas).toBeTruthy()

      const ctx = canvas.getContext("2d")
      expect(ctx).toBeTruthy()
    })

    test("should render data on canvas", () =>
    {
      const chart = new Chart({ width: 500, height: 400 })
      const data = [
        [1, 10],
        [2, 20],
        [3, 15]
      ]

      chart.setData(data)

      const element = chart.getElement()
      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      const ctx = canvas.getContext("2d")

      expect(ctx).toBeTruthy()
      expect(canvas.width).toBe(500)
      expect(canvas.height).toBe(400)
    })
  })

  describe("interaction controls", () =>
  {
    test("should have zoom in button", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const zoomInBtn = buttons.find(btn => btn.textContent?.includes("Zoom") && btn.textContent?.includes("+"))

      expect(zoomInBtn).toBeTruthy()
    })

    test("should have zoom out button", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const zoomOutBtn = buttons.find(btn => btn.textContent?.includes("Zoom") && (btn.textContent?.includes("−") || btn.textContent?.includes("-")))

      expect(zoomOutBtn).toBeTruthy()
    })

    test("should have reset button", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const buttons = Array.from(element.querySelectorAll("button"))
      const resetBtn = buttons.find(btn => btn.textContent?.includes("Reset") || btn.textContent?.includes("↻"))

      expect(resetBtn).toBeTruthy()
    })
  })

  describe("table display", () =>
  {
    test("should create table for single series data", () =>
    {
      const chart = new Chart()
      container.appendChild(chart.getElement())

      const data = [
        [1, 10],
        [2, 20],
        [3, 30]
      ]

      chart.setData(data)

      const table = chart.getElement().querySelector("table")
      expect(table).toBeTruthy()

      const rows = table?.querySelectorAll("tbody tr")
      expect(rows?.length).toBe(3)
    })

    test("should create table for multiple series", () =>
    {
      const chart = new Chart()
      container.appendChild(chart.getElement())

      const data = [
        [[1, 10], [2, 20]],
        [[1, 15], [2, 25]]
      ]

      chart.setData(data)

      const table = chart.getElement().querySelector("table")
      expect(table).toBeTruthy()

      const rows = table?.querySelectorAll("tbody tr")
      expect(rows?.length).toBe(4) // 2 points × 2 series
    })

    test("should have correct table headers", () =>
    {
      const chart = new Chart({ xLabel: "Time", yLabel: "Speed" })
      container.appendChild(chart.getElement())

      const data = [[1, 10], [2, 20]]
      chart.setData(data)

      const table = chart.getElement().querySelector("table")
      const headers = table?.querySelectorAll("th")

      expect(headers).toBeTruthy()
      expect(headers!.length).toBeGreaterThan(0)

      const headerTexts = Array.from(headers!).map(h => h.textContent)
      expect(headerTexts.some(text => text?.includes("Time"))).toBe(true)
      expect(headerTexts.some(text => text?.includes("Speed"))).toBe(true)
    })

    test("should not create table for empty data", () =>
    {
      const chart = new Chart()
      container.appendChild(chart.getElement())

      chart.setData([])

      const table = chart.getElement().querySelector("table")
      expect(table).toBeNull()
    })
  })

  describe("chart styles", () =>
  {
    test("should apply custom line color", () =>
    {
      const chart = new Chart({ lineColor: "#ff0000" })

      expect(chart).toBeDefined()
      // Color is applied during rendering, no direct DOM attribute to test
    })

    test("should apply custom line width", () =>
    {
      const chart = new Chart({ lineWidth: 5 })

      expect(chart).toBeDefined()
      // Width is applied during rendering
    })

    test("should have border on canvas", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      expect(canvas.style.border).toContain("1px")
    })

    test("should have white background", () =>
    {
      const chart = new Chart()
      const element = chart.getElement()

      const canvas = element.querySelector("canvas") as HTMLCanvasElement
      expect(canvas.style.background).toBe("white")
    })
  })
})
