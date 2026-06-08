import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import {
  TJIIXElement,
  TJIIXTextElement,
  TJIIXMathElement,
  TJIIXNodeElement,
  TJIIXEdgeElement,
  TJIIXMathExpression,
  TJIIXStrokeItem,
  JIIXELementType
} from "@/model"
import { IIStroke } from "@/symbol"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Result type for stroke queries
 * @group Manager
 */
export type TStrokeQueryResult = {
  /** The stroke ID */
  strokeId: string
  /** The JIIX element containing this stroke */
  element: TJIIXElement
  /** The precise label for this stroke */
  label?: string
  /** Additional context (word, char, expression, etc.) */
  context?: {
    /** For text strokes: word info */
    word?: { label: string; index: number }
    /** For text strokes: char info */
    char?: { label: string; index: number; wordIndex: number }
    /** For math strokes: expression info */
    expression?: { type: string; label?: string; expressionPath: string }
  }
}

/**
 * Indexed JIIX data for fast queries
 * @group Manager
 */
type TJiixIndex = {
  /** Map stroke ID -> parent element */
  strokeToElement: Map<string, TJIIXElement>
  /** Map stroke ID -> precise label */
  strokeToLabel: Map<string, string>
  /** Map stroke ID -> context info */
  strokeToContext: Map<string, TStrokeQueryResult["context"]>
  /** Map element ID -> all stroke IDs */
  elementToStrokes: Map<string, string[]>
  /** Cache version for invalidation */
  version: number
}

/**
 * @group Manager
 * @remarks Manager for querying JIIX export data efficiently
 * Provides fast lookups for strokes, labels, and element groupings
 * Automatically indexes JIIX data on first access and invalidates cache when model changes
 */
export class IIJiixQueryManager extends IIAbstractManager
{
  protected managerName = "IIJiixQueryManager"

  /** Indexed JIIX data */
  #index: TJiixIndex | null = null

