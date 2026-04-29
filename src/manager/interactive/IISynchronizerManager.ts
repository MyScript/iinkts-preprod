import { LoggerCategory, LoggerManager } from "../../logger"
import { InteractiveInkEditor } from "../../editor/InteractiveInkEditor"
import { IIModel, TJIIXExport, TJIIXStrokeItem, TJIIXMathElement, TJIIXMathExpression, TJIIXTextElement, TJIIXNodeElement, TJIIXEdgeElement, TJIIXWord, TJIIXChar, TJIIXEdgeLine, JIIXELementType, JIIXEdgeKind, JIIXNodeKind } from "../../model"
import
{
  Box,
  IIDecorator,
  IIStroke,
  IIRecognizedText,
  IIRecognizedMath,
  SymbolType,
  TIISymbol,
  TIIRecognized,
  IIRecognizedLine,
  IIRecognizedPolyLine,
  IIRecognizedArc,
  IIRecognizedCircle,
  IIRecognizedEllipse,
  IIRecognizedPolygon,
  RecognizedKind
} from "../../symbol"
import { convertMillimeterToPixel, convertBoundingBoxMillimeterToPixel } from "../../utils"

/**
 * @group Manager
 */
export class IISynchronizerManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.SYNCHRONIZER)
  editor: InteractiveInkEditor

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor", "IISynchronizerManager")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  /**
   * Synchronize strokes with JIIX export
   * Updates symbols based on recognition results from the backend
   */
  async synchronize(): Promise<void>
  {
    await this.editor.export(["application/vnd.myscript.jiix"])

    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.#logger.debug("synchronize", "JIIX elements:", jiix?.elements)

    // Process all elements in a single pass
    jiix?.elements?.forEach(el =>
    {
      switch (el.type) {
        case JIIXELementType.Text:
          this.synchronizeTextElement(el, jiix)
          break
        case JIIXELementType.Math:
          this.synchronizeMathElement(el)
          break
        case JIIXELementType.Node:
          this.synchronizeNodeElement(el)
          break
        case JIIXELementType.Edge:
          this.synchronizeEdgeElement(el)
          break
        default:
          this.#logger.warn("synchronize", `Can not create recognized symbol, type unknown: ${ el }`)
          break
      }
    })

    this.model.mergeExport({ "application/vnd.myscript.jiix": jiix })
    this.editor.history.update(this.model)
    this.editor.event.emitSynchronized()
  }

  /**
   * Get symbols and strokes associated from JIIX stroke items
   */
  protected getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(items: TJIIXStrokeItem[] = []): { symbols: TIISymbol[], strokes: IIStroke[] }
  {
    const symbols: TIISymbol[] = []
    const strokes: IIStroke[] = []
    const strokeIdsUsed: string[] = []
    items.forEach(i =>
    {
      const strokeId = i["full-id"]!
      if (strokeIdsUsed.includes(strokeId)) {
        return
      }
      strokeIdsUsed.push(strokeId)
      const sym = this.model.getRootSymbol(strokeId)
      if (sym) {
        switch (sym?.type) {
          case SymbolType.Recognized:
            strokes.push(sym.strokes.find(s => s.id === i["full-id"]!)!)
            break
          default:
            strokes.push(sym as IIStroke)
            break
        }
        const symIdx = symbols.findIndex(s => s.id === sym.id)
        if (symIdx < 0) {
          symbols.push(sym)
        }
        else {
          symbols[symIdx] = sym
        }
      }
    })
    return {
      symbols,
      strokes
    }
  }

  /**
   * Recursively collect all items from Math expressions
   */
  protected collectMathItems(expr: TJIIXMathExpression): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

    // Check if expr is null or undefined
    if (!expr) {
      return items
    }

    if ("items" in expr && expr.items && Array.isArray(expr.items)) {
      items.push(...expr.items)
    }

    if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
      expr.operands.forEach((operand: TJIIXMathExpression) =>
      {
        if (operand) {
          items.push(...this.collectMathItems(operand))
        }
      })
    }

    return items
  }

  /**
   * Collect all items from a Math element
   */
  protected getMathElementItems(mathElement: TJIIXMathElement): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

    // Collect from direct items
    if (mathElement.items) {
      items.push(...mathElement.items)
    }

    // Collect from expressions
    if (mathElement.expressions && Array.isArray(mathElement.expressions)) {
      mathElement.expressions.forEach(expr =>
      {
        if (expr) {
          items.push(...this.collectMathItems(expr))
        }
      })
    }

    return items
  }

  /**
   * Synchronize a Text element from JIIX
   */
  protected synchronizeTextElement(el: TJIIXTextElement, jiix: TJIIXExport): void
  {
    this.#logger.debug("synchronizeTextElement", "Processing Text element:", el)

    // If there are children (embedded Math), process them first
    if (el.children && el.children.length > 0) {
      this.#logger.debug("synchronizeTextElement", `Text has ${el.children.length} children, processing Math elements:`, el.children)

      el.children.forEach((childId: string) => {
        const mathEl = jiix?.elements?.find(e => e.id === childId && e.type === "Math") as TJIIXMathElement | undefined
        if (mathEl) {
          this.synchronizeEmbeddedMathElement(mathEl)
        }
      })
    }

    // Process Text element
    // If there are NO children, collect ALL word strokes
    // If there ARE children (embedded Math), only collect strokes from words without refs
    const textWordItems = el.children && el.children.length > 0
      ? (el.words?.filter((w: TJIIXWord) => !w.refs).flatMap((w: TJIIXWord) => w.items || []) || [])
      : (el.words?.flatMap((w: TJIIXWord) => w.items || []) || [])

    const wordsWithRefs = el.words?.filter((w: TJIIXWord) => w.refs) || []
    this.#logger.debug("synchronizeTextElement", `Text element has ${el.children?.length || 0} children, ${wordsWithRefs.length} words with refs`)

    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(textWordItems)

    this.#logger.debug("synchronizeTextElement", `Text strokes: ${jiixAssociation.strokes.length}, symbols: ${jiixAssociation.symbols.length}`)

    if (jiixAssociation.strokes.length) {
      // Find existing Text symbol with same jiixId
      const existingText = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Text &&
        (s as IIRecognizedText).jiixId === el.id
      ) as IIRecognizedText | undefined

      if (existingText) {
        this.updateExistingTextSymbol(existingText, el, jiixAssociation)
      } else {
        this.createNewTextSymbol(el, jiixAssociation)
      }
    } else {
      this.#logger.warn("synchronizeTextElement", "Text element has no strokes after filtering")
    }
  }

  /**
   * Update an existing Text symbol
   */
  protected updateExistingTextSymbol(existingText: IIRecognizedText, el: TJIIXTextElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingTextSymbol", "Updating existing Text symbol:", existingText.id)
    existingText.strokes = jiixAssociation.strokes
    existingText.label = el.label

    // Update children if present
    if (el.children && el.children.length > 0) {
      existingText.children = [...el.children]
      existingText.childrenPos = [...(el["children-pos"] || [])]
    }

    // Save existing word decorators before remapping
    const existingWordDecorators = new Map<string, IIDecorator[]>()
    if (existingText.words) {
      existingText.words.forEach(w => {
        if (w.decorators && w.decorators.length > 0) {
          existingWordDecorators.set(w.label, w.decorators)
        }
      })
    }

    // Update words and chars
    if (el.words?.length) {
      existingText.words = el.words.map((w: TJIIXWord) => ({
        label: w.label,
        firstChar: w["first-char"],
        lastChar: w["last-char"],
        bounds: w["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(w["bounding-box"])) : undefined,
        // Restore decorators if they existed for this word label
        decorators: existingWordDecorators.get(w.label)
      }))
    }
    if (el.chars?.length) {
      existingText.chars = el.chars.map((c: TJIIXChar) => ({
        label: c.label,
        word: c.word,
        bounds: c["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(c["bounding-box"])) : undefined
      }))
    }

    // Remove old symbols EXCEPT the existing one
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.id !== existingText.id) {
        this.#logger.debug("updateExistingTextSymbol", "Removing old symbol:", sym.id)
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      }
    })

    this.model.updateSymbol(existingText)
    this.editor.renderer.drawSymbol(existingText)

    // If selected, reset the selection
    if (existingText.selected) {
      this.editor.selector.resetSelectedGroup([existingText])
    }
  }

  /**
   * Create a new Text symbol
   */
  protected createNewTextSymbol(el: TJIIXTextElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("createNewTextSymbol", "Creating new Text symbol")
    const line = el.lines![0]  // Use first line for baseline/xHeight
    const recognizedText = new IIRecognizedText(
      jiixAssociation.strokes,
      {
        baseline: convertMillimeterToPixel(line["baseline-y"]),
        xHeight: convertMillimeterToPixel(line["x-height"])
      }
    )
    recognizedText.jiixId = el.id
    recognizedText.label = el.label

    // Handle children (embedded Math elements)
    if (el.children && el.children.length > 0) {
      recognizedText.children = [...el.children]
      recognizedText.childrenPos = [...(el["children-pos"] || [])]
      this.#logger.debug("createNewTextSymbol", `Text has ${el.children.length} children:`, el.children)
    }

    // Collect word decorators from old symbols before creating new words
    const oldWordDecorators = new Map<string, IIDecorator[]>()
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) {
        const oldText = sym as IIRecognizedText
        if (oldText.words) {
          oldText.words.forEach(w => {
            if (w.decorators && w.decorators.length > 0) {
              oldWordDecorators.set(w.label, w.decorators)
            }
          })
        }
      }
    })

    // Map words from JIIX to IIRecognizedText
    if (el.words?.length) {
      recognizedText.words = el.words.map((w: TJIIXWord) => ({
        label: w.label,
        firstChar: w["first-char"],
        lastChar: w["last-char"],
        bounds: w["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(w["bounding-box"])) : undefined,
        // Restore decorators from old symbols if they existed for this word label
        decorators: oldWordDecorators.get(w.label)
      }))
    }

    // Map chars from JIIX to IIRecognizedText
    if (el.chars?.length) {
      recognizedText.chars = el.chars.map((c: TJIIXChar) => ({
        label: c.label,
        word: c.word,
        bounds: c["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(c["bounding-box"])) : undefined
      }))
    }

    this.#logger.debug("createNewTextSymbol", "Created Text symbol:", recognizedText)

    // Collect decorators from old symbols
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) {
        sym.decorators.forEach(d =>
        {
          if (!recognizedText.decorators.some(wd => wd.kind === d.kind)) {
            recognizedText.decorators.push(d)
          }
        })
      }
      this.#logger.debug("createNewTextSymbol", "Removing old symbol:", sym.id)
      this.model.removeSymbol(sym.id)
      this.editor.renderer.removeSymbol(sym.id)
    })

    this.model.addSymbol(recognizedText)
    this.editor.renderer.drawSymbol(recognizedText)
    this.#logger.debug("createNewTextSymbol", "Added Text symbol to model and rendered")
  }

  /**
   * Synchronize an embedded Math element (Math inside Text)
   */
  protected synchronizeEmbeddedMathElement(mathEl: TJIIXMathElement): void
  {
    this.#logger.debug("synchronizeEmbeddedMathElement", "Found embedded Math element:", mathEl)
    const mathItems = this.getMathElementItems(mathEl)
    this.#logger.debug("synchronizeEmbeddedMathElement", `Collected ${mathItems.length} items from embedded Math element`)
    const mathJiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(mathItems)

    if (mathJiixAssociation.strokes.length) {
      // Find existing Math symbol with same jiixId
      const existingMath = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Math &&
        (s as IIRecognizedMath).jiixId === mathEl.id
      ) as IIRecognizedMath | undefined

      if (existingMath) {
        this.updateExistingMathSymbol(existingMath, mathEl, mathJiixAssociation, true)
      } else {
        this.createNewMathSymbol(mathEl, mathJiixAssociation, true)
      }
    } else {
      this.#logger.warn("synchronizeEmbeddedMathElement", "Embedded Math element has no strokes:", mathEl.id)
    }
  }

  /**
   * Synchronize a standalone Math element
   */
  protected synchronizeMathElement(el: TJIIXMathElement): void
  {
    // Process only standalone Math elements (without parent)
    if (el.parent) {
      this.#logger.debug("synchronizeMathElement", "Skipping embedded Math element (has parent):", el.id)
      return
    }

    this.#logger.debug("synchronizeMathElement", "Processing standalone Math element:", el)
    const mathItems = this.getMathElementItems(el)
    this.#logger.debug("synchronizeMathElement", `Collected ${mathItems.length} items from Math element`)
    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(mathItems)

    if (jiixAssociation.strokes.length) {
      this.#logger.debug("synchronizeMathElement", `Math strokes: ${jiixAssociation.strokes.length}, symbols: ${jiixAssociation.symbols.length}`)

      // Find existing Math symbol with same jiixId
      const existingMath = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Math &&
        (s as IIRecognizedMath).jiixId === el.id
      ) as IIRecognizedMath | undefined

      if (existingMath) {
        this.updateExistingMathSymbol(existingMath, el, jiixAssociation, false)
      } else {
        this.createNewMathSymbol(el, jiixAssociation, false)
      }
    } else {
      this.#logger.warn("synchronizeMathElement", "Math element has no strokes:", el.id)
    }
  }

  /**
   * Update an existing Math symbol
   */
  protected updateExistingMathSymbol(existingMath: IIRecognizedMath, mathEl: TJIIXMathElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }, isEmbedded: boolean): void
  {
    const context = isEmbedded ? "embedded" : "standalone"
    this.#logger.debug("updateExistingMathSymbol", `Updating existing ${context} Math symbol:`, existingMath.id)
    existingMath.strokes = jiixAssociation.strokes
    existingMath.label = mathEl.label
    existingMath.parent = mathEl.parent
    existingMath.expressions = mathEl.expressions
    // solverOutputStrokeIds and variableValues are preserved automatically

    // Remove old symbols EXCEPT the existing one and parent Text (if embedded)
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.id !== existingMath.id) {
        if (isEmbedded && sym.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) {
          this.#logger.debug("updateExistingMathSymbol", "Skipping removal of Text symbol:", sym.id)
          return
        }
        this.#logger.debug("updateExistingMathSymbol", `Removing old symbol for ${context} Math:`, sym.id)
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      }
    })

    this.model.updateSymbol(existingMath)
    this.editor.renderer.drawSymbol(existingMath)

    // If selected, reset the selection
    if (existingMath.selected) {
      this.editor.selector.resetSelectedGroup([existingMath])
    }
  }

  /**
   * Create a new Math symbol
   */
  protected createNewMathSymbol(mathEl: TJIIXMathElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }, isEmbedded: boolean): void
  {
    const context = isEmbedded ? "embedded" : "standalone"
    this.#logger.debug("createNewMathSymbol", `Creating new ${context} Math symbol`)
    const recognizedMath = new IIRecognizedMath(jiixAssociation.strokes)
    recognizedMath.jiixId = mathEl.id
    recognizedMath.label = mathEl.label
    recognizedMath.parent = mathEl.parent
    recognizedMath.expressions = mathEl.expressions

    // Remove old symbols EXCEPT the parent Text (if embedded, which will be replaced later)
    jiixAssociation.symbols.forEach(sym =>
    {
      if (isEmbedded && sym.type === SymbolType.Recognized && sym.kind === RecognizedKind.Text) {
        this.#logger.debug("createNewMathSymbol", "Skipping removal of Text symbol:", sym.id)
        return
      }
      this.#logger.debug("createNewMathSymbol", `Removing old symbol for ${context} Math:`, sym.id)
      this.model.removeSymbol(sym.id)
      this.editor.renderer.removeSymbol(sym.id)
    })

    this.model.addSymbol(recognizedMath)
    this.editor.renderer.drawSymbol(recognizedMath)
    this.#logger.debug("createNewMathSymbol", `Added ${context} Math symbol:`, recognizedMath)
  }

  /**
   * Synchronize a Node element (shapes like circle, rectangle, etc.)
   */
  protected synchronizeNodeElement(el: TJIIXNodeElement): void
  {
    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(el.items)
    if (jiixAssociation.strokes.length) {
      // Find existing Node symbol with same jiixId
      const existingNode = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        (s as TIIRecognized).jiixId === el.id
      ) as TIIRecognized | undefined

      if (existingNode) {
        this.updateExistingNodeSymbol(existingNode, jiixAssociation)
      } else {
        this.createNewNodeSymbol(el, jiixAssociation)
      }
    }
  }

  /**
   * Update an existing Node symbol
   */
  protected updateExistingNodeSymbol(existingNode: TIIRecognized, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingNodeSymbol", "Updating existing Node symbol:", existingNode.id)
    existingNode.strokes = jiixAssociation.strokes

    // Remove old symbols EXCEPT the existing one
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.id !== existingNode.id) {
        this.#logger.debug("updateExistingNodeSymbol", "Removing old symbol for Node:", sym.id)
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      }
    })

    this.model.updateSymbol(existingNode)
    this.editor.renderer.drawSymbol(existingNode)

    // If selected, reset the selection
    if (existingNode.selected) {
      this.editor.selector.resetSelectedGroup([existingNode])
    }
  }

  /**
   * Create a new Node symbol
   */
  protected createNewNodeSymbol(el: TJIIXNodeElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    let symbolRecognized: TIIRecognized | undefined
    switch (el.kind) {
      case JIIXNodeKind.Circle: {
        symbolRecognized = new IIRecognizedCircle(jiixAssociation.strokes)
        break
      }
      case JIIXNodeKind.Ellipse: {
        symbolRecognized = new IIRecognizedEllipse(jiixAssociation.strokes)
        break
      }
      case JIIXNodeKind.Rectangle:
      case JIIXNodeKind.Triangle:
      case JIIXNodeKind.Parallelogram:
      case JIIXNodeKind.Polygon:
      case JIIXNodeKind.Rhombus: {
        symbolRecognized = new IIRecognizedPolygon(jiixAssociation.strokes)
        break
      }
      default:
        this.#logger.warn("createNewNodeSymbol", `Can not create recognized shape symbol, kind unknown: ${ el }`)
        break
    }
    if (symbolRecognized) {
      symbolRecognized.jiixId = el.id
      jiixAssociation.symbols.forEach(sym =>
      {
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      })
      this.model.addSymbol(symbolRecognized)
      this.editor.renderer.drawSymbol(symbolRecognized)
    }
  }

  /**
   * Synchronize an Edge element (lines, arcs, polylines)
   */
  protected synchronizeEdgeElement(el: TJIIXEdgeElement): void
  {
    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(
      el.kind === JIIXEdgeKind.PolyEdge ? el.edges.flatMap((e: TJIIXEdgeLine) => e.items!) : el.items
    )
    if (jiixAssociation.strokes.length) {
      // Find existing Edge symbol with same jiixId
      const existingEdge = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        (s as TIIRecognized).jiixId === el.id
      ) as TIIRecognized | undefined

      if (existingEdge) {
        this.updateExistingEdgeSymbol(existingEdge, jiixAssociation)
      } else {
        this.createNewEdgeSymbol(el, jiixAssociation)
      }
    }
  }

  /**
   * Update an existing Edge symbol
   */
  protected updateExistingEdgeSymbol(existingEdge: TIIRecognized, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingEdgeSymbol", "Updating existing Edge symbol:", existingEdge.id)
    existingEdge.strokes = jiixAssociation.strokes

    // Remove old symbols EXCEPT the existing one
    jiixAssociation.symbols.forEach(sym =>
    {
      if (sym.id !== existingEdge.id) {
        this.#logger.debug("updateExistingEdgeSymbol", "Removing old symbol for Edge:", sym.id)
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      }
    })

    this.model.updateSymbol(existingEdge)
    this.editor.renderer.drawSymbol(existingEdge)

    // If selected, reset the selection
    if (existingEdge.selected) {
      this.editor.selector.resetSelectedGroup([existingEdge])
    }
  }

  /**
   * Create a new Edge symbol
   */
  protected createNewEdgeSymbol(el: TJIIXEdgeElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    let symbolRecognized: TIIRecognized | undefined
    switch (el.kind) {
      case JIIXEdgeKind.Line: {
        symbolRecognized = new IIRecognizedLine(jiixAssociation.strokes)
        break
      }
      case JIIXEdgeKind.PolyEdge: {
        symbolRecognized = new IIRecognizedPolyLine(jiixAssociation.strokes)
        break
      }
      case JIIXEdgeKind.Arc: {
        symbolRecognized = new IIRecognizedArc(jiixAssociation.strokes)
        break
      }
      default:
        this.#logger.warn("createNewEdgeSymbol", `Can not create recognized edge symbol, kind unknown: ${ el }`)
        break
    }
    if (symbolRecognized) {
      symbolRecognized.jiixId = el.id
      jiixAssociation.symbols.forEach(sym =>
      {
        this.model.removeSymbol(sym.id)
        this.editor.renderer.removeSymbol(sym.id)
      })
      this.model.addSymbol(symbolRecognized)
      this.editor.renderer.drawSymbol(symbolRecognized)
    }
  }
}
