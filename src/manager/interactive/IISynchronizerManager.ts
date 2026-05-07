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

    if (!jiix) {
      this.#logger.warn("synchronize", "No JIIX export available")
      return
    }

    for (const el of jiix.elements || []) {
      switch (el.type) {
        case JIIXELementType.Text:
          await this.synchronizeTextElement(el, jiix)
          break
        case JIIXELementType.Math:
          await this.synchronizeMathElement(el)
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
    }

    this.model.mergeExport({ "application/vnd.myscript.jiix": jiix })
    this.editor.history.update(this.model)

    const mathSymbols = this.model.symbols.filter(s =>
      s.type === SymbolType.Recognized &&
      s.kind === RecognizedKind.Math &&
      s.strokes &&
      s.strokes.length > 0
    ) as IIRecognizedMath[]

    const enrichPromises = mathSymbols.map(mathSymbol =>
      this.enrichMathDependencies(mathSymbol).catch(err =>
        this.#logger.error("synchronize", "Error enriching math dependencies:", err)
      )
    )
    await Promise.all(enrichPromises)

    this.cleanupMathDependencies(mathSymbols)

    this.editor.mathOverlays.refresh()

    this.editor.event.emitSynchronized()
  }

  /**
   * Clean up dependentBlocks and variableSources by removing IDs that don't exist in the model anymore
   * Also ensures bidirectional consistency: if A has B in dependentBlocks, then B must have A in variableSources
   */
  protected cleanupMathDependencies(mathSymbols: IIRecognizedMath[]): void
  {
    const existingJiixIds = new Set(mathSymbols.map(s => s.jiixId).filter(Boolean))

    mathSymbols.forEach(mathSymbol =>
    {
      let needsUpdate = false

      if (mathSymbol.dependentBlocks && mathSymbol.dependentBlocks.length > 0) {
        const originalLength = mathSymbol.dependentBlocks.length

        mathSymbol.dependentBlocks = mathSymbol.dependentBlocks.filter(id =>
          existingJiixIds.has(id)
        )

        const removedCount = originalLength - mathSymbol.dependentBlocks.length
        if (removedCount > 0) {
          this.#logger.info("cleanupMathDependencies", `Cleaned up ${removedCount} invalid dependent block(s) from "${mathSymbol.label}" (${mathSymbol.jiixId})`)
          needsUpdate = true
        }
      }

      if (mathSymbol.variableSources && Object.keys(mathSymbol.variableSources).length > 0) {
        const invalidVariables: string[] = []

        Object.entries(mathSymbol.variableSources).forEach(([varName, sourceId]) => {
          if (!existingJiixIds.has(sourceId)) {
            invalidVariables.push(varName)
          }
        })

        if (invalidVariables.length > 0) {
          invalidVariables.forEach(varName => {
            delete mathSymbol.variableSources![varName]
          })
          this.#logger.info("cleanupMathDependencies", `Cleaned up ${invalidVariables.length} invalid variable source(s) from "${mathSymbol.label}" (${mathSymbol.jiixId})`)
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.model.updateSymbol(mathSymbol)
      }
    })

    const blockToSources = new Map<string, Set<string>>()
    mathSymbols.forEach(mathSymbol => {
      if (mathSymbol.jiixId) {
        const sources = mathSymbol.variableSources
          ? new Set(Object.values(mathSymbol.variableSources))
          : new Set<string>()
        blockToSources.set(mathSymbol.jiixId, sources)
      }
    })

    mathSymbols.forEach(mathSymbol => {
      if (mathSymbol.dependentBlocks && mathSymbol.dependentBlocks.length > 0 && mathSymbol.jiixId) {
        const originalLength = mathSymbol.dependentBlocks.length

        mathSymbol.dependentBlocks = mathSymbol.dependentBlocks.filter(depId => {
          const sources = blockToSources.get(depId)

          if (!sources) {
            this.#logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not found in blockToSources map, keeping it in dependentBlocks`)
            return true
          }

          const hasReference = sources.has(mathSymbol.jiixId!)

          if (!hasReference) {
            this.#logger.info("cleanupMathDependencies", `Removing "${depId}" from dependentBlocks of "${mathSymbol.label}" (${mathSymbol.jiixId}) - block doesn't reference it as a source`)
          }

          return hasReference
        })

        const removedCount = originalLength - mathSymbol.dependentBlocks.length
        if (removedCount > 0) {
          this.#logger.info("cleanupMathDependencies", `Removed ${removedCount} inconsistent dependent block(s) from "${mathSymbol.label}" (${mathSymbol.jiixId})`)
          this.model.updateSymbol(mathSymbol)
        }
      }
    })
  }

  /**
   * Enrich a math symbol with variable dependencies
   * Analyzes variables used in the expression and links them to their source blocks
   * @param mathSymbol - The math symbol to enrich
   * @returns Promise that resolves when dependencies are established
   */
  protected async enrichMathDependencies(mathSymbol: IIRecognizedMath): Promise<void>
  {
    try {
      if (!mathSymbol.jiixId) {
        this.#logger.warn("enrichMathDependencies", "Math symbol has no jiixId")
        return
      }

      const symbolExists = this.model.symbols.some(s => s.id === mathSymbol.id)
      if (!symbolExists) {
        this.#logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} (${mathSymbol.jiixId}) no longer exists in model, skipping enrichment`)
        return
      }

      // Verify the symbol still has strokes (not deleted by erase/scratch)
      if (!mathSymbol.strokes || mathSymbol.strokes.length === 0) {
        this.#logger.debug("enrichMathDependencies", `Symbol ${mathSymbol.id} (${mathSymbol.jiixId}) has no strokes, skipping enrichment`)
        return
      }

      this.#logger.info("enrichMathDependencies", `Starting enrichment for ${mathSymbol.label} (${mathSymbol.jiixId})`)

      const variables = await this.editor.getVariables(mathSymbol.jiixId)

      if (!variables || variables.length === 0) {
        this.#logger.debug("enrichMathDependencies", `No variables found in ${mathSymbol.label}`)
        if (mathSymbol.variableSources && Object.keys(mathSymbol.variableSources).length > 0) {
          mathSymbol.variableSources = {}
          await this.model.updateSymbol(mathSymbol)
        }
        return
      }

      this.#logger.info("enrichMathDependencies", `Found ${variables.length} variables:`, variables.map(v => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`))

      const newVariableSources: { [variableName: string]: string } = {}
      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          this.#logger.info("enrichMathDependencies", `Variable "${variable.name}" in "${mathSymbol.label}" sources from block "${variable.sourceId}"`)
          const sourceMathSymbol = this.editor.findMathSymbolByJiixId(variable.sourceId!)

          if (sourceMathSymbol) {
            if (!sourceMathSymbol.dependentBlocks) {
              sourceMathSymbol.dependentBlocks = []
            }
            // Add this block as dependent if not already present
            if (!sourceMathSymbol.dependentBlocks.includes(mathSymbol.jiixId!)) {
              sourceMathSymbol.dependentBlocks.push(mathSymbol.jiixId!)
              await this.model.updateSymbol(sourceMathSymbol)
              this.#logger.info("enrichMathDependencies", `Added dependency: "${mathSymbol.label}" (${mathSymbol.jiixId}) → depends on → "${sourceMathSymbol.label}" (${variable.sourceId})`)
              this.#logger.info("enrichMathDependencies", `Source block "${sourceMathSymbol.label}" now has dependentBlocks:`, sourceMathSymbol.dependentBlocks)
            } else {
              this.#logger.debug("enrichMathDependencies", `Dependency already exists: ${mathSymbol.jiixId} → ${variable.sourceId}`)
            }
          } else {
            this.#logger.warn("enrichMathDependencies", `Source math symbol not found for variable "${variable.name}" with sourceId "${variable.sourceId}"`)
          }
        } else {
          this.#logger.debug("enrichMathDependencies", `Variable "${variable.name}" has sourceType "${variable.sourceType}", skipping`)
        }
      }

      mathSymbol.variableSources = newVariableSources

      await this.model.updateSymbol(mathSymbol)
      this.#logger.info("enrichMathDependencies", `Enriched "${mathSymbol.label}" with variableSources:`, mathSymbol.variableSources)

      this.editor.event.emitChanged(this.editor.history.context)
    }
    catch (error) {
      this.#logger.error("enrichMathDependencies", { error })
      // Don't throw, just log - dependencies are optional
    }
  }

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

  protected collectMathItems(expr: TJIIXMathExpression): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

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

  protected getMathElementItems(mathElement: TJIIXMathElement): TJIIXStrokeItem[]
  {
    const items: TJIIXStrokeItem[] = []

    if (mathElement.items) {
      items.push(...mathElement.items)
    }

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
  protected async synchronizeTextElement(el: TJIIXTextElement, jiix: TJIIXExport): Promise<void>
  {
    this.#logger.debug("synchronizeTextElement", "Processing Text element:", el)

    if (el.children && el.children.length > 0) {
      this.#logger.debug("synchronizeTextElement", `Text has ${el.children.length} children, processing Math elements:`, el.children)

      for (const childId of el.children) {
        const mathEl = jiix?.elements?.find(e => e.id === childId && e.type === "Math") as TJIIXMathElement | undefined
        if (mathEl) {
          await this.synchronizeEmbeddedMathElement(mathEl)
        }
      }
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
      const existingText = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Text &&
        s.jiixId === el.id
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

  protected updateExistingTextSymbol(existingText: IIRecognizedText, el: TJIIXTextElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingTextSymbol", "Updating existing Text symbol:", existingText.id)
    existingText.strokes = jiixAssociation.strokes
    existingText.label = el.label

    if (el.children && el.children.length > 0) {
      existingText.children = [...el.children]
      existingText.childrenPos = [...(el["children-pos"] || [])]
    }

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
    this.editor.event.emitChanged(this.editor.history.context)
  }

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

    if (el.children && el.children.length > 0) {
      recognizedText.children = [...el.children]
      recognizedText.childrenPos = [...(el["children-pos"] || [])]
      this.#logger.debug("createNewTextSymbol", `Text has ${el.children.length} children:`, el.children)
    }

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

    if (el.words?.length) {
      recognizedText.words = el.words.map((w: TJIIXWord) => ({
        label: w.label,
        firstChar: w["first-char"],
        lastChar: w["last-char"],
        bounds: w["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(w["bounding-box"])) : undefined,
        decorators: oldWordDecorators.get(w.label)
      }))
    }

    if (el.chars?.length) {
      recognizedText.chars = el.chars.map((c: TJIIXChar) => ({
        label: c.label,
        word: c.word,
        bounds: c["bounding-box"] ? new Box(convertBoundingBoxMillimeterToPixel(c["bounding-box"])) : undefined
      }))
    }

    this.#logger.debug("createNewTextSymbol", "Created Text symbol:", recognizedText)

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
    this.editor.event.emitChanged(this.editor.history.context)
    this.#logger.debug("createNewTextSymbol", "Added Text symbol to model and rendered")
  }

  protected async synchronizeEmbeddedMathElement(mathEl: TJIIXMathElement): Promise<void>
  {
    this.#logger.debug("synchronizeEmbeddedMathElement", "Found embedded Math element:", mathEl)
    const mathItems = this.getMathElementItems(mathEl)
    this.#logger.debug("synchronizeEmbeddedMathElement", `Collected ${mathItems.length} items from embedded Math element`)
    const mathJiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(mathItems)

    if (mathJiixAssociation.strokes.length) {
      const existingMath = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Math &&
        (s as IIRecognizedMath).jiixId === mathEl.id
      ) as IIRecognizedMath | undefined

      if (existingMath) {
        await this.updateExistingMathSymbol(existingMath, mathEl, mathJiixAssociation, true)
      } else {
        this.createNewMathSymbol(mathEl, mathJiixAssociation, true)
      }
    } else {
      this.#logger.warn("synchronizeEmbeddedMathElement", "Embedded Math element has no strokes:", mathEl.id)
    }
  }

  protected async synchronizeMathElement(el: TJIIXMathElement): Promise<void>
  {
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

      const existingMath = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.kind === RecognizedKind.Math &&
        s.jiixId === el.id
      ) as IIRecognizedMath | undefined

      if (existingMath) {
        await this.updateExistingMathSymbol(existingMath, el, jiixAssociation, false)
      } else {
        this.createNewMathSymbol(el, jiixAssociation, false)
      }
    } else {
      this.#logger.warn("synchronizeMathElement", "Math element has no strokes:", el.id)
    }
  }

  protected async clearDependentBlocksSolverOutputs(dependentBlockIds: string[]): Promise<void>
  {
    for (const dependentBlockId of dependentBlockIds) {
      const dependentMathSymbol = this.editor.findMathSymbolByJiixId(dependentBlockId)

      if (!dependentMathSymbol) {
        this.#logger.warn("clearDependentBlocksSolverOutputs", `Dependent block not found: ${dependentBlockId}`)
        continue
      }

      await this.editor.clearSolverOutputStrokes(dependentMathSymbol)
      this.editor.renderer.drawSymbol(dependentMathSymbol)
    }
    this.editor.event.emitChanged(this.editor.history.context)
  }

  protected async updateExistingMathSymbol(existingMath: IIRecognizedMath, mathEl: TJIIXMathElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }, isEmbedded: boolean): Promise<void>
  {
    const context = isEmbedded ? "embedded" : "standalone"
    this.#logger.debug("updateExistingMathSymbol", `Updating existing ${context} Math symbol:`, existingMath.id)

    let preservedSolverOutputStrokeIds = existingMath.solverOutputStrokeIds
    const preservedVariableValues = existingMath.variableValues
    const preservedDependentBlocks = existingMath.dependentBlocks // PRESERVE this - it's set by OTHER blocks

    const oldUserStrokes = existingMath.strokes.filter(s =>
      !preservedSolverOutputStrokeIds?.includes(s.id)
    )
    const newUserStrokes = jiixAssociation.strokes.filter(s =>
      !preservedSolverOutputStrokeIds?.includes(s.id)
    )

    const userStrokesChanged = oldUserStrokes.length !== newUserStrokes.length ||
      oldUserStrokes.some((s, i) => s.id !== newUserStrokes[i]?.id)

    if (userStrokesChanged && preservedDependentBlocks && preservedDependentBlocks.length > 0) {
      this.#logger.info("updateExistingMathSymbol", `User strokes changed for ${existingMath.jiixId}, clearing ${preservedDependentBlocks.length} dependent blocks' solver outputs`)
      this.clearDependentBlocksSolverOutputs(preservedDependentBlocks).catch(err =>
        this.#logger.error("updateExistingMathSymbol", "Error clearing dependent solver outputs:", err)
      )
    }

    if (userStrokesChanged) {
      this.#logger.info("updateExistingMathSymbol", `User strokes changed for ${existingMath.jiixId}, clearing its own solver outputs`)
      const tempSolverOutputIds = preservedSolverOutputStrokeIds
      if (tempSolverOutputIds && tempSolverOutputIds.length > 0) {
        existingMath.solverOutputStrokeIds = tempSolverOutputIds
        await this.editor.clearSolverOutputStrokes(existingMath)
        preservedSolverOutputStrokeIds = undefined // Don't restore them later
      }
    } else if (!userStrokesChanged) {
      this.#logger.debug("updateExistingMathSymbol", `Only solver strokes changed for ${existingMath.jiixId}, keeping all solver outputs`)
    }

    existingMath.strokes = jiixAssociation.strokes
    existingMath.label = mathEl.label
    existingMath.parent = mathEl.parent
    existingMath.expressions = mathEl.expressions

    existingMath.solverOutputStrokeIds = preservedSolverOutputStrokeIds
    existingMath.variableValues = preservedVariableValues
    existingMath.dependentBlocks = preservedDependentBlocks // RESTORE - this is managed by other blocks

    existingMath.variableSources = undefined

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

    if (existingMath.selected) {
      this.editor.selector.resetSelectedGroup([existingMath])
    }

    this.editor.event.emitChanged(this.editor.history.context)
  }

  protected createNewMathSymbol(mathEl: TJIIXMathElement, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }, isEmbedded: boolean): void
  {
    const context = isEmbedded ? "embedded" : "standalone"
    this.#logger.debug("createNewMathSymbol", `Creating new ${context} Math symbol`)
    const recognizedMath = new IIRecognizedMath(jiixAssociation.strokes)
    recognizedMath.jiixId = mathEl.id
    recognizedMath.label = mathEl.label
    recognizedMath.parent = mathEl.parent
    recognizedMath.expressions = mathEl.expressions

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

    this.editor.event.emitChanged(this.editor.history.context)
  }

  protected synchronizeNodeElement(el: TJIIXNodeElement): void
  {
    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(el.items)
    if (jiixAssociation.strokes.length) {
      const existingNode = this.model.symbols.find(s =>
        s.type === SymbolType.Recognized &&
        s.jiixId === el.id
      ) as TIIRecognized | undefined

      if (existingNode) {
        this.updateExistingNodeSymbol(existingNode, jiixAssociation)
      } else {
        this.createNewNodeSymbol(el, jiixAssociation)
      }
    }
  }

  protected updateExistingNodeSymbol(existingNode: TIIRecognized, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingNodeSymbol", "Updating existing Node symbol:", existingNode.id)
    existingNode.strokes = jiixAssociation.strokes

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

    if (existingNode.selected) {
      this.editor.selector.resetSelectedGroup([existingNode])
    }
  }

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
      this.editor.event.emitChanged(this.editor.history.context)
    }
  }

  protected synchronizeEdgeElement(el: TJIIXEdgeElement): void
  {
    const jiixAssociation = this.getSymbolsAndStrokesAssociatedFromJIIXStrokeItems(
      el.kind === JIIXEdgeKind.PolyEdge ? el.edges.flatMap((e: TJIIXEdgeLine) => e.items!) : el.items
    )
    if (jiixAssociation.strokes.length) {
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

  protected updateExistingEdgeSymbol(existingEdge: TIIRecognized, jiixAssociation: { symbols: TIISymbol[], strokes: IIStroke[] }): void
  {
    this.#logger.debug("updateExistingEdgeSymbol", "Updating existing Edge symbol:", existingEdge.id)
    existingEdge.strokes = jiixAssociation.strokes

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

    if (existingEdge.selected) {
      this.editor.selector.resetSelectedGroup([existingEdge])
    }
    this.editor.event.emitChanged(this.editor.history.context)
  }

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
      this.editor.event.emitChanged(this.editor.history.context)
    }
  }
}