  /** Current model version for cache invalidation */
  #modelVersion = 0

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
    this.logger.info("constructor", this.managerName)
  }

  /**
   * Build or rebuild the JIIX index
   * Called automatically when index is stale
   */
  protected buildIndex(): void
  {
    this.logger.debug("buildIndex", "Building JIIX index")

    const index: TJiixIndex = {
      strokeToElement: new Map(),
      strokeToLabel: new Map(),
      strokeToContext: new Map(),
      elementToStrokes: new Map(),
      version: this.#modelVersion
    }

    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      this.#index = index
      return
    }

    // Index all elements
    for (const element of jiixExport.elements) {
      this.indexElement(element, index)
    }

    this.#index = index
    this.logger.debug("buildIndex", `Indexed ${index.strokeToElement.size} strokes from ${jiixExport.elements.length} elements`)
  }

  /**
   * Index a single JIIX element and its strokes
   */
  protected indexElement(element: TJIIXElement, index: TJiixIndex): void
  {
    const elementStrokes: string[] = []

    switch (element.type) {
      case JIIXELementType.Text:
        this.indexTextElement(element as TJIIXTextElement, index, elementStrokes)
        break
      case JIIXELementType.Math:
        this.indexMathElement(element as TJIIXMathElement, index, elementStrokes)
        break
      case JIIXELementType.Node:
      case JIIXELementType.Edge:
        this.indexNodeOrEdgeElement(element, index, elementStrokes)
        break
    }

    if (elementStrokes.length > 0 && element.id) {
      index.elementToStrokes.set(element.id, elementStrokes)
    }
  }

  /**
   * Index a text element
   */
  protected indexTextElement(
    element: TJIIXTextElement,
    index: TJiixIndex,
    elementStrokes: string[]
  ): void
  {
    // Index by words and chars for precise labels
    if (element.words) {
      element.words.forEach((word, wordIndex) => {
        if (word.items) {
          word.items.forEach((item: TJIIXStrokeItem) => {
            if (item.id) {
              elementStrokes.push(item.id)
              index.strokeToElement.set(item.id, element)
              index.strokeToLabel.set(item.id, word.label)
              index.strokeToContext.set(item.id, {
                word: { label: word.label, index: wordIndex }
              })
            }
          })
        }
      })
    }

    // Index chars for character-level labels
    if (element.chars) {
      element.chars.forEach((char, charIndex) => {
        if (char.items) {
          char.items.forEach((item: TJIIXStrokeItem) => {
            if (item.id) {
              const existingContext = index.strokeToContext.get(item.id)
              index.strokeToContext.set(item.id, {
                ...existingContext,
                char: {
                  label: char.label,
                  index: charIndex,
                  wordIndex: char.word
                }
              })
              // Update label to char label (more precise)
              index.strokeToLabel.set(item.id, char.label)
            }
          })
        }
      })
    }

    // Fallback: index items directly from element
    if (element.items && (!element.words || element.words.length === 0)) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        if (item.id) {
          elementStrokes.push(item.id)
          index.strokeToElement.set(item.id, element)
          index.strokeToLabel.set(item.id, element.label)
        }
      })
    }
  }

  /**
   * Index a math element
   */
  protected indexMathElement(
    element: TJIIXMathElement,
    index: TJiixIndex,
    elementStrokes: string[]
  ): void
  {
    // Index expressions recursively
    if (element.expressions) {
      element.expressions.forEach((expression, exprIndex) => {
        this.indexMathExpression(
          expression,
          element,
          index,
          elementStrokes,
          `expressions[${exprIndex}]`
        )
      })
    }

    // Fallback: index items directly from element
    if (element.items && (!element.expressions || element.expressions.length === 0)) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        if (item.id) {
          elementStrokes.push(item.id)
          index.strokeToElement.set(item.id, element)
          index.strokeToLabel.set(item.id, element.label || "")
        }
      })
    }
  }

  /**
   * Index a math expression recursively
   */
  protected indexMathExpression(
    expression: TJIIXMathExpression,
    element: TJIIXMathElement,
    index: TJiixIndex,
    elementStrokes: string[],
    path: string
  ): void
  {
    const exprRecord = expression as Record<string, unknown>

    // Index items in this expression
    if (exprRecord.items && Array.isArray(exprRecord.items)) {
      exprRecord.items.forEach((item: TJIIXStrokeItem) => {
        if (item.id) {
          elementStrokes.push(item.id)
          index.strokeToElement.set(item.id, element)
          index.strokeToLabel.set(item.id, exprRecord.label as string || expression.type)
          index.strokeToContext.set(item.id, {
            expression: {
              type: expression.type,
              label: exprRecord.label as string,
              expressionPath: path
            }
          })
        }
      })
    }

    // Recurse into operands
    if ("operands" in expression && expression.operands && Array.isArray(expression.operands)) {
      expression.operands.forEach((operand: TJIIXMathExpression, opIndex: number) => {
        if (operand) {
          this.indexMathExpression(
            operand,
            element,
            index,
            elementStrokes,
            `${path}.operands[${opIndex}]`
          )
        }
      })
    }
  }

  /**
   * Index a node or edge element
   */
  protected indexNodeOrEdgeElement(
    element: TJIIXNodeElement | TJIIXEdgeElement,
    index: TJiixIndex,
    elementStrokes: string[]
  ): void
  {
    if (element.items) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        if (item.id) {
          elementStrokes.push(item.id)
          index.strokeToElement.set(item.id, element)
          index.strokeToLabel.set(item.id, element.id)
        }
      })
    }
  }

  /**
   * Ensure index is up to date
   */
  protected ensureIndexValid(): void
  {
    const currentVersion = this.model.modificationDate

    if (!this.#index || this.#modelVersion !== currentVersion) {
      this.#modelVersion = currentVersion
      this.buildIndex()
    }
  }

  /**
   * Invalidate the index (called when JIIX changes)
   */
  invalidateIndex(): void
  {
    this.logger.debug("invalidateIndex", "Invalidating JIIX index")
    this.#index = null
  }

  /**
   * Get the JIIX element containing a stroke
   * @param strokeId - The stroke ID
   * @returns The JIIX element or undefined
   */
  getElementForStroke(strokeId: string): TJIIXElement | undefined
  {
    this.ensureIndexValid()
    return this.#index?.strokeToElement.get(strokeId)
  }

  /**
   * Get the precise label for a stroke
   * For text: returns char label if available, word label otherwise
   * For math: returns expression label or type
   * @param strokeId - The stroke ID
   * @returns The label or undefined
   */
  getLabelForStroke(strokeId: string): string | undefined
  {
    this.ensureIndexValid()
    return this.#index?.strokeToLabel.get(strokeId)
  }

  /**
   * Get detailed query result for a stroke
   * @param strokeId - The stroke ID
   * @returns Full query result with element, label, and context
   */
  getStrokeInfo(strokeId: string): TStrokeQueryResult | undefined
  {
    this.ensureIndexValid()

    const element = this.#index?.strokeToElement.get(strokeId)
    if (!element) {
      return undefined
    }

    return {
      strokeId,
      element,
      label: this.#index?.strokeToLabel.get(strokeId),
      context: this.#index?.strokeToContext.get(strokeId)
    }
  }

  /**
   * Get all stroke IDs belonging to an element
   * @param elementId - The JIIX element ID
   * @returns Array of stroke IDs
   */
  getStrokesForElement(elementId: string): string[]
  {
    this.ensureIndexValid()
    return this.#index?.elementToStrokes.get(elementId) || []
  }

  /**
   * Get all IIStroke objects belonging to an element
   * @param elementId - The JIIX element ID
   * @returns Array of IIStroke symbols
   */
  getStrokeSymbolsForElement(elementId: string): IIStroke[]
  {
    const strokeIds = this.getStrokesForElement(elementId)
    const strokeMap = new Map<string, IIStroke>()

    // Build map of available strokes
    for (const symbol of this.model.symbols) {
      if (symbol.type === "stroke") {
        const stroke = symbol as IIStroke
        const strokeItems = stroke.pointers
        if (strokeItems && strokeItems.length > 0) {
          strokeMap.set(stroke.id, stroke)
        }
      }
    }

    // Return strokes in order
    return strokeIds
      .map(id => strokeMap.get(id))
      .filter((stroke): stroke is IIStroke => stroke !== undefined)
  }

  /**
   * Get all strokes grouped by word (for text elements)
   * @param elementId - The text element ID
   * @returns Array of word groups, each containing stroke IDs and label
   */
  getStrokesGroupedByWord(elementId: string): Array<{ label: string; strokeIds: string[] }>
  {
    this.ensureIndexValid()

    const element = this.#index?.elementToStrokes.get(elementId)
    if (!element) {
      return []
    }

    const jiixElement = this.model.exports?.["application/vnd.myscript.jiix"]?.elements?.find(
      el => el.id === elementId
    )

    if (!jiixElement || jiixElement.type !== JIIXELementType.Text) {
      return []
    }

    const textElement = jiixElement as TJIIXTextElement
    const groups: Array<{ label: string; strokeIds: string[] }> = []

    if (textElement.words) {
      for (const word of textElement.words) {
        const strokeIds: string[] = []
        if (word.items) {
          word.items.forEach((item: TJIIXStrokeItem) => {
            if (item.id) {
              strokeIds.push(item.id)
            }
          })
        }
        if (strokeIds.length > 0) {
          groups.push({ label: word.label, strokeIds })
        }
      }
    }

    return groups
  }

  /**
   * Get all strokes grouped by character (for text elements)
   * @param elementId - The text element ID
   * @returns Array of char groups, each containing stroke IDs and label
   */
  getStrokesGroupedByChar(elementId: string): Array<{ label: string; strokeIds: string[]; wordIndex: number }>
  {
    this.ensureIndexValid()

    const element = this.#index?.elementToStrokes.get(elementId)
    if (!element) {
      return []
    }

    const jiixElement = this.model.exports?.["application/vnd.myscript.jiix"]?.elements?.find(
      el => el.id === elementId
    )

    if (!jiixElement || jiixElement.type !== JIIXELementType.Text) {
      return []
    }

    const textElement = jiixElement as TJIIXTextElement
    const groups: Array<{ label: string; strokeIds: string[]; wordIndex: number }> = []

    if (textElement.chars) {
      for (const char of textElement.chars) {
        const strokeIds: string[] = []
        if (char.items) {
          char.items.forEach((item: TJIIXStrokeItem) => {
            if (item.id) {
              strokeIds.push(item.id)
            }
          })
        }
        if (strokeIds.length > 0) {
          groups.push({
            label: char.label,
            strokeIds,
            wordIndex: char.word
          })
        }
      }
    }

    return groups
  }

  /**
   * Get all math blocks with their strokes
   * @returns Array of math blocks with their JIIX element and stroke IDs
   */
  getAllMathBlocksWithStrokes(): Array<{
    mathBlock: TJIIXMathElement
    strokeIds: string[]
    strokes: IIStroke[]
  }>
  {
    this.ensureIndexValid()

    const mathBlocks = this.model.getMathBlocks()
    const result: Array<{
      mathBlock: TJIIXMathElement
      strokeIds: string[]
      strokes: IIStroke[]
    }> = []

    for (const mathBlock of mathBlocks) {
      const strokeIds = this.getStrokesForElement(mathBlock.id)
      const strokes = this.getStrokeSymbolsForElement(mathBlock.id)

      result.push({
        mathBlock,
        strokeIds,
        strokes
      })
    }

    return result
  }

  /**
   * Get all text blocks with their strokes
   * @returns Array of text blocks with their JIIX element and stroke IDs
   */
  getAllTextBlocksWithStrokes(): Array<{
    textBlock: TJIIXTextElement
    strokeIds: string[]
    strokes: IIStroke[]
  }>
  {
    this.ensureIndexValid()

    const textBlocks = this.model.getTextBlocks()
    const result: Array<{
      textBlock: TJIIXTextElement
      strokeIds: string[]
      strokes: IIStroke[]
    }> = []

    for (const textBlock of textBlocks) {
      const strokeIds = this.getStrokesForElement(textBlock.id)
      const strokes = this.getStrokeSymbolsForElement(textBlock.id)

      result.push({
        textBlock,
        strokeIds,
        strokes
      })
    }

    return result
  }

  /**
   * Get the label of a JIIX block by its ID
   * @param jiixBlockId - The JIIX element ID
   * @returns The label of the block, or undefined if not found
   */
  getBlockLabel(jiixBlockId: string): string | undefined
  {
    this.ensureIndexValid()

    const jiixElement = this.model.exports?.["application/vnd.myscript.jiix"]?.elements?.find(
      el => el.id === jiixBlockId
    )

    if (!jiixElement) {
      return undefined
    }

    // Text and Math elements have label properties
    if (jiixElement.type === JIIXELementType.Text) {
      return (jiixElement as TJIIXTextElement).label
    }

    if (jiixElement.type === JIIXELementType.Math) {
      return (jiixElement as TJIIXMathElement).label
    }

    // For Node and Edge elements, return the element ID as label
    return jiixElement.id
  }

  /**
   * Search strokes by label
   * @param label - The label to search for (case-insensitive partial match)
   * @returns Array of matching stroke query results
   */
  searchByLabel(label: string): TStrokeQueryResult[]
  {
    this.ensureIndexValid()

    const results: TStrokeQueryResult[] = []
    const searchTerm = label.toLowerCase()

    if (!this.#index) {
      return results
    }

    for (const [strokeId, strokeLabel] of this.#index.strokeToLabel.entries()) {
      if (strokeLabel.toLowerCase().includes(searchTerm)) {
        const info = this.getStrokeInfo(strokeId)
        if (info) {
          results.push(info)
        }
      }
    }

    return results
  }

  /**
   * Get statistics about the indexed JIIX
   * @returns Index statistics
   */
  getIndexStats(): {
    totalStrokes: number
    totalElements: number
    byType: Record<string, number>
    indexed: boolean
  }
  {
    this.ensureIndexValid()

    const stats = {
      totalStrokes: this.#index?.strokeToElement.size || 0,
      totalElements: this.#index?.elementToStrokes.size || 0,
      byType: {} as Record<string, number>,
      indexed: this.#index !== null
    }

    if (this.#index) {
      for (const element of this.#index.strokeToElement.values()) {
        stats.byType[element.type] = (stats.byType[element.type] || 0) + 1
      }
    }

    return stats
  }
}
