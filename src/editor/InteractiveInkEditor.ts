import { EditorTool, SELECTION_MARGIN } from "../Constants"
import { IIModel, TExport, TJIIXMathElement } from "../model"
import
{
  Box,
  EdgeKind,
  IIDecorator,
  TIIEdge,
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  TIIShape,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon,
  IIStroke,
  IIRecognizedText,
  IIRecognizedMath,
  IISymbolGroup,
  IIRecognizedLine,
  IIRecognizedPolyLine,
  IIRecognizedArc,
  IIRecognizedCircle,
  IIRecognizedEllipse,
  IIRecognizedPolygon,
  IIText,
  IIMath,
  TIISymbol,
  TIIRecognized,
  RecognizedKind,
  ShapeKind,
  SymbolType,
  convertPartialStrokesToOIStrokes,
  isMathSymbol
} from "../symbol"
import { RecognizerWebSocket, TMathVariable, TMathEvaluable } from "../recognizer"
import { SVGRenderer, SVGBuilder, TIIRendererConfiguration } from "../renderer"
import { TStyle } from "../style"
import
{
  IIConversionManager,
  IIWriterManager,
  IISelectionManager,
  IIResizeManager,
  IIRotationManager,
  IITranslateManager,
  IITextManager,
  EraseManager,
  IIDebugSVGManager,
  IIMoveManager,
  IIGestureManager,
  IISnapManager,
  IISynchronizerManager,
  MathOverlayManager,
  MathInteractionManager,
  TransientInkManager,
} from "../manager"
import { IIHistoryManager, TIIHistoryBackendChanges, TIIHistoryChanges, THistoryContext } from "../history"
import { PartialDeep, convertMillimeterToPixel, mergeDeep } from "../utils"
import { IIMenuAction, IIMenuManager, IIMenuStyle, IIMenuTool } from "../menu"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InteractiveInkEditorConfiguration, TInteractiveInkEditorConfiguration } from "./InteractiveInkEditorConfiguration"

/**
 * @group Editor
 */
export type TInteractiveInkEditorOptions = PartialDeep<EditorOptionsBase &
  {
    configuration: TInteractiveInkEditorConfiguration
  }> &
  {
    override?: {
      recognizer?: RecognizerWebSocket
      menu?: {
        style?: IIMenuStyle
        tool?: IIMenuTool
        action?: IIMenuAction
      }
    }
  }
/**
 * @group Editor
 */
export class InteractiveInkEditor extends AbstractEditor
{
  #configuration: InteractiveInkEditorConfiguration
  #model: IIModel
  #tool: EditorTool = EditorTool.Write
  #toolBeforeCtrl?: EditorTool
  #layerUITimer?: ReturnType<typeof setTimeout>
  #recognizeStrokeTimer?: ReturnType<typeof setTimeout>

  renderer: SVGRenderer
  recognizer: RecognizerWebSocket

  #penStyle: TStyle

  history: IIHistoryManager
  writer: IIWriterManager
  eraser: EraseManager
  gesture: IIGestureManager
  resizer: IIResizeManager
  rotator: IIRotationManager
  translator: IITranslateManager
  converter: IIConversionManager
  texter: IITextManager
  selector: IISelectionManager
  svgDebugger: IIDebugSVGManager
  snaps: IISnapManager
  move: IIMoveManager
  synchronizer: IISynchronizerManager
  mathOverlays: MathOverlayManager
  mathInteractions: MathInteractionManager
  transientInk: TransientInkManager
  menu: IIMenuManager
  mathComputationMode: "strokes-only" | "value-only" | "both" = "strokes-only"

  constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions)
  {
    super(rootElement, options)

    this.#configuration = new InteractiveInkEditorConfiguration(options?.configuration)
    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

    if (options?.override?.recognizer) {
      const CustomRecognizer = options?.override.recognizer as unknown as typeof RecognizerWebSocket
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new RecognizerWebSocket(this.#configuration)
    }
    this.recognizer.event.addErrorListener(this.manageError.bind(this))
    this.recognizer.event.addExportedListener(this.event.emitExported.bind(this.event))
    this.recognizer.event.addContentChangedListener(this.onContentChanged.bind(this))
    this.recognizer.event.addSessionOpenedListener(this.event.emitSessionOpened.bind(this.event))
    this.recognizer.event.addEndInitialization(this.layers.hideMessageModal.bind(this.layers))
    this.recognizer.event.addIdleListener(this.updateLayerState.bind(this))

    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IIModel(this.#configuration.rendering.minWidth, this.#configuration.rendering.minHeight, this.configuration.rendering.guides.gap)

    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)

    this.writer = new IIWriterManager(this)
    this.eraser = new EraseManager(this)
    this.selector = new IISelectionManager(this)
    this.move = new IIMoveManager(this)

    this.gesture = new IIGestureManager(this, this.#configuration.gesture)
    this.resizer = new IIResizeManager(this)
    this.rotator = new IIRotationManager(this)
    this.translator = new IITranslateManager(this)
    this.converter = new IIConversionManager(this)
    this.texter = new IITextManager(this)
    this.svgDebugger = new IIDebugSVGManager(this)
    this.snaps = new IISnapManager(this, this.#configuration.snap)
    this.synchronizer = new IISynchronizerManager(this)
    this.mathOverlays = new MathOverlayManager(this)
    this.mathInteractions = new MathInteractionManager(this)
    this.transientInk = new TransientInkManager(this.renderer, this.#model)
    this.menu = new IIMenuManager(this, options?.override?.menu)
  }

  get initializationPromise(): Promise<void>
  {
    return this.recognizer.initialized.promise
  }

  get tool(): EditorTool
  {
    return this.#tool
  }
  set tool(i: EditorTool)
  {
    this.#tool = i
    this.menu.tool.update()
    this.setCursorStyle()
    this.unselectAll()

    if (this.#toolBeforeCtrl && i !== EditorTool.Move) {
      this.#toolBeforeCtrl = undefined
    }

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()
    switch (this.#tool) {
      case EditorTool.Erase:
        this.eraser.attach(this.layers.rendering)
        break
      case EditorTool.Select:
        this.selector.attach(this.layers.rendering)
        break
      case EditorTool.Move:
        this.move.attach(this.layers.rendering)
        break
      default:
        this.writer.attach(this.layers.rendering)
        break
    }
    this.event.emitToolChanged(i)
  }

  get model(): IIModel
  {
    return this.#model
  }

  get configuration(): InteractiveInkEditorConfiguration
  {
    return this.#configuration
  }
  set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration)
  {
    this.configuration.rendering = mergeDeep(this.configuration.rendering, renderingConfiguration)
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.stack.forEach(i => i.model.rowHeight = this.model.rowHeight)
    this.event.emitUIpdated()
  }

  get penStyle(): TStyle
  {
    return this.#penStyle
  }
  set penStyle(penStyle: PartialDeep<TStyle>)
  {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
  }

  protected updateLayerState(idle: boolean): void
  {
    this.event.emitIdle(idle)
    this.layers.updateState(idle)
  }

  /**
   * Update layer UI with debouncing
   * @param timeout - Debounce timeout in milliseconds (default: 500ms)
   */
  updateLayerUI(timeout: number = 500): void
  {
    clearTimeout(this.#layerUITimer)
    this.#layerUITimer = setTimeout(() =>
    {
      this.menu.update()
      this.svgDebugger.apply()
      this.event.emitUIpdated()
    }, timeout)
  }

  protected manageError(error: Error): void
  {
    this.layers.showMessageError(error)
    this.event.emitError(error)
  }

  protected setCursorStyle(): void
  {
    switch (this.#tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Select:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.add("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Move:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.add("move")
        break
      default:
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
    }
  }

  protected async onContentChanged(undoRedoContext: THistoryContext): Promise<void>
  {
    clearTimeout(this.#recognizeStrokeTimer)
    this.#recognizeStrokeTimer = setTimeout(async () =>
    {
      await this.synchronizeStrokesWithJIIX()
      this.updateLayerUI(0)
      this.event.emitChanged(undoRedoContext)
    }, 500)
  }

  async initialize(): Promise<void>
  {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = EditorTool.Write
      this.renderer.init(this.layers.rendering)
      this.menu.render(this.layers.ui.root)

      window.addEventListener("keydown", this.handleKeyDown)
      window.addEventListener("keyup", this.handleKeyUp)
      this.layers.root.addEventListener("wheel", this.handleWheel)

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
      this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.init(this.model)

      if(!this.recognizer.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.recognizer.configuration.server.version = this.info!.version
      }
      await this.recognizer.init()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    }
    finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.layers.updateState(true)
    }
  }

  async changeLanguage(code: string): Promise<void>
  {
    try {
      this.logger.info("changeLanguage", { code })
      this.updateLayerState(false)
      this.configuration.recognition.lang = code
      await this.recognizer.newSession(this.configuration)
      this.recognizer.addStrokes(this.extractStrokesFromSymbols(this.model.symbols), false)
      this.layers.hideLoader()
      this.event.emitLoaded()
    }
    catch (error) {
      this.logger.error("changeLanguage", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  protected buildShape(partialShape: PartialDeep<TIIShape>): TIIShape
  {
    switch (partialShape.kind) {
      case ShapeKind.Circle:
        return IIShapeCircle.create(partialShape as PartialDeep<IIShapeCircle>)
      case ShapeKind.Ellipse:
        return IIShapeEllipse.create(partialShape as PartialDeep<IIShapeEllipse>)
      case ShapeKind.Polygon:
        return IIShapePolygon.create(partialShape as PartialDeep<IIShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partialShape.kind }" is unknown`)
    }
  }

  protected buildEdge(partialEdge: PartialDeep<TIIEdge>): TIIEdge
  {
    switch (partialEdge.kind) {
      case EdgeKind.Arc:
        return IIEdgeArc.create(partialEdge as PartialDeep<IIEdgeArc>)
      case EdgeKind.Line:
        return IIEdgeLine.create(partialEdge as PartialDeep<IIEdgeLine>)
      case EdgeKind.PolyEdge:
        return IIEdgePolyLine.create(partialEdge as PartialDeep<IIEdgePolyLine>)
      default:
        throw new Error(`Unable to create edge, kind: "${ partialEdge.kind }" is unknown`)
    }
  }

  protected buildRecognized(partialSymbol: PartialDeep<TIIRecognized>): TIIRecognized
  {
    switch (partialSymbol.kind) {
      case RecognizedKind.Text:
        return IIRecognizedText.create(partialSymbol)
      case RecognizedKind.Math:
        return IIRecognizedMath.create(partialSymbol)
      case RecognizedKind.Arc:
        return IIRecognizedArc.create(partialSymbol)
      case RecognizedKind.Circle:
        return IIRecognizedCircle.create(partialSymbol)
      case RecognizedKind.Ellipse:
        return IIRecognizedEllipse.create(partialSymbol)
      case RecognizedKind.Polygone:
        return IIRecognizedPolygon.create(partialSymbol)
      case RecognizedKind.Line:
        return IIRecognizedLine.create(partialSymbol)
      case RecognizedKind.PolyEdge:
        return IIRecognizedPolyLine.create(partialSymbol)
      default:
        throw new Error(`Unable to create recognized, symbol type '${ JSON.stringify(partialSymbol) } is unknown`)
    }
  }

  protected buildGroup(partialGroup: PartialDeep<IISymbolGroup>): IISymbolGroup
  {
    if (!partialGroup.children?.length) {
      throw new Error(`Unable to create group, no children`)
    }

    const children = partialGroup.children.map(partialSymbol =>
    {
      switch (partialSymbol?.type) {
        case SymbolType.Stroke:
          return IIStroke.create(partialSymbol as PartialDeep<IIStroke>)
        case SymbolType.Shape:
          return this.buildShape(partialSymbol as PartialDeep<TIIShape>)
        case SymbolType.Edge:
          return this.buildEdge(partialSymbol as PartialDeep<TIIEdge>)
        case SymbolType.Text:
          return IIText.create(partialSymbol as PartialDeep<IIText>)
        case SymbolType.Math:
          return IIMath.create(partialSymbol as PartialDeep<IIMath>)
        case SymbolType.Group:
          return this.buildGroup(partialSymbol as PartialDeep<IISymbolGroup>)
        case SymbolType.Recognized:
          return this.buildRecognized(partialSymbol as PartialDeep<TIIRecognized>)
        default:
          throw new Error(`Unable to create group, symbol type '${ JSON.stringify(partialSymbol) } is unknown`)
      }
    })
    const group = new IISymbolGroup(children, partialGroup.style)
    if (partialGroup.id) {
      group.id = partialGroup.id
    }
    if (partialGroup.decorators) {
      group.decorators = partialGroup.decorators.map(d => new IIDecorator(d!.kind!, d!.style as TStyle))
    }
    return group
  }

  protected buildStroke(partialSymbol: PartialDeep<IIStroke>): IIStroke
  {
    return IIStroke.create(partialSymbol as PartialDeep<IIStroke>)
  }

  protected buildStrokeText(partialSymbol: PartialDeep<IIRecognizedText>): IIRecognizedText
  {
    return IIRecognizedText.create(partialSymbol as PartialDeep<IIRecognizedText>)
  }

  protected buildText(partialSymbol: PartialDeep<IIText>): IIText
  {
    return IIText.create(partialSymbol as PartialDeep<IIText>)
  }

  protected buildMath(partialSymbol: PartialDeep<IIMath>): IIMath
  {
    return IIMath.create(partialSymbol as PartialDeep<IIMath>)
  }

  protected buildSymbol(partialSymbol: PartialDeep<TIISymbol>): TIISymbol
  {
    try {
      switch (partialSymbol.type) {
        case SymbolType.Stroke:
          return this.buildStroke(partialSymbol)
        case SymbolType.Shape:
          return this.buildShape(partialSymbol)
        case SymbolType.Edge:
          return this.buildEdge(partialSymbol)
        case SymbolType.Text:
          return this.buildText(partialSymbol)
        case SymbolType.Math:
          return this.buildMath(partialSymbol)
        case SymbolType.Group:
          return this.buildGroup(partialSymbol)
        case SymbolType.Recognized:
          return this.buildRecognized(partialSymbol as PartialDeep<TIIRecognized>)
        default:
          throw new Error(`Unable to build symbol, type: "${ partialSymbol.type }" is unknown`)
      }
    }
    catch (error) {
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Optimizes recognizer calls by comparing old and new strokes
   * and calling the most appropriate method (erase, add, or replace)
   * @param oldStrokes - Strokes before the change
   * @param newStrokes - Strokes after the change
   */
  #optimizeRecognizerCall(oldStrokes: IIStroke[], newStrokes: IIStroke[]): void
  {
    const oldStrokeIds = new Set(oldStrokes.map(s => s.id))
    const newStrokeIds = new Set(newStrokes.map(s => s.id))

    const addedStrokes = newStrokes.filter(s => !oldStrokeIds.has(s.id))
    const removedStrokeIds = oldStrokes.filter(s => !newStrokeIds.has(s.id)).map(s => s.id)

    if (removedStrokeIds.length > 0 && addedStrokes.length > 0) {
      this.recognizer.replaceStrokes(removedStrokeIds, addedStrokes)
    } else if (removedStrokeIds.length > 0) {
      this.recognizer.eraseStrokes(removedStrokeIds)
    } else if (addedStrokes.length > 0) {
      this.recognizer.addStrokes(addedStrokes, false)
    }
  }

  /**
   * Create a symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Promise resolving to created symbol
   */
  async createSymbol(partialSymbol: PartialDeep<TIISymbol>): Promise<TIISymbol>
  {
    try {
      return await this.addSymbol(this.buildSymbol(partialSymbol))
    }
    catch (error) {
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  /**
   * Create multiple symbols from partial data
   * @param partialSymbols - Array of partial symbol data
   * @returns Promise resolving to array of created symbols
   */
  async createSymbols(partialSymbols: PartialDeep<TIISymbol>[]): Promise<TIISymbol[]>
  {
    try {
      const errors: string[] = []
      const symbols: TIISymbol[] = []
      partialSymbols.forEach(partialSymbol =>
      {
        try {
          symbols.push(this.buildSymbol(partialSymbol))
        } catch (error) {
          errors.push(((error as Error).message || error) as string)
        }
      })
      if (errors.length) {
        throw new Error(errors.join("\n"))
      }
      return await this.addSymbols(symbols)
    } catch (error) {
      this.logger.error("createSymbols", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /** @hidden */
  protected updateTextBounds(symbol: TIISymbol): void
  {
    if (symbol.type === SymbolType.Text) {
      this.texter.updateBounds(symbol)
    }
    else if (symbol.type === SymbolType.Group) {
      symbol.extractText().forEach(t => this.texter.updateBounds(t))
    }
  }

  /** @hidden */
  async addSymbol(sym: TIISymbol, addToHistory = true): Promise<TIISymbol>
  {
    this.logger.info("addSymbol", { sym })
    this.updateLayerState(false)
    this.updateTextBounds(sym)
    this.model.addSymbol(sym)
    this.renderer.drawSymbol(sym)

    const strokes = this.extractStrokesFromSymbols([sym])
    this.recognizer.addStrokes(strokes, false)

    if (addToHistory) {
      this.history.push(this.model, { added: [sym] })
    }
    this.updateLayerUI()
    return sym
  }

  /**
   * Add multiple symbols to the model and renderer
   * @param symList - Array of symbols to add
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to array of added symbols
   */
  async addSymbols(symList: TIISymbol[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("addSymbol", { symList })
    this.updateLayerState(false)
    symList.forEach(s =>
    {
      this.updateTextBounds(s)
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    this.recognizer.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push(this.model, { added: symList })
    }
    this.updateLayerUI()
    return symList
  }

  /**
   * Update an existing symbol
   * @param sym - Symbol to update
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to updated symbol
   */
  async updateSymbol(sym: TIISymbol, addToHistory = true): Promise<TIISymbol>
  {
    this.logger.info("updateSymbol", { sym })
    this.updateLayerState(false)
    this.updateTextBounds(sym)

    const oldSymbol = this.history.stack.at(-1)?.model.symbols.find(s => s.id === sym.id) || this.model.symbols.find(s => s.id === sym.id)
    const oldStrokes = oldSymbol ? this.extractStrokesFromSymbols([oldSymbol]) : []

    this.model.updateSymbol(sym)
    this.renderer.drawSymbol(sym)

    const newStrokes = this.extractStrokesFromSymbols([sym])

    this.#optimizeRecognizerCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push(this.model, { updated: [sym] })
    }
    this.updateLayerUI()
    return sym
  }

  /**
   * Update multiple existing symbols
   * @param symList - Array of symbols to update
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to array of updated symbols
   */
  async updateSymbols(symList: TIISymbol[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("updateSymbol", { symList })
    this.updateLayerState(false)

    const oldSymbolsMap = new Map<string, TIISymbol>()
    symList.forEach(sym => {
      const oldSymbol = this.history.stack.at(-1)?.model.symbols.find(s => s.id === sym.id) || this.model.symbols.find(s => s.id === sym.id)
      if (oldSymbol) {
        oldSymbolsMap.set(sym.id, oldSymbol)
      }
    })
    const oldStrokes = this.extractStrokesFromSymbols(Array.from(oldSymbolsMap.values()))

    symList.forEach(s =>
    {
      this.updateTextBounds(s)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })

    const newStrokes = this.extractStrokesFromSymbols(symList)
    this.#optimizeRecognizerCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push(this.model, { updated: symList })
    }
    this.updateLayerUI()
    return symList
  }

  /**
   * Update style of multiple symbols
   * @param symbolIds - Array of symbol IDs to update
   * @param style - Partial style to apply
   * @param addToHistory - Whether to add to history (default: true)
   */
  updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>, addToHistory = true): void
  {
    this.logger.info("updateSymbolsStyle", { symbolIds, style })
    const symbols: TIISymbol[] = []
    this.model.symbols.forEach(s =>
    {
      if (symbolIds.includes(s.id)) {
        s.style = Object.assign({}, s.style, style)
        if (
          SymbolType.Text === s.type ||
          SymbolType.Group === s.type ||
          SymbolType.Recognized === s.type) {
          s.updateChildrenStyle()
        }
        this.renderer.drawSymbol(s)
        this.model.updateSymbol(s)
        s.modificationDate = Date.now()
        symbols.push(s)
      }
    })
    if (symbols.length) {
      symbols.forEach(s =>
      {
        if (s.type === SymbolType.Text) {
          const lastWidth = s.bounds.width
          this.texter.updateBounds(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            this.texter.moveTextAfter(s, tx)
          }
        }
      })
    }
    if (addToHistory && symbols.length) {
      this.history.push(this.model, { style: { symbols, style } })
    }
  }

  /**
   * Update font style of text symbols
   * @param textIds - Array of text symbol IDs
   * @param options - Font style options (fontSize, fontWeight)
   */
  updateTextFontStyle(textIds: string[], { fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" | "auto" }): void
  {
    this.logger.info("updateTextFontStyle", { textIds, fontSize, fontWeight })
    const symbols: (IIText | IISymbolGroup)[] = []
    const translate: { symbols: TIISymbol[], tx: number, ty: number }[] = []
    this.model.symbols.forEach(s =>
    {
      if (textIds.includes(s.id)) {
        if (s.type === SymbolType.Text) {
          s.updateChildrenFont({ fontSize, fontWeight: fontWeight === "auto" ? undefined : fontWeight })
          const lastWidth = s.bounds.width
          this.texter.updateBounds(s)
          this.renderer.drawSymbol(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            const symbolsTranslated = this.texter.moveTextAfter(s, tx)
            if (symbolsTranslated?.length) {
              translate.push({
                symbols: symbolsTranslated,
                tx,
                ty: 0
              })
            }
          }
          s.modificationDate = Date.now()
          symbols.push(s)
        }
        else if (s.type === SymbolType.Group) {
          const textChildren = s.extractText()
          if (textChildren.length) {
            textChildren.forEach(text =>
            {
              text.updateChildrenFont({ fontSize, fontWeight: fontWeight === "auto" ? undefined : fontWeight })
              const lastWidth = s.bounds.width
              this.texter.updateBounds(text)
              const tx = s.bounds.width - lastWidth
              const symbolsTranslated = this.texter.moveTextAfter(text, tx)
              if (symbolsTranslated?.length) {
                translate.push({
                  symbols: symbolsTranslated,
                  tx,
                  ty: 0
                })
              }
            })
            s.modificationDate = Date.now()
            this.renderer.drawSymbol(s)
            symbols.push(s)
          }

        }
      }
    })
    if (symbols.length) {
      this.history.push(this.model, { style: { symbols, fontSize }, translate })
    }
  }

  /**
   * Replace old symbols with new symbols
   * @param oldSymbols - Array of old symbols to be replaced
   * @param newSymbols - Array of new symbols to replace with
   * @param addToHistory - Whether to add this operation to history (default: true)
   */
  async replaceSymbols(oldSymbols: TIISymbol[], newSymbols: TIISymbol[], addToHistory = true): Promise<void>
  {
    this.logger.info("replaceSymbol", { oldSymbols, newSymbols })
    this.updateLayerState(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    const symToReplace = oldSymbols.shift()

    if (symToReplace) {
      oldSymbols.forEach(s =>
      {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

      this.model.replaceSymbol(symToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symToReplace.id, newSymbols)

      this.#optimizeRecognizerCall(oldStrokes, newStrokes)

      if (addToHistory) {
        this.history.push(this.model, { replaced: { oldSymbols, newSymbols } })
      }
      this.updateLayerUI()
    }
  }

  /**
   * Change the order of a symbol in the rendering stack
   * @param symbol - Symbol to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbol(symbol: TIISymbol, position: "first" | "last" | "forward" | "backward"): void
  {
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
    this.history.push(this.model, { order: { symbols: [symbol], position } })
  }

  /**
   * Change the order of multiple symbols in the rendering stack
   * @param symbols - Symbols to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbols(symbols: TIISymbol[], position: "first" | "last" | "forward" | "backward")
  {
    symbols.forEach(s =>
    {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push(this.model, { order: { symbols, position } })
  }

  /**
   * Group multiple symbols into a single group
   * @param symbols - Symbols to group
   * @returns The created group symbol
   */
  groupSymbols(symbols: TIISymbol[]): IISymbolGroup
  {
    const group = this.buildGroup({ children: symbols })
    symbols.forEach(s =>
    {
      this.model.removeSymbol(s.id)
      this.renderer.removeSymbol(s.id)
    })
    this.model.addSymbol(group)
    this.history.push(this.model, { group: { symbols } })
    return group
  }

  /**
   * Ungroup a symbol group into individual symbols
   * @param group - Group to ungroup
   * @returns Array of ungrouped symbols
   */
  ungroupSymbol(group: IISymbolGroup): TIISymbol[]
  {
    group.children.forEach(s => this.renderer.drawSymbol(s))
    this.renderer.removeSymbol(group.id)
    this.model.replaceSymbol(group.id, group.children)
    this.history.push(this.model, { ungroup: { group } })
    return group.children
  }

  /**
   * Synchronize strokes with JIIX export
   */
  async synchronizeStrokesWithJIIX(): Promise<void>
  {
    await this.synchronizer.synchronize()
  }

  /**
   * Remove a symbol from the model
   * @param id - ID of symbol to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbol is removed
   */
  async removeSymbol(id: string, addToHistory = true): Promise<void>
  {
    this.logger.info("removeSymbol", { id })
    const symbol = this.model.getRootSymbol(id)
    if (symbol) {
      this.updateLayerState(false)
      if (symbol.type === SymbolType.Group) {
        const groupStrokeIds = symbol.extractStrokes().map(s => s.id)
        symbol.removeChilds([id])
        if (symbol.children.length) {
          this.model.updateSymbol(symbol)
          this.renderer.drawSymbol(symbol)
          if (groupStrokeIds.includes(id)) {
            this.recognizer.eraseStrokes([id])
          }
        }
        else {
          this.recognizer.eraseStrokes(groupStrokeIds)
          this.model.removeSymbol(symbol.id)
          this.renderer.removeSymbol(symbol.id)
        }
      }
      else {
        this.recognizer.eraseStrokes([id])
        this.model.removeSymbol(symbol.id)
        this.renderer.removeSymbol(symbol.id)
      }
      if (addToHistory) {
        this.history.push(this.model, { erased: [symbol] })
      }
      this.updateLayerUI()
    }
    else {
      this.renderer.removeSymbol(id)
      this.recognizer.eraseStrokes([id])
    }
  }

  /**
   * Remove multiple symbols from the model
   * @param ids - Array of symbol IDs to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbols are removed
   */
  async removeSymbols(ids: string[], addToHistory = true): Promise<TIISymbol[]>
  {
    this.logger.info("removeSymbol", { ids })
    const symbolsToRemove: TIISymbol[] = []
    const symbolsToUpdate: TIISymbol[] = []
    const strokesIds: string[] = []
    ids.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym) {
        /** we remove root element */
        if (sym.id === id) {
          symbolsToRemove.push(sym)
          switch (sym.type) {
            case SymbolType.Stroke:
              strokesIds.push(sym.id)
              break
            case SymbolType.Recognized:
              strokesIds.push(...sym.strokes.map(s => s.id))
              break
            case SymbolType.Group:
              strokesIds.push(...sym.extractStrokes().map(s => s.id))
              break
          }
        }
        else {
          /** we want to remove child */
          switch (sym.type) {
            case SymbolType.Group: {
              const gr = sym.clone()
              strokesIds.push(...gr.extractStrokes().map(s => s.id).filter(id => ids.includes(id)))
              gr.removeChilds(ids)
              if (gr.children.length) {
                symbolsToUpdate.push(gr)
              }
              else {
                symbolsToRemove.push(gr)
              }
              break
            }
            case SymbolType.Recognized: {
              strokesIds.push(id)
              const ws = sym.clone()
              ws.removeStrokes(ids)
              if (ws.strokes.length) {
                ws.jiixId = undefined
                if (isMathSymbol(ws)) {
                  ws.variableValues = undefined
                  if (ws.solverOutputStrokeIds && ws.solverOutputStrokeIds.length > 0) {
                    const remainingIds = new Set(ws.strokes.map(s => s.id))
                    const updatedSolverIds = ws.solverOutputStrokeIds.filter(id => remainingIds.has(id))
                    ws.solverOutputStrokeIds = updatedSolverIds.length > 0 ? updatedSolverIds : undefined
                  }
                }
                symbolsToUpdate.push(ws)
              }
              else {
                symbolsToRemove.push(ws)
              }
              break
            }
          }

        }
      }
    })
    this.recognizer.eraseStrokes(strokesIds)
    symbolsToRemove.forEach(s =>
    {
      if (isMathSymbol(s)) {
        this.transientInk.clearTransientsForBlock(s.id)
      }

      this.model.removeSymbol(s.id)
      this.renderer.removeSymbol(s.id)
    })

    symbolsToUpdate.forEach(s =>
    {
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })


    if (addToHistory) {
      const changes: TIIHistoryChanges = {}
      if (symbolsToRemove.length || symbolsToUpdate.length) {
        if (symbolsToRemove.length) {
          changes.erased = symbolsToRemove
        }
        if (symbolsToUpdate.length) {
          changes.updated = symbolsToUpdate
        }
        this.history.push(this.model, changes)
        this.updateLayerUI()
      }
    }
    this.updateLayerState(false)
    return symbolsToRemove
  }

  /**
   * Select symbols by their IDs
   * @param ids - Array of symbol IDs to select
   */
  select(ids: string[]): void
  {
    this.selector.removeSelectedGroup()
    this.model.symbols.forEach(s =>
    {
      s.selected = ids.includes(s.id)
      this.renderer.drawSymbol(s)
    })
    this.selector.drawSelectedGroup(this.model.symbolsSelected)

    const selectedMathIds = this.model.symbolsSelected
      .filter(isMathSymbol)
      .map(s => s.id)
    this.mathInteractions.onSymbolSelect(selectedMathIds)

    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  /**
   * Select all symbols
   */
  selectAll(): void
  {
    this.selector.removeSelectedGroup()
    this.model.symbols.forEach(s =>
    {
      s.selected = true
      this.renderer.drawSymbol(s)
    })
    this.selector.drawSelectedGroup(this.model.symbolsSelected)

    const selectedMathIds = this.model.symbolsSelected
      .filter(isMathSymbol)
      .map(s => s.id)
    this.mathInteractions.onSymbolSelect(selectedMathIds)

    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  /**
   * Unselect all currently selected symbols
   */
  unselectAll(): void
  {
    if (this.model.symbolsSelected.length) {
      this.model.symbolsSelected.forEach(s =>
      {
        s.selected = false
        this.renderer.drawSymbol(s)
      })
      this.selector.removeSelectedGroup()
      this.updateLayerUI()

      this.mathInteractions.onSymbolSelect([])
      this.event.emitSelected(this.model.symbolsSelected)
    }
  }

  /**
   * Import strokes from point events
   * @param partialStrokes - Array of partial stroke data
   * @returns Promise resolving to updated model
   */
  async importPointEvents(partialStrokes: PartialDeep<IIStroke>[]): Promise<IIModel>
  {
    this.logger.info("importPointEvents", { partialStrokes })
    this.updateLayerState(false)
    const strokes = convertPartialStrokesToOIStrokes(partialStrokes)
    strokes.forEach(s =>
    {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    this.recognizer.addStrokes(strokes, false)
    this.history.push(this.model, { added: strokes })
    this.logger.debug("importPointEvents", this.model)
    this.updateLayerUI()
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  protected triggerDownload(fileName: string, urlData: string): void
  {
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", urlData)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  /**
   * Get bounding box for a list of symbols
   * @param symbols - Symbols to calculate bounds for
   * @param margin - Margin to add around bounds (default: SELECTION_MARGIN)
   * @returns Bounding box containing all symbols
   */
  getSymbolsBounds(symbols: TIISymbol[], margin: number = SELECTION_MARGIN): Box
  {
    const box = Box.createFromBoxes(symbols.map(s => s.bounds))
    box.x -= margin
    box.y -= margin
    box.width += margin * 2
    box.height += margin * 2
    return box
  }

  protected buildBlobFromSymbols(symbols: TIISymbol[], box: Box): Blob
  {
    const svgNode = SVGBuilder.createLayer(box)
    symbols.forEach(s =>
    {
      const el = this.renderer.getElementById(s.id)?.cloneNode(true)
      if (el) {
        svgNode.appendChild(el)
      }
    })

    const svgString = (new XMLSerializer()).serializeToString(svgNode)

    return new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8"
    })
  }

  protected getExportName(extension: string): string
  {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }
    try {
      return `iink-ts-${ new Date().toLocaleDateString(navigator.language, options) }.${ extension }`
    }
    catch {
      return `iink-ts-${ new Date().toLocaleDateString("en-US", options) }.${ extension }`
    }
  }

  /**
   * Download symbols as SVG file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsSVG(selection = false)
  {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)
    const url = URL.createObjectURL(svgBlob)
    this.triggerDownload(this.getExportName("svg"), url)
  }

  /**
   * Download symbols as PNG file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsPNG(selection = false)
  {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)

    const url = URL.createObjectURL(svgBlob)
    const image = new Image(box.width, box.height)
    image.src = url
    image.onload = () =>
    {
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height

      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.drawImage(image, 0, 0)
      URL.revokeObjectURL(url)

      const imgURI = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream")

      this.triggerDownload(this.getExportName("png"), imgURI)
    }
  }

  /**
   * Download symbols as JSON file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsJson(selection = false)
  {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols

    const clonedSymbols = symbolsToExport.map(s => s.clone())
    const filteredSymbols = this.filterSymbolsForExport(clonedSymbols)

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSymbols, null, 2))
    this.triggerDownload(this.getExportName("json"), dataStr)
  }

  /**
   * Download symbols as plain text file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsText(selection = false)
  {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols
    const text = this.extractTextFromSymbols(symbolsToExport)
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    this.triggerDownload(this.getExportName("txt"), dataStr)
  }

  protected extractTextFromSymbols(symbols: TIISymbol[]): string
  {
    const textParts: string[] = []

    symbols.forEach(s => {
      if (s.type === SymbolType.Recognized && s.kind === RecognizedKind.Text) {
        const recognizedText = s as IIRecognizedText
        if (recognizedText.label) {
          textParts.push(recognizedText.label)
        }
      } else if (s.type === SymbolType.Text) {
        const text = s as IIText
        const textContent = text.label
        if (textContent) {
          textParts.push(textContent)
        }
      } else if (s.type === SymbolType.Group) {
        const group = s as IISymbolGroup
        const groupText = this.extractTextFromSymbols(group.children)
        if (groupText) {
          textParts.push(groupText)
        }
      }
    })

    return textParts.join("\n")
  }

  protected filterSymbolsForExport(symbols: TIISymbol[]): TIISymbol[]
  {
    const result: TIISymbol[] = []

    symbols.forEach(s => {
      if (s.type === SymbolType.Stroke || s.type === SymbolType.Shape || s.type === SymbolType.Edge) {
        result.push(s)
      }
      else if (s.type === SymbolType.Recognized) {
        const recognized = s as TIIRecognized
        const strokes = recognized.strokes.map((stroke: IIStroke) => stroke.clone())
        result.push(...strokes)
      }
      else if (s.type === SymbolType.Group) {
        const group = s as IISymbolGroup
        group.children = this.filterSymbolsForExport(group.children)
        if (group.children.length > 0) {
          result.push(group)
        }
      }
    })

    return result
  }

  /**
   * Extract all strokes from symbols recursively
   * @param symbols - Symbols to extract strokes from
   * @returns Array of extracted strokes
   */
  extractStrokesFromSymbols(symbols: TIISymbol[] | undefined): IIStroke[]
  {
    if (!symbols?.length) return []
    const strokes: IIStroke[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Stroke:
          strokes.push(s)
          break
        case SymbolType.Recognized:
          strokes.push(...s.strokes)
          break
        case SymbolType.Group:
          strokes.push(...s.extractStrokes())
          break
      }
    })
    return strokes
  }

  /**
   * Extract all text symbols recursively
   * @param symbols - Symbols to extract texts from
   * @returns Array of extracted text symbols
   */
  extractTextsFromSymbols(symbols: TIISymbol[] | undefined): IIText[]
  {
    if (!symbols?.length) return []
    const texts: IIText[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Text:
          texts.push(s)
          break
        case SymbolType.Group:
          texts.push(...s.extractText())
          break
      }
    })
    return texts
  }

  /**
   * Extract all math symbols recursively
   * @param symbols - Symbols to extract maths from
   * @returns Array of extracted math symbols
   */
  extractMathsFromSymbols(symbols: TIISymbol[] | undefined): IIMath[]
  {
    if (!symbols?.length) return []
    const maths: IIMath[] = []
    symbols.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Math:
          maths.push(s)
          break
        case SymbolType.Group:
          maths.push(...s.extractMath())
          break
      }
    })
    return maths
  }

  protected extractBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges
  {
    const backendChanges: TIIHistoryBackendChanges = {}
    backendChanges.added = this.extractStrokesFromSymbols(changes.added)
    backendChanges.erased = this.extractStrokesFromSymbols(changes.erased)

    const updated = this.extractStrokesFromSymbols(changes.updated)

    const oldStrokes = updated.concat(this.extractStrokesFromSymbols(changes.replaced?.oldSymbols))
    const newStrokes = updated.concat(this.extractStrokesFromSymbols(changes.replaced?.newSymbols))
    if (oldStrokes.length && newStrokes.length) {
      backendChanges.replaced = {
        oldStrokes,
        newStrokes
      }
    }
    else {
      backendChanges.added.push(...newStrokes)
      backendChanges.erased.push(...oldStrokes)
    }

    if (changes.matrix) {
      backendChanges.matrix = {
        strokes: this.extractStrokesFromSymbols(changes.matrix.symbols),
        matrix: changes.matrix.matrix,
      }
    }

    if (changes.translate?.length) {
      backendChanges.translate = []
      changes.translate.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.translate!.push({
            strokes,
            tx: tr.tx,
            ty: tr.ty
          })
        }
      })
    }
    if (changes.scale?.length) {
      backendChanges.scale = []
      changes.scale.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.scale!.push({
            strokes,
            origin: tr.origin,
            scaleX: tr.scaleX,
            scaleY: tr.scaleY
          })
        }
      })
    }
    if (changes.rotate?.length) {
      backendChanges.rotate = []
      changes.rotate.forEach(tr =>
      {
        const strokes = this.extractStrokesFromSymbols(tr.symbols)
        if (strokes.length) {
          backendChanges.rotate!.push({
            strokes,
            center: tr.center,
            angle: tr.angle
          })
        }
      })
    }
    return backendChanges
  }

  protected handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return
    }

    if ((event.ctrlKey || event.metaKey) && this.#tool !== EditorTool.Move && !this.#toolBeforeCtrl) {
      this.logger.debug("handleKeyDown", "Switching to Move mode")
      this.#toolBeforeCtrl = this.#tool
      this.tool = EditorTool.Move
    }
  }

  protected handleWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      const zoomIntensity = 0.001
      const zoom = this.renderer.getZoom() * Math.exp(-event.deltaY * zoomIntensity)
      const rect = this.layers.root.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const offsetY = event.clientY - rect.top
      this.renderer.setZoom(zoom, offsetX, offsetY)
      this.menu.action.update()
    }
  }

  protected handleKeyUp = (event: KeyboardEvent): void => {
    if (!event.ctrlKey && !event.metaKey && this.#toolBeforeCtrl) {
      this.logger.debug("handleKeyUp", "Restoring previous tool")
      this.tool = this.#toolBeforeCtrl
      this.#toolBeforeCtrl = undefined
    }
  }

  /**
   * Undo the last action
   * @returns Promise resolving to updated model
   */
  async undo(): Promise<IIModel>
  {
    this.logger.info("undo")
    if (this.history.context.canUndo) {
      this.updateLayerState(false)
      this.unselectAll()
      const previousStackItem = this.history.undo()
      const modifications = previousStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = previousStackItem.model.clone()
      this.logger.debug("undo", { previousStackItem })
      const actionsToBackend = this.extractBackendChanges(previousStackItem.changes)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced ||
        actionsToBackend.matrix ||
        actionsToBackend.translate?.length ||
        actionsToBackend.scale?.length ||
        actionsToBackend.rotate?.length
      ) {
        await this.recognizer.undo(actionsToBackend)
      }
      this.updateLayerUI()
    }
    return this.model
  }

  /**
   * Redo the previously undone action
   * @returns Promise resolving to updated model
   */
  async redo(): Promise<IIModel>
  {
    this.logger.info("redo")

    if (this.history.context.canRedo) {
      this.updateLayerState(false)
      this.unselectAll()
      const nextStackItem = this.history.redo()
      const modifications = nextStackItem.model.extractDifferenceSymbols(this.model)
      this.#model = nextStackItem.model.clone()
      this.logger.debug("redo", { modifications })
      const actionsToBackend = this.extractBackendChanges(nextStackItem.changes)
      modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
      modifications.added.forEach(s => this.renderer.drawSymbol(s))
      if (
        actionsToBackend.added?.length ||
        actionsToBackend.erased?.length ||
        actionsToBackend.replaced ||
        actionsToBackend.matrix ||
        actionsToBackend.translate?.length ||
        actionsToBackend.scale?.length ||
        actionsToBackend.rotate?.length
      ) {
        await this.recognizer.redo(actionsToBackend)
      }

      this.updateLayerUI()
    }
    return this.model
  }

  /**
   * Export content to specified MIME types
   * @param mimeTypes - Array of MIME types to export
   * @returns Promise resolving to updated model with exports
   */
  async export(mimeTypes?: string[]): Promise<IIModel>
  {
    try {
      this.logger.info("export", { mimeTypes })
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
    }
    catch (error) {
      this.logger.error("export", { error })
      this.manageError(error as Error)
      throw error
    }
    return this.model
  }

  /**
   * Convert all symbols
   * @returns Promise that resolves when conversion is complete
   */
  async convert(): Promise<void>
  {
    await this.convertSymbols()
  }

  /**
   * Convert specific symbols
   * @param symbols - Symbols to convert (defaults to all symbols)
   * @returns Promise that resolves when conversion is complete
   */
  async convertSymbols(symbols?: TIISymbol[]): Promise<void>
  {
    try {
      this.updateLayerState(false)
      await this.converter.apply(symbols)
      this.event.emitConverted(this.model.converts as TExport)
    }
    catch (error) {
      this.logger.error("convert", error)
      this.manageError(error as Error)
      throw error
    }
    finally {
      this.updateLayerUI()
    }
  }

  /**
   * Wait for the recognizer to become idle
   * @returns Promise that resolves when idle
   */
  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  /**
   * Resize the editor
   * @param dimensions - New height and/or width
   * @returns Promise that resolves when resize is complete
   */
  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void>
  {
    try {
      this.logger.info("resize", { height, width })
      const compStyles = window.getComputedStyle(this.layers.root)
      height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
      width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)

      this.updateLayerState(false)
      this.model.height = height
      this.model.width = width
      this.renderer.resize(height, width)
      this.updateLayerUI(50)
      this.updateLayerState(true)
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  /**
   * Clear all content from the editor
   * @returns Promise that resolves when cleared
   */
  async clear(): Promise<void>
  {
    try {
      this.logger.info("clear")
      this.updateLayerState(false)
      if (this.model.symbols.length) {
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.transientInk.clearAll()
        this.history.push(this.model, { erased })
        this.recognizer.clear()
        this.event.emitSelected(this.model.symbolsSelected)
      }
      this.updateLayerUI()
      this.event.emitCleared()
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  /**
   * Find a math symbol by its JIIX ID
   * @param jiixId - JIIX ID to search for
   * @returns Math symbol if found, undefined otherwise
   * @group MathSolver
   */
  findMathSymbolByJiixId(jiixId: string): IIRecognizedMath | undefined
  {
    return this.model.symbols.find(s =>
      isMathSymbol(s) && s.jiixId === jiixId
    ) as IIRecognizedMath | undefined
  }

  /**
   * Clear solver output strokes from a math symbol
   * @param mathSymbol - The math symbol to clear solver outputs from
   * @returns Promise that resolves when strokes are removed
   * @group MathSolver
   */
  async clearSolverOutputStrokes(mathSymbol: IIRecognizedMath): Promise<void>
  {
    if (mathSymbol.solverOutputStrokeIds && mathSymbol.solverOutputStrokeIds.length > 0) {
      this.logger.info("clearSolverOutputStrokes", `Removing ${mathSymbol.solverOutputStrokeIds.length} solver output strokes from ${mathSymbol.jiixId}`)
      this.transientInk.clearTransientsForBlock(mathSymbol.id)
      await this.removeSymbols(mathSymbol.solverOutputStrokeIds, false)
      mathSymbol.strokes = mathSymbol.strokes.filter(s => !mathSymbol.solverOutputStrokeIds!.includes(s.id))
      mathSymbol.solverOutputStrokeIds = undefined
      mathSymbol.computedResult = undefined
      await this.model.updateSymbol(mathSymbol)
    }
  }

  /**
   * Get available math solver actions for a specific math element
   * @param blockId - The ID of the math element (jiixId)
   * @returns Promise with array of available actions
   * @group MathSolver
   */
  async getAvailableActions(blockId: string): Promise<string[]>
  {
    try {
      this.logger.info("getAvailableActions", { blockId })
      return await this.recognizer.getAvailableActions(blockId)
    }
    catch (error) {
      this.logger.error("getAvailableActions", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get diagnostic result for a specific math task
   * @param blockId - The ID of the math element (jiixId)
   * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
   * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
   * @group MathSolver
   */
  async getDiagnostic(blockId: string, task: string): Promise<string>
  {
    try {
      this.logger.info("getDiagnostic", { blockId, task })
      return await this.recognizer.getDiagnostic(blockId, task)
    }
    catch (error) {
      this.logger.error("getDiagnostic", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get numerical computation result for a math expression
   * @param blockId - The ID of the math element (jiixId)
   * @returns Promise with JIIX export containing the computed result
   * @group MathSolver
   */
  async getNumericalComputation(blockId: string): Promise<TJIIXMathElement>
  {
    try {
      this.logger.info("getNumericalComputation", { blockId })
      return await this.recognizer.getNumericalComputation(blockId)
    }
    catch (error) {
      this.logger.error("getNumericalComputation", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Compute numerical result for a math symbol
   * @param mathSymbol - The math symbol to compute
   * @param mode - Computation mode: "value-only" (just get result), "strokes-only" (just draw), or "both" (default)
   * @returns Promise with the computation result, number of added strokes, and optional numeric value
   * @group MathSolver
   */
  async computeMathNumericalResult(
    mathSymbol: IIRecognizedMath,
    mode: "value-only" | "strokes-only" | "both" = "both"
  ): Promise<{ result: TJIIXMathElement, addedStrokesCount: number, value?: number }>
  {
    try {
      this.logger.info("computeMathNumericalResult", { mathSymbol: mathSymbol.id, mode })

      if (!mathSymbol.jiixId) {
        throw new Error("Math symbol does not have jiixId")
      }

      if (mode === "strokes-only" || mode === "both") {
        await this.clearSolverOutputStrokes(mathSymbol)
      }

      const result = await this.getNumericalComputation(mathSymbol.jiixId)
      this.logger.info("Numerical computation completed successfully", result)

      let addedStrokesCount = 0

      if (mode === "strokes-only" || mode === "both") {
        const addedStrokes = await this.addSolverOutputStrokes(result, mathSymbol)
        addedStrokesCount = addedStrokes.length
        this.logger.info(`Added ${addedStrokesCount} solver output strokes`)
      }

      let value: number | undefined
      if (mode === "value-only" || mode === "both") {
        if (result.expressions && Array.isArray(result.expressions)) {
          const equalExpression = result.expressions.find(expr =>
            expr.type === "=" && "value" in expr && typeof (expr as { value?: unknown }).value === "number"
          )
          if (equalExpression && "value" in equalExpression) {
            value = (equalExpression as { value: number }).value
            this.logger.info("Extracted numerical value", { value })

            mathSymbol.computedResult = value
            await this.model.updateSymbol(mathSymbol)
          }
        }
      }

      return { result, addedStrokesCount, value }
    }
    catch (error) {
      this.logger.error("computeMathNumericalResult", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get variables from a math expression
   * @param blockId - The ID of the math element (jiixId)
   * @returns Promise with array of variables
   * @group MathSolver
   */
  async getVariables(blockId: string): Promise<TMathVariable[]>
  {
    try {
      if (!blockId) {
        this.logger.warn("getVariables", "blockId is empty or undefined, returning empty array")
        return []
      }
      this.logger.info("getVariables", { blockId })
      return await this.recognizer.getVariables(blockId)
    }
    catch (error) {
      this.logger.error("getVariables", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get available math solver actions for a specific math element
   * @param blockId - The ID of the math element (jiixId)
   * @returns Promise with the value of the variable
   * @group MathSolver
   */
  async getVariableValue(blockId: string, variableName: string): Promise<number>
  {
    try {
      this.logger.info("getVariableValue", { blockId, variableName })
      return await this.recognizer.getVariableValue(blockId, variableName)
    }
    catch (error) {
      this.logger.error("getVariableValue", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Set value for a specific variable in a math expression
   * @param blockId - The ID of the math element (jiixId)
   * @param variableName - Name of the variable to set
   * @param variableValue - Value to assign to the variable
   * @param mathSymbol - Optional math symbol (will be found if not provided)
   * @returns Promise that resolves when the variable is set
   * @group MathSolver
   */
  async setVariableValue(blockId: string, variableName: string, variableValue: number, mathSymbol?: IIRecognizedMath): Promise<void>
  {
    try {
      this.logger.info("setVariableValue", { blockId, variableName, variableValue })

      let symbol = mathSymbol
      if (!symbol) {
        symbol = this.findMathSymbolByJiixId(blockId)
      }

      if (symbol) {
        await this.clearSolverOutputStrokes(symbol)
      }

      await this.recognizer.setVariableValue(blockId, variableName, variableValue)
      if (symbol) {
        if (!symbol.variableValues) {
          symbol.variableValues = {}
        }
        symbol.variableValues[variableName] = variableValue
        await this.model.updateSymbol(symbol)
      }

      this.logger.info("setVariableValue", `Variable value changed, recalculating dependent blocks for ${blockId}`)
      await this.recalculateDependentBlocks(blockId)
    }
    catch (error) {
      this.logger.error("setVariableValue", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Set multiple variable values for a math symbol
   * @param mathSymbol - The math symbol to update
   * @param variableValues - Object with variable names as keys and their values
   * @returns Promise that resolves when all variables are set
   * @group MathSolver
   */
  async setMathVariables(mathSymbol: IIRecognizedMath, variableValues: { [name: string]: number }): Promise<void>
  {
    try {
      this.logger.info("setMathVariables", { mathSymbol: mathSymbol.id, variableValues })

      if (!mathSymbol.jiixId) {
        throw new Error("Math symbol does not have jiixId")
      }

      for (const [variableName, variableValue] of Object.entries(variableValues)) {
        await this.setVariableValue(mathSymbol.jiixId, variableName, variableValue, mathSymbol)
      }

      await this.model.updateSymbol(mathSymbol)

      this.selector.resetSelectedGroup([mathSymbol])
    }
    catch (error) {
      this.logger.error("setMathVariables", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get evaluables from a math expression
   * @param blockId - The ID of the math element (jiixId)
   * @returns Promise with array of evaluables
   * @group MathSolver
   */
  async getEvaluables(blockId: string): Promise<TMathEvaluable[]>
  {
    try {
      this.logger.info("getEvaluables", { blockId })
      return await this.recognizer.getEvaluables(blockId)
    }
    catch (error) {
      this.logger.error("getEvaluables", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Evaluate a math function for a range of input values
   * @param blockId - The ID of the math element (jiixId)
   * @param evaluation - Evaluation parameters (input/output variables, range, point count)
   * @returns Promise with array of objects { inputVar: value, outputVar: value }
   * @group MathSolver
   */
  async evaluate(blockId: string, evaluation: {
    inputVariableName: string,
    outputVariableName: string,
    from: number,
    to: number,
    pointCount: number
  }): Promise<{ [key: string]: number }[][]>
  {
    try {
      this.logger.info("evaluate", { blockId, evaluation })
      return await this.recognizer.evaluate(blockId, evaluation)
    }
    catch (error) {
      this.logger.error("evaluate", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Evaluate a math function for a math symbol
   * @param mathSymbol - The math symbol containing the function
   * @param evaluation - Evaluation parameters
   * @returns Promise with evaluation points
   * @group MathSolver
   */
  async evaluateMathFunction(
    mathSymbol: IIRecognizedMath,
    evaluation: {
      inputVariableName: string,
      outputVariableName: string,
      from: number,
      to: number,
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]>
  {
    try {
      this.logger.info("evaluateMathFunction", { mathSymbol: mathSymbol.id, evaluation })

      if (!mathSymbol.jiixId) {
        throw new Error("Math symbol does not have jiixId")
      }

      const series = await this.evaluate(mathSymbol.jiixId, evaluation)
      this.logger.info("Function evaluated successfully", {
        seriesCount: series.length,
        totalPoints: series.reduce((sum, s) => sum + s.length, 0)
      })

      return series
    }
    catch (error) {
      this.logger.error("evaluateMathFunction", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Extract solver output strokes from a JIIX export result
   * Recursively searches for solver-output items and extracts their stroke data
   * @param obj - The JIIX export object to search
   * @returns Array of stroke data with X, Y coordinates and optional F (force) and T (time)
   * @group MathSolver
   */
  protected extractSolverOutputStrokes(obj: unknown): Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>
  {
    const strokes: Array<{ X: number[], Y: number[], F?: number[], T?: number[] }> = []

    if (!obj || typeof obj !== "object") {
      return strokes
    }

    const objRecord = obj as Record<string, unknown>

    if (objRecord["type"] === "number" && objRecord["solver-output"] === true && objRecord.items && Array.isArray(objRecord.items)) {
      strokes.push(...objRecord.items as Array<{ X: number[], Y: number[], F?: number[], T?: number[] }>)
    }

    if (objRecord.operands && Array.isArray(objRecord.operands)) {
      objRecord.operands.forEach((operand: unknown) =>
      {
        if (operand) {
          strokes.push(...this.extractSolverOutputStrokes(operand))
        }
      })
    }

    if (objRecord.expressions && Array.isArray(objRecord.expressions)) {
      objRecord.expressions.forEach((expr: unknown) =>
      {
        if (expr) {
          strokes.push(...this.extractSolverOutputStrokes(expr))
        }
      })
    }

    return strokes
  }

  /**
   * Add solver output strokes to a math symbol
   * @param result - JIIX math result containing solver output
   * @param mathSymbol - Math symbol to add strokes to
   * @param style - Optional style for the strokes
   * @returns Promise resolving to array of added strokes
   * @group MathSolver
   */
  async addSolverOutputStrokes(result: TJIIXMathElement, mathSymbol: IIRecognizedMath, style?: TStyle): Promise<IIStroke[]>
  {
    try {
      this.logger.info("addSolverOutputStrokes", { result })

      const solverStrokes = this.extractSolverOutputStrokes(result)
      this.logger.debug("addSolverOutputStrokes", `Found ${solverStrokes.length} solver output strokes`)

      const addedStrokes: IIStroke[] = []
      const defaultStyle = style || { color: "#4caf50", width: 5 } // Green color for solver output

      for (const strokeData of solverStrokes) {
        if (!strokeData.X || !strokeData.Y) {
          this.logger.warn("addSolverOutputStrokes", "Stroke data missing X or Y coordinates")
          continue
        }

        const pointers = strokeData.X.map((x: number, i: number) => ({
          x: convertMillimeterToPixel(x),
          y: convertMillimeterToPixel(strokeData.Y[i]),
          p: strokeData.F?.[i] || 1,
          t: strokeData.T?.[i] || i
        }))

        const stroke = IIStroke.create({
          pointers,
          style: defaultStyle
        })

        await this.addSymbol(stroke)
        addedStrokes.push(stroke)
        this.logger.debug("addSolverOutputStrokes", "Added solver output stroke:", stroke.id)
      }

      if (addedStrokes.length > 0) {
        mathSymbol.solverOutputStrokeIds = addedStrokes.map(s => s.id)
        addedStrokes.forEach(stroke => {
          this.transientInk.addTransientSymbol(mathSymbol.id, stroke.id)
        })

        await this.model.updateSymbol(mathSymbol)
      }

      return addedStrokes
    }
    catch (error) {
      this.logger.error("addSolverOutputStrokes", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Recalculate all blocks that depend on a source block
   * @param sourceBlockId - ID of the source block whose value changed
   * @returns Promise that resolves when all dependents are recalculated
   * @group MathSolver
   */
  async recalculateDependentBlocks(sourceBlockId: string): Promise<void>
  {
    try {
      this.logger.info("recalculateDependentBlocks", { sourceBlockId })

      const sourceMathSymbol = this.findMathSymbolByJiixId(sourceBlockId)

      if (!sourceMathSymbol) {
        this.logger.warn("recalculateDependentBlocks", `Source block not found: ${sourceBlockId}`)
        return
      }

      if (!sourceMathSymbol.dependentBlocks || sourceMathSymbol.dependentBlocks.length === 0) {
        this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
        return
      }

      this.logger.info("recalculateDependentBlocks", `Found ${sourceMathSymbol.dependentBlocks.length} dependent blocks`)

      for (const dependentBlockId of sourceMathSymbol.dependentBlocks) {
        const dependentMathSymbol = this.findMathSymbolByJiixId(dependentBlockId)

        if (!dependentMathSymbol) {
          this.logger.warn("recalculateDependentBlocks", `Dependent block not found: ${dependentBlockId}`)
          continue
        }

        try {
          this.logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
          await this.computeMathNumericalResult(dependentMathSymbol)
        }
        catch (computeError) {
          this.logger.error("recalculateDependentBlocks", `Error computing ${dependentBlockId}:`, computeError)
        }
      }

      this.logger.info("recalculateDependentBlocks", "All dependent blocks recalculated")
      this.event.emitChanged(this.history.context)
    }
    catch (error) {
      this.logger.error("recalculateDependentBlocks", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get all dependencies for a math block
   * Returns information about which variables this block uses and from where,
   * and which other blocks depend on this block's variables
   * @param blockId - The JIIX ID of the math block
   * @returns Object containing variable sources and dependent blocks
   * @group MathSolver
   */
  getMathDependencies(blockId: string): { variableSources?: { [variableName: string]: string }, dependentBlocks?: string[] } | null
  {
    const mathSymbol = this.findMathSymbolByJiixId(blockId)

    if (!mathSymbol) {
      this.logger.warn("getMathDependencies", `Math symbol not found for blockId: ${blockId}`)
      return null
    }

    return {
      variableSources: mathSymbol.variableSources,
      dependentBlocks: mathSymbol.dependentBlocks
    }
  }

  /**
   * Destroy the editor and clean up resources
   * @returns Promise that resolves when destruction is complete
   */
  async destroy(): Promise<void>
  {
    this.logger.info("destroy")

    window.removeEventListener("keydown", this.handleKeyDown)
    window.removeEventListener("keyup", this.handleKeyUp)

    this.layers.root.classList.remove("draw")
    this.layers.root.classList.remove("erase")
    this.layers.root.classList.remove("select")
    this.layers.root.classList.remove("move")

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()

    this.renderer.destroy()
    this.layers.destroy()
    this.menu.destroy()
    this.recognizer.destroy()
    this.model.clear()
    this.history.clear()
    return Promise.resolve()
  }
}
