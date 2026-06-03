/**
 * @group Components
 */
export interface TableColumn {
  header: string | HTMLElement
  align?: "left" | "center" | "right"
  width?: string
}

/**
 * @group Components
 */
export interface TableCellConfig {
  content: string | HTMLElement
  align?: "left" | "center" | "right"
  style?: string
}

/**
 * @group Components
 */
export interface TableRow {
  cells: (string | HTMLElement | TableCellConfig)[]
  style?: string
  hoverStyle?: string
  data?: unknown
}

/**
 * @group Components
 */
export interface TableConfig {
  columns: (string | TableColumn)[]
  rows: TableRow[]
  stickyHeader?: boolean
  hoverEffect?: boolean
  fontSize?: string
  maxHeight?: string
  width?: string
  selectable?: boolean
  multiSelect?: boolean
  onRowClick?: (rowIndex: number, rowData?: unknown, isSelected?: boolean) => void
}

/**
 * @group Components
 * @remarks Generic table component for displaying data in a structured format
 */
export class Table {
  private table: HTMLTableElement
  private config: TableConfig
  private rowElements: Map<number, HTMLTableRowElement> = new Map()
  private selectedRows: Set<number> = new Set()

  constructor(config: TableConfig) {
    this.config = {
      stickyHeader: true,
      hoverEffect: true,
      fontSize: "14px",
      width: "100%",
      selectable: false,
      multiSelect: false,
      ...config
    }
    this.table = this.createTable()
  }

  private createTable(): HTMLTableElement {
    const table = document.createElement("table")

    let tableStyle = `
      width: ${this.config.width};
      border-collapse: collapse;
      font-size: ${this.config.fontSize};
    `

    if (this.config.maxHeight) {
      tableStyle += `
        max-height: ${this.config.maxHeight};
        overflow-y: auto;
        display: block;
      `
    }

    table.style.cssText = tableStyle

    // Create header
    const thead = this.createHeader()
    table.appendChild(thead)

    // Create body
    const tbody = this.createBody()
    table.appendChild(tbody)

    return table
  }

  private createHeader(): HTMLTableSectionElement {
    const thead = document.createElement("thead")

    if (this.config.stickyHeader) {
      thead.style.cssText = "position: sticky; top: 0; background: white; font-weight: bold;"
    }

    const headerRow = document.createElement("tr")
    headerRow.style.cssText = `
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
    `

    this.config.columns.forEach(column => {
      const th = document.createElement("th")

      if (typeof column === "string") {
        th.textContent = column
        th.style.cssText = `
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        `
      } else {
        // Handle both string and HTMLElement headers
        if (typeof column.header === "string") {
          th.textContent = column.header
        } else {
          th.appendChild(column.header)
        }

        th.style.cssText = `
          padding: 12px 8px;
          text-align: ${column.align || "left"};
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        `
        if (column.width) {
          th.style.width = column.width
        }
      }

      headerRow.appendChild(th)
    })

    thead.appendChild(headerRow)
    return thead
  }

  private createBody(): HTMLTableSectionElement {
    const tbody = document.createElement("tbody")
    this.rowElements.clear()

    this.config.rows.forEach((rowConfig, rowIndex) => {
      const row = document.createElement("tr")

      // Store row element reference
      this.rowElements.set(rowIndex, row)

      // Apply row styles
      const baseStyle = rowConfig.style || "border-bottom: 1px solid #eee;"
      row.style.cssText = baseStyle

      // Add selectable cursor
      if (this.config.selectable) {
        row.style.cursor = "pointer"
      }

      // Add hover effect if enabled
      if (this.config.hoverEffect) {
        const hoverStyle = rowConfig.hoverStyle || "#f9f9f9"
        row.addEventListener("mouseenter", () => {
          if (!this.selectedRows.has(rowIndex)) {
            row.style.background = hoverStyle
          }
        })
        row.addEventListener("mouseleave", () => {
          if (!this.selectedRows.has(rowIndex)) {
            row.style.cssText = baseStyle
          }
        })
      }

      // Add click handler for selectable rows
      if (this.config.selectable) {
        row.addEventListener("click", (event) => {
          this.handleRowClick(rowIndex, rowConfig.data, event)
        })
      }

      // Create cells
      rowConfig.cells.forEach((cellData, index) => {
        const cell = document.createElement("td")

        // Get column alignment
        const column = this.config.columns[index]
        const columnAlign = typeof column === "string" ? "left" : (column.align || "left")

        if (typeof cellData === "string") {
          cell.textContent = cellData
          cell.style.cssText = `
            padding: 10px 8px;
            text-align: ${columnAlign};
            border: 1px solid #ddd;
          `
        } else if (cellData instanceof HTMLElement) {
          cell.appendChild(cellData)
          cell.style.cssText = `
            padding: 10px 8px;
            text-align: ${columnAlign};
            border: 1px solid #ddd;
          `
        } else {
          // TableCellConfig
          if (typeof cellData.content === "string") {
            cell.textContent = cellData.content
          } else {
            cell.appendChild(cellData.content)
          }

          const align = cellData.align || columnAlign
          let cellStyle = `
            padding: 10px 8px;
            text-align: ${align};
            border: 1px solid #ddd;
          `

          if (cellData.style) {
            cellStyle += cellData.style
          }

          cell.style.cssText = cellStyle
        }

        row.appendChild(cell)
      })

      tbody.appendChild(row)
    })

    return tbody
  }

