import { LoggerCategory, LoggerManager } from "@/logger"

/**
 * @group Manager
 */
export class ColorPaletteManager {
  private static instance: ColorPaletteManager
  private static readonly EXCEL_PALETTE = [
    "#4472C4", // Blue
    "#ED7D31", // Orange
    "#A5A5A5", // Gray
    "#FFC000", // Yellow
    "#5B9BD5", // Light Blue
    "#70AD47", // Green
    "#264478", // Dark Blue
    "#9E480E", // Dark Orange
    "#636363", // Dark Gray
    "#997300", // Dark Yellow
    "#255E91", // Medium Blue
    "#43682B", // Dark Green
  ]

  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  #variableColorMap: Map<string, string> = new Map()
  #colorIndex = 0

  private constructor() {
    this.#logger.info("ColorPaletteManager", "Singleton instance created")
  }

  static getInstance(): ColorPaletteManager {
    if (!ColorPaletteManager.instance) {
      ColorPaletteManager.instance = new ColorPaletteManager()
    }
    return ColorPaletteManager.instance
  }

  /**
   * Get color for a variable name. Same variable always gets the same color.
   */
  getColorForVariable(variableName: string): string {
    if (this.#variableColorMap.has(variableName)) {
      return this.#variableColorMap.get(variableName)!
    }

    const color = ColorPaletteManager.EXCEL_PALETTE[this.#colorIndex % ColorPaletteManager.EXCEL_PALETTE.length]
    this.#variableColorMap.set(variableName, color)
    this.#colorIndex++

    this.#logger.debug("getColorForVariable", {
      variableName,
      color,
    })
    return color
  }

  /**
   * Get all variable colors
   */
  getAllVariableColors(): Map<string, string> {
    return new Map(this.#variableColorMap)
  }

  /**
   * Clear all variable color assignments
   */
  clear(): void {
    this.#logger.info("clear", "Clearing all variable colors")
    this.#variableColorMap.clear()
    this.#colorIndex = 0
  }

  /**
   * Remove color assignment for a specific variable
   */
  removeVariable(variableName: string): void {
    this.#logger.debug("removeVariable", {
      variableName,
    })
    this.#variableColorMap.delete(variableName)
  }

  /**
   * Get the full color palette
   */
  static getPalette(): string[] {
    return [...ColorPaletteManager.EXCEL_PALETTE]
  }
}