  /**
   * Handle row click event
   */
  private handleRowClick(rowIndex: number, rowData?: unknown, event?: MouseEvent): void {
    if (!this.config.multiSelect) {
      // Single select: clear all other selections
      this.clearSelection()
    }
    if (event?.shiftKey && this.selectedRows.size > 0) {
      // Shift select: select range
      const selectedIndices = Array.from(this.selectedRows)
      const lastSelected = Math.max(...selectedIndices)
      const start = Math.min(lastSelected, rowIndex)
      const end = Math.max(lastSelected, rowIndex)

      for (let i = start; i <= end; i++) {
        this.selectRow(i)
      }
    } else {
      if (this.selectedRows.has(rowIndex)) {
        this.unselectRow(rowIndex)
      } else {
        this.selectRow(rowIndex)
      }
    }

    // Call callback if provided
    if (this.config.onRowClick) {
      const isSelected = this.selectedRows.has(rowIndex)
      this.config.onRowClick(rowIndex, rowData, isSelected)
    }
  }

  /**
   * Select a row by index
   */
  selectRow(rowIndex: number): void {
    if (!this.selectedRows.has(rowIndex)) {
      this.selectedRows.add(rowIndex)
      this.updateRowStyle(rowIndex, true)
    }
  }

  /**
   * Unselect a row by index
   */
  unselectRow(rowIndex: number): void {
    if (this.selectedRows.has(rowIndex)) {
      this.selectedRows.delete(rowIndex)
      this.updateRowStyle(rowIndex, false)
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedRows.forEach(rowIndex => {
      this.updateRowStyle(rowIndex, false)
    })
    this.selectedRows.clear()
  }

  /**
   * Update row visual style based on selection state
   */
  private updateRowStyle(rowIndex: number, selected: boolean): void {
    const row = this.rowElements.get(rowIndex)
    if (!row) return

    const rowConfig = this.config.rows[rowIndex]
    const baseStyle = rowConfig?.style || "border-bottom: 1px solid #eee;"

    if (selected) {
      row.style.cssText = baseStyle + " background: #e3f2fd; font-weight: 500;"
    } else {
      row.style.cssText = baseStyle
    }
  }

  /**
   * Get selected row indices
   */
  getSelectedRows(): number[] {
    return Array.from(this.selectedRows)
  }

  /**
   * Get selected row data
   */
  getSelectedRowsData(): unknown[] {
    return Array.from(this.selectedRows).map(index => this.config.rows[index]?.data).filter(data => data !== undefined)
  }

  /**
   * Get the table element
   */
  getElement(): HTMLTableElement {
    return this.table
  }

  /**
   * Update table data and redraw
   */
  update(rows: TableRow[]): void {
    this.config.rows = rows

    // Remove old tbody
    const oldTbody = this.table.querySelector("tbody")
    if (oldTbody) {
      oldTbody.remove()
    }

    // Create new tbody
    const newTbody = this.createBody()
    this.table.appendChild(newTbody)
  }

  /**
   * Destroy the table
   */
  destroy(): void {
    this.table.remove()
  }
}
