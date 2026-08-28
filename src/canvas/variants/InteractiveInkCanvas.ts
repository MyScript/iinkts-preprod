import { RafCoalescer } from "@/browser"
import type { TCanvasOperationLabel, TCanvasOptionsBase } from "@/canvas/AbstractCanvas"
import { AbstractCanvas, GESTURE_OPERATION_LABELS } from "@/canvas/AbstractCanvas"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { WebSocketClient } from "@/client"
import { DOMFactory } from "@/components/dom"
import { CanvasTool, SELECTION_MARGIN } from "@/Constants"
import type { TBox } from "@/core/geometry"
import { BoxOps } from "@/core/geometry"
import { OBBOps } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { createUUID, mergeDeep } from "@/core/std"
import type { THistoryContext, TIIHistoryBackendChanges, TIIHistoryChanges } from "@/history"
import { extractIIBackendChanges, IIHistoryManager } from "@/history"
import type { TDownloadFormat, TExportFormat, TExportOptions, TExportResultMap, TPDFDownloadOptions } from "@/manager"
import {
  EraseManager,
  IIConnectorManager,
  IIConversionManager,
  IIExportManager,
  IIGestureManager,
  IIJiixQueryManager,
  IIKeyboardManager,
  IIMathManager,
  IIMoveManager,
  IIOverlayManager,
  IIPlaybackManager,
  IISelectionManager,
  IISnapManager,
  IISynchronizerManager,
  IITransformManager,
  IITypesetManager,
  IIWriterManager,
  PDFExportManager,
} from "@/manager"
import type { IIMenuAction, IIMenuStyle, IIMenuTool } from "@/menu"
import { IIMenuManager } from "@/menu"
import type { TExport } from "@/model"
import { IIModel } from "@/model"
import type { TIIRendererConfiguration } from "@/renderer"
import { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TDecorator, TMath, TStroke, TSymbol, TText } from "@/symbol"
import type { TBaseSymbol } from "@/symbol"
import {
  cloneSymbol,
  extractStrokes,
  isDecorator,
  isMath,
  isStroke,
  isStrokeSolverOutput,
  isText,
  StrokeOps,
} from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import { EdgeOps } from "@/symbol/edge/Edge"
import { TextOps } from "@/symbol/text/Text"
import { createSymbolFromPartial, createSymbolsFromPartial, registerBuiltinSymbolUtils } from "@/symbol-utils"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"
import type { SymbolUtil } from "@/symbol-utils/SymbolUtil"
import { MatrixTransform } from "@/transform"

import type { TInteractiveInkCanvasConfiguration } from "./InteractiveInkCanvasConfiguration"
import { InteractiveInkCanvasConfiguration } from "./InteractiveInkCanvasConfiguration"

/**
 * @group Canvas
 */
export type TInteractiveInkCanvasOptions = TPartialDeep<
  TCanvasOptionsBase & {
    configuration: TInteractiveInkCanvasConfiguration
  }
> & {
  override?: {
    client?: WebSocketClient
    menu?: {
      style?: IIMenuStyle
      tool?: IIMenuTool
      action?: IIMenuAction
    }
  }
}

/**
 * @group Canvas
 */
export class InteractiveInkCanvas extends AbstractCanvas implements TInteractiveInkCanvas {
  static readonly PASTE_OFFSET = 20
  static readonly ZOOM_FIT_MARGIN = 40

  #configuration: InteractiveInkCanvasConfiguration
  #model: IIModel
  #tool: CanvasTool = CanvasTool.Write
  #readOnly = false
  #layerUITimer?: ReturnType<typeof setTimeout>
  #recognizeStrokeTimer?: ReturnType<typeof setTimeout>
  #exportRetryTimer?: ReturnType<typeof setTimeout>
  #pendingExportRetry?: Promise<TExport>
  #pendingExportRetryMimeTypes = new Set<string>()
  static readonly EXPORT_RETRY_DEBOUNCE_MS = 300
  #clipboard: TSymbol[] = []
  #renderedWidth = 0
  #renderedHeight = 0
  #wheelZoomCoalescer = new RafCoalescer()
  #pendingWheelDeltaY = 0
  #pendingWheelOffset?: { x: number; y: number }

  /** SVG renderer responsible for drawing symbols onto the canvas layer. */
  renderer: SVGRenderer
  /** WebSocket client handling real-time communication with the MyScript backend. */
  client: WebSocketClient

  #penStyle: TStyle

  /** Manages undo/redo history stack for all symbol changes. */
  history: IIHistoryManager
  /** Handles ink input: captures pointer events and creates strokes. */
  writer: IIWriterManager
  /** Handles keyboard shortcuts and hotkey-based tool switching. */
  keyboard: IIKeyboardManager
  /** Handles erasing strokes and symbols via pointer interaction. */
  eraser: EraseManager
  /** Builds print-only DOM/CSS layers and drives PDF export via native browser print. */
  pdfExport: PDFExportManager
  /** Detects and processes touch/pointer gestures (scratch-out, join, insert, etc.). */
  gesture: IIGestureManager
  /** Orchestrates translate, resize, and rotation transforms on selected symbols. */
  transform: IITransformManager
  /** Converts ink strokes to recognized text, math, or shape symbols. */
  converter: IIConversionManager
  /** Manages text and math symbol layout: bounds computation and reflow after edits. */
  typeset: IITypesetManager
  /** Handles symbol selection, selection group rendering, and hit-testing. */
  selector: IISelectionManager
  /** Manages all visual overlays: math/text block indicators, debug visualizations. */
  overlays: IIOverlayManager
  /** Manages snapping behavior for symbols during move/resize operations. */
  snaps: IISnapManager
  /** Handles canvas panning when the Move tool is active. */
  move: IIMoveManager
  /** Synchronizes the local model with the JIIX export from the backend client. */
  synchronizer: IISynchronizerManager
  /** Queries and maps JIIX data to local symbols for math/text label resolution. */
  jiix: IIJiixQueryManager
  /** Produces every export format and drives the file downloads. */
  exportManager: IIExportManager
  /** Manages math recognition: variables, computation, and evaluation rendering. */
  math: IIMathManager
  /** Manages smart connectors and anchor-based endpoint updates. */
  connector: IIConnectorManager
  /** Manages the floating UI menu (tool selector, style panel, action buttons). */
  menu: IIMenuManager
  /** Replays a recorded set of strokes with play/pause/speed control. */
  playback: IIPlaybackManager
  /** Static utility class for creating DOM elements. */
  readonly dom = DOMFactory

  /**
   * Create and attach an InteractiveInk canvas to the given DOM element.
   * Use `Canvas.load()` instead of calling this constructor directly.
   * @param rootElement - Host DOM element that will contain the canvas layers
   * @param options - Canvas options: configuration, CSS vars, manager overrides
   */
  constructor(rootElement: HTMLElement, options?: TInteractiveInkCanvasOptions) {
    super(rootElement, options)

    registerBuiltinSymbolUtils()
    this.#configuration = new InteractiveInkCanvasConfiguration(options?.configuration)
    this.#penStyle = Object.assign({}, this.#configuration.penStyle)
    if (options?.override?.client) {
      const CustomRecognizer = options?.override.client as unknown as typeof WebSocketClient
      this.client = new CustomRecognizer(this.#configuration)
    } else {
      this.client = new WebSocketClient(this.#configuration)
    }
    this.client.event.addErrorListener(this.manageError.bind(this))
    this.client.event.addExportedListener(this.event.emitExported.bind(this.event))
    this.client.event.addContentChangedListener(this.onContentChanged.bind(this))
    this.event.addGesturedListener(this.onGestured.bind(this))
    this.client.event.addSessionOpenedListener(this.event.emitSessionOpened.bind(this.event))
    this.client.event.addEndInitialization(this.layers.clearModal.bind(this.layers))
    this.client.event.addEndInitialization(this.markConnectedOnce.bind(this))
    this.client.event.addIdleListener(this.manageIdleState.bind(this))
    this.client.event.addConnectionStatusChangedListener((status) =>
      this.manageConnectionStatus(status, this.client.offlineQueueLength)
    )

    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IIModel()

    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)

    this.keyboard = new IIKeyboardManager(this)
    this.writer = new IIWriterManager(this)
    this.eraser = new EraseManager(this)
    this.pdfExport = new PDFExportManager(this)
    this.selector = new IISelectionManager(this)
    this.move = new IIMoveManager(this)

    this.gesture = new IIGestureManager(this, this.#configuration.gesture)
    this.transform = new IITransformManager(this)
    this.converter = new IIConversionManager(this)
    this.typeset = new IITypesetManager(this)
    this.overlays = new IIOverlayManager(this, this.#configuration.overlays)
    this.snaps = new IISnapManager(this, this.#configuration.snap)
    this.synchronizer = new IISynchronizerManager(this)
    this.jiix = new IIJiixQueryManager(this)
    this.exportManager = new IIExportManager(this, this.pdfExport)
    this.math = new IIMathManager(this, this.#configuration.math)
    this.connector = new IIConnectorManager(this, this.#configuration.connector)
    this.menu = new IIMenuManager(this, options?.override?.menu)
    this.playback = new IIPlaybackManager(this)
  }

  /**
   * Promise that resolves when the WebSocket session is fully initialized.
   * Await this before calling any recognition methods.
   */
  get initializationPromise(): Promise<void> {
    return this.client.initialized.promise
  }

  /**
   * True while strokes are queued locally waiting for reconnection.
   * Listen to `event.addConnectionStatusChangedListener` for change notifications.
   */
  get isOffline(): boolean {
    return this.client.isOffline
  }

  /**
   * Active editing tool.
   * Setting this switches cursor style, attaches/detaches the corresponding manager,
   * clears selection, and emits a `toolChanged` event.
   */
  get tool(): CanvasTool {
    return this.#tool
  }
  set tool(i: CanvasTool) {
    this.#tool = i
    this.menu.tool.update()
    this.setCursorStyle()
    this.unselectAll()

    if (i !== CanvasTool.Move) {
      this.keyboard.resetStoredTool()
    }

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()
    switch (this.#tool) {
      case CanvasTool.Erase:
        this.eraser.attach(this.layers.rendering)
        break
      case CanvasTool.Select:
        this.selector.attach(this.layers.rendering)
        break
      case CanvasTool.Move:
        this.move.attach(this.layers.rendering)
        break
      default:
        this.writer.attach(this.layers.rendering)
        break
    }
    this.event.emitToolChanged(i)
  }

  /** Whether real pointer input (write/erase/select/move) is currently blocked - see `readOnly` setter. */
  get readOnly(): boolean {
    return this.#readOnly
  }

  /**
   * Block or restore real pointer input across every tool at once (write/erase/select/move all
   * attach through `layers.rendering`), and reflect it with a "not-allowed" cursor. Used e.g. by
   * `canvas.playback` so a replayed stroke can't race the user's own input.
   */
  set readOnly(value: boolean) {
    this.#readOnly = value
    this.layers.rendering.style.pointerEvents = value ? "none" : ""
    this.layers.root.classList.toggle("read-only", value)
  }

  /**
   * Current symbol model containing all ink, text, math, and shape symbols.
   */
  get model(): IIModel {
    return this.#model
  }

  /**
   * Active canvas configuration (recognition, rendering, menu, math, etc.).
   */
  get configuration(): InteractiveInkCanvasConfiguration {
    return this.#configuration
  }
  /**
   * Apply a partial rendering configuration at runtime.
   * Triggers a resize and guide-row recompute.
   * @param renderingConfiguration - Partial rendering config to merge
   */
  set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration) {
    this.configuration.rendering = mergeDeep<TIIRendererConfiguration>(
      this.configuration.rendering,
      renderingConfiguration
    )
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
    this.event.emitUIpdated()
  }

  /**
   * Current pen style applied to new strokes.
   * Setting this merges the provided partial style with the current style.
   */
  get penStyle(): TStyle {
    return this.#penStyle
  }
  set penStyle(penStyle: TPartialDeep<TStyle>) {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
  }

  /**
   * Update layer UI with debouncing
   * @param timeout - Debounce timeout in milliseconds (default: 500ms)
   */
  updateLayerUI(timeout: number = 500): void {
    clearTimeout(this.#layerUITimer)
    this.#layerUITimer = setTimeout(() => {
      this.menu.update()
      this.overlays.apply()
      this.event.emitUIpdated()
    }, timeout)
  }

  /**
   * Display an error in the canvas overlay and emit an `error` event.
   * @param error - Error to display and emit
   */
  manageError(error: Error): void {
    this.layers.showMessageError(error)
    this.event.emitError(error)
  }

  registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void {
    symbolRegistry.register(util)
  }

  getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined {
    return symbolRegistry.getUtil<T>(type)
  }

  protected get cursorClasses(): string[] {
    return ["draw", "erase", "select", "move"]
  }

  protected getCursorClass(): string {
    switch (this.#tool) {
      case CanvasTool.Erase:
        return "erase"
      case CanvasTool.Select:
        return "select"
      case CanvasTool.Move:
        return "move"
      default:
        return "draw"
    }
  }

  /**
   * On top of the base badge tracking, cancels the pending debounced `synchronize()` as soon
   * as a new gesture starts - so a stroke/transform beginning right as the debounce timer would
   * otherwise fire never races it (it'll be rescheduled once that gesture's own content change
   * comes in).
   */
  override startOperation(label: TCanvasOperationLabel): void {
    super.startOperation(label)
    if (GESTURE_OPERATION_LABELS.includes(label)) {
      clearTimeout(this.#recognizeStrokeTimer)
    }
  }

  protected async onContentChanged(undoRedoContext: THistoryContext): Promise<void> {
    clearTimeout(this.#recognizeStrokeTimer)
    this.#recognizeStrokeTimer = setTimeout(async () => {
      try {
        await this.synchronize()
      } finally {
        // Clears every "Recognizing" started since the last synchronize (writer/transform pointerDown,
        // programmatic API calls) in one shot — not a matched start/end pair, since several may have
        // accumulated before this single debounced synchronize() ran.
        this.clearOperation("Recognizing")
      }
      this.updateLayerUI(0)
      this.event.emitChanged(undoRedoContext)
    }, 500)
  }

  /**
   * With `ignoreGestureStrokes` the backend never emits a `contentChanged` for a gesture stroke,
   * so the debounced synchronize scheduled by `onContentChanged` has nothing left to reschedule it -
   * force one here instead of relying on that mechanism.
   */
  protected async onGestured(): Promise<void> {
    if (!this.client.configuration.recognition.gesture.ignoreGestureStrokes) {
      return
    }
    await this.synchronize()
    this.updateLayerUI(0)
  }

  /**
   * Initialize the canvas: render layers, attach input handlers, connect to the
   * WebSocket client, and load the initial session.
   * Called automatically by `Canvas.load()` — do not call manually.
   * @throws If the client connection or session setup fails
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = CanvasTool.Write
      this.renderer.init(this.layers.rendering)
      this.menu.render(this.layers.ui.root)
      this.setCssVars(this.#configuration.cssVars)

      this.keyboard.attach()
      this.layers.root.addEventListener("wheel", this.handleWheel)
      this.startResizeObserver()

      this.history.init(this.model)

      if (!this.client.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.client.configuration.server.version = this.info!.version
      }
      await this.client.init()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    } finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.manageIdleState(true)
    }
  }

  /**
   * Switch the recognition language without destroying the canvas.
   * Opens a new backend session and re-sends all existing strokes.
   * @param code - BCP 47 language code (e.g. `"en_US"`, `"fr_FR"`)
   * @throws If the new session fails to open
   */
  async changeLanguage(code: string): Promise<void> {
    try {
      this.logger.info("changeLanguage", { code })
      this.manageIdleState(false)
      // Reset the export when changing language to force synchronization.
      this.model.invalidateExports()
      this.configuration.recognition.lang = code
      await this.client.newSession(this.configuration)
      const strokes = this.extractStrokesFromSymbols(this.model.symbols)
      if (strokes.length > 0) {
        this.startOperation("Recognizing")
        await this.client.addStrokes(strokes, false)
      }
      this.layers.hideLoader()
      this.event.emitLoaded()
    } catch (error) {
      this.logger.error("changeLanguage", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Build a symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Complete symbol instance
   */
  protected buildSymbol(partialSymbol: TPartialDeep<TSymbol>): TSymbol {
    try {
      return createSymbolFromPartial(partialSymbol)
    } catch (error) {
      this.logger.error("buildSymbol", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Optimizes client calls by comparing old and new strokes
   * and calling the most appropriate method (erase, add, or replace)
   * @param oldStrokes - Strokes before the change
   * @param newStrokes - Strokes after the change
   */
  #optimizeClientCall(oldStrokes: TStroke[], newStrokes: TStroke[]): void {
    const oldStrokeIds = new Set(oldStrokes.map((s) => s.id))
    const newStrokeIds = new Set(newStrokes.map((s) => s.id))

    const addedStrokes = newStrokes.filter((s) => !oldStrokeIds.has(s.id))
    const removedStrokeIds = oldStrokes.filter((s) => !newStrokeIds.has(s.id)).map((s) => s.id)

    if (removedStrokeIds.length > 0 && addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.replaceStrokes(removedStrokeIds, addedStrokes)
    } else if (removedStrokeIds.length > 0) {
      this.startOperation("Recognizing")
      this.client.eraseStrokes(removedStrokeIds)
    } else if (addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.addStrokes(addedStrokes, false)
    }
  }

  /**
   * Create a symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Promise resolving to created symbol
   */
  async createSymbol(partialSymbol: TPartialDeep<TSymbol>): Promise<TSymbol> {
    try {
      return await this.addSymbol(this.buildSymbol(partialSymbol))
    } catch (error) {
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Create multiple symbols from partial data
   * @param partialSymbols - Array of partial symbol data
   * @returns Promise resolving to array of created symbols
   */
  async createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]> {
    try {
      const symbols = createSymbolsFromPartial(partialSymbols)
      return await this.addSymbols(symbols)
    } catch (error) {
      this.logger.error("createSymbols", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /** @hidden */
  protected updateTypesetBounds(symbol: TSymbol): void {
    if (isText(symbol) || isMath(symbol)) {
      this.typeset.setBounds(symbol)
    }
  }

  /** @hidden */
  async addSymbol(sym: TSymbol, addToHistory = true): Promise<TSymbol> {
    this.logger.info("addSymbol", { sym })
    this.manageIdleState(false)
    this.updateTypesetBounds(sym)
    this.model.addSymbol(sym)
    this.renderer.drawSymbol(sym)

    const strokes = this.extractStrokesFromSymbols([sym])
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
    }
    this.client.addStrokes(strokes, false)

    if (addToHistory) {
      this.history.push({
        added: [sym],
      })
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
  async addSymbols(symList: TSymbol[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("addSymbol", { symList })
    this.manageIdleState(false)
    symList.forEach((s) => {
      this.updateTypesetBounds(s)
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
    }
    this.client.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push({
        added: symList,
      })
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
  async updateSymbol(sym: TSymbol, addToHistory = true): Promise<TSymbol> {
    this.logger.info("updateSymbol", { sym })
    this.manageIdleState(false)
    this.updateTypesetBounds(sym)

    const oldSymbol = this.model.getRootSymbol(sym.id)
    const oldStrokes = oldSymbol ? this.extractStrokesFromSymbols([oldSymbol]) : []

    this.model.updateSymbol(sym)
    this.renderer.drawSymbol(sym)

    const newStrokes = this.extractStrokesFromSymbols([sym])

    this.#optimizeClientCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push({
        updated: { oldSymbols: [oldSymbol ?? sym], newSymbols: [sym] },
      })
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
  async updateSymbols(symList: TSymbol[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("updateSymbol", { symList })
    this.manageIdleState(false)

    const oldSymbolsMap = new Map<string, TSymbol>()
    symList.forEach((sym) => {
      const oldSymbol = this.model.getRootSymbol(sym.id)
      if (oldSymbol) {
        oldSymbolsMap.set(sym.id, oldSymbol)
      }
    })
    const oldStrokes = this.extractStrokesFromSymbols(Array.from(oldSymbolsMap.values()))

    symList.forEach((s) => {
      this.updateTypesetBounds(s)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })

    const newStrokes = this.extractStrokesFromSymbols(symList)
    this.#optimizeClientCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push({
        updated: {
          oldSymbols: symList.map((s) => oldSymbolsMap.get(s.id) ?? s),
          newSymbols: symList,
        },
      })
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
  updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>, addToHistory = true): void {
    this.logger.info("updateSymbolsStyle", {
      symbolIds,
      style,
    })
    const symbols: TSymbol[] = []
    const oldStyles: TPartialDeep<TStyle>[] = []
    this.model.symbols.forEach((s) => {
      if (symbolIds.includes(s.id)) {
        oldStyles.push({ ...s.style })
        s.style = Object.assign({}, s.style, style)
        if (isText(s)) {
          TextOps.updateChildrenStyle(s)
        }
        this.renderer.drawSymbol(s)
        this.model.updateSymbol(s)
        s.modificationDate = Date.now()
        symbols.push(s)
      }
    })
    if (symbols.length) {
      symbols.forEach((s) => {
        if (isText(s)) {
          const lastWidth = s.bounds.width
          this.typeset.updateBounds(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            this.typeset.moveTextAfter(s, tx)
          }
        }
      })
    }
    if (addToHistory && symbols.length) {
      this.history.push({
        style: { symbols, oldStyles, newStyles: symbols.map((s) => ({ ...s.style })) },
      })
    }
  }

  /**
   * Update font style of text symbols
   * @param textIds - Array of text symbol IDs
   * @param options - Font style options (fontSize, fontWeight)
   */
  updateTextFontStyle(
    textIds: string[],
    {
      fontSize,
      fontWeight,
    }: {
      fontSize?: number
      fontWeight?: "normal" | "bold" | "auto"
    }
  ): void {
    this.logger.info("updateTextFontStyle", {
      textIds,
      fontSize,
      fontWeight,
    })
    const symbols: TText[] = []
    const oldFontSizes: (number | undefined)[] = []
    const translate: {
      symbols: TSymbol[]
      tx: number
      ty: number
    }[] = []
    this.model.symbols.forEach((s) => {
      if (textIds.includes(s.id)) {
        if (isText(s)) {
          oldFontSizes.push(s.chars[0]?.fontSize)
          TextOps.updateChildrenFont(s, {
            fontSize,
            fontWeight: fontWeight === "auto" ? undefined : fontWeight,
          })
          const lastWidth = s.bounds.width
          this.typeset.updateBounds(s)
          this.renderer.drawSymbol(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            const symbolsTranslated = this.typeset.moveTextAfter(s, tx)
            if (symbolsTranslated?.length) {
              translate.push({
                symbols: symbolsTranslated,
                tx,
                ty: 0,
              })
            }
          }
          s.modificationDate = Date.now()
          symbols.push(s)
        }
      }
    })
    if (symbols.length) {
      this.history.push({
        style: {
          symbols,
          oldFontSizes,
          newFontSizes: symbols.map((s) => s.chars[0]?.fontSize),
        },
        translate,
      })
    }
  }

  /**
   * Replace old symbols with new symbols
   * @param oldSymbols - Array of old symbols to be replaced
   * @param newSymbols - Array of new symbols to replace with
   * @param addToHistory - Whether to add this operation to history (default: true)
   */
  async replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory = true): Promise<void> {
    this.logger.info("replaceSymbol", {
      oldSymbols,
      newSymbols,
    })
    this.manageIdleState(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    const symToReplace = oldSymbols.shift()

    if (symToReplace) {
      oldSymbols.forEach((s) => {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

      this.model.replaceSymbol(symToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symToReplace.id, newSymbols)

      this.#optimizeClientCall(oldStrokes, newStrokes)

      // All old symbols (including symToReplace) are gone; new symbols replace them
      const allOldIds = new Set([symToReplace.id, ...oldSymbols.map((s) => s.id)])
      const newIds = new Set(newSymbols.map((s) => s.id))
      // Only clean up decorators whose targets are fully gone (not re-created by newSymbols)
      const removedIds = new Set([...allOldIds].filter((id) => !newIds.has(id)))
      const {
        erased: decErased,
        updatedOld: decUpdatedOld,
        updatedNew: decUpdatedNew,
      } = this.#cleanupDecoratorsForRemovedIds(removedIds)
      const { updatedOld: anchorUpdatedOld, updatedNew: anchorUpdatedNew } = this.#cleanupAnchorsForRemovedIds(
        removedIds,
        [symToReplace, ...oldSymbols].filter((s) => removedIds.has(s.id))
      )

      if (addToHistory) {
        const changes: TIIHistoryChanges = {
          replaced: {
            oldSymbols: [symToReplace, ...oldSymbols],
            newSymbols,
          },
        }
        if (decErased.length) {
          changes.erased = decErased
        }
        const updatedOld = [...decUpdatedOld, ...anchorUpdatedOld]
        const updatedNew = [...decUpdatedNew, ...anchorUpdatedNew]
        if (updatedNew.length) {
          changes.updated = { oldSymbols: updatedOld, newSymbols: updatedNew }
        }
        this.history.push(changes)
      }
      this.updateLayerUI()
    }
  }

  /**
   * Change the order of a symbol in the rendering stack
   * @param symbol - Symbol to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbol(symbol: TSymbol, position: "first" | "last" | "forward" | "backward"): void {
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
    this.history.push({
      order: { symbols: [symbol], position },
    })
  }

  /**
   * Change the order of multiple symbols in the rendering stack
   * @param symbols - Symbols to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward") {
    symbols.forEach((s) => {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push({
      order: { symbols, position },
    })
  }

  /**
   * Synchronize strokes with JIIX export
   */
  async synchronize(): Promise<void> {
    await this.synchronizer.synchronize()
    if (this.model.symbolsSelected.length > 0) {
      this.selector.drawSelectedGroup(this.model.symbolsSelected)
    }
  }

  /**
   * After removing strokes, clean up orphaned/partial standalone decorators.
   * Returns erased and updated decorators so callers can include them in history.
   */
  #cleanupDecoratorsForRemovedIds(removedIds: Set<string>): {
    erased: TDecorator[]
    updatedOld: TDecorator[]
    updatedNew: TDecorator[]
  } {
    const erased: TDecorator[] = []
    const updatedOld: TDecorator[] = []
    const updatedNew: TDecorator[] = []

    for (const sym of [...this.model.symbols]) {
      if (!isDecorator(sym)) {
        continue
      }
      const dec = sym as TDecorator
      const remaining = dec.targetIds.filter((id) => !removedIds.has(id))
      if (remaining.length === 0) {
        this.model.removeSymbol(dec.id)
        this.renderer.removeElement(dec.id)
        erased.push(dec)
      } else if (remaining.length < dec.targetIds.length) {
        const oldDec: TDecorator = { ...dec }
        dec.targetIds = remaining
        const targetSyms = remaining.map((id) => this.model.getRootSymbol(id)).filter((s): s is TSymbol => !!s)
        if (targetSyms.length) {
          DecoratorOps.setBounds(dec, OBBOps.createFromOBBs(targetSyms.map((s) => s.bounds)))
        }
        this.model.updateSymbol(dec)
        this.renderer.drawSymbol(dec)
        updatedOld.push(oldDec)
        updatedNew.push(dec)
      }
    }

    return { erased, updatedOld, updatedNew }
  }

  /**
   * After removing symbols, clear anchors on edges (and pre-convert Edge strokes) that
   * pointed at a removed target. Returns updated symbols so callers can include them in
   * history - undoing the removal then also restores the anchor.
   * `removedSymbols` must be the symbol objects captured *before* they left the model: their
   * `jiixBlockId` is what pre-convert anchors point at, and it can no longer be looked up here.
   */
  #cleanupAnchorsForRemovedIds(
    removedIds: Set<string>,
    removedSymbols: TSymbol[]
  ): {
    updatedOld: TSymbol[]
    updatedNew: TSymbol[]
  } {
    const updatedOld: TSymbol[] = []
    const updatedNew: TSymbol[] = []

    const removedBlockIds = new Set<string>()
    removedSymbols.forEach((sym) => {
      if (isStroke(sym) && sym.jiixBlockId) {
        removedBlockIds.add(sym.jiixBlockId)
      }
    })
    const isTargetRemoved = (symbolId: string): boolean => removedIds.has(symbolId) || removedBlockIds.has(symbolId)

    for (const sym of [...this.model.symbols]) {
      if (EdgeOps.isEdge(sym) && (EdgeOps.isLineEdge(sym) || EdgeOps.isPolyEdge(sym) || EdgeOps.isArcEdge(sym))) {
        const hitStart = sym.startAnchor && isTargetRemoved(sym.startAnchor.symbolId)
        const hitEnd = sym.endAnchor && isTargetRemoved(sym.endAnchor.symbolId)
        if (!hitStart && !hitEnd) {
          continue
        }
        const oldSym = { ...sym }
        if (hitStart) {
          sym.startAnchor = undefined
        }
        if (hitEnd) {
          sym.endAnchor = undefined
        }
        this.model.updateSymbol(sym)
        this.renderer.drawSymbol(sym)
        updatedOld.push(oldSym)
        updatedNew.push(sym)
        continue
      }
      if (isStroke(sym) && sym.jiixBlockType === "Edge" && (sym.startAnchor || sym.endAnchor)) {
        const hitStart = sym.startAnchor && isTargetRemoved(sym.startAnchor.symbolId)
        const hitEnd = sym.endAnchor && isTargetRemoved(sym.endAnchor.symbolId)
        if (!hitStart && !hitEnd) {
          continue
        }
        const oldSym = { ...sym }
        if (hitStart) {
          sym.startAnchor = undefined
        }
        if (hitEnd) {
          sym.endAnchor = undefined
        }
        this.model.updateSymbol(sym)
        updatedOld.push(oldSym)
        updatedNew.push(sym)
      }
    }

    return { updatedOld, updatedNew }
  }

  /**
   * Remove a symbol from the model
   * @param id - ID of symbol to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbol is removed
   */
  async removeSymbol(id: string, addToHistory = true): Promise<void> {
    this.logger.info("removeSymbol", { id })
    const symbol = this.model.getRootSymbol(id)
    if (symbol) {
      this.manageIdleState(false)
      this.startOperation("Recognizing")
      this.client.eraseStrokes([id])
      if (
        isStroke(symbol) &&
        symbol.jiixBlockType === "Math" &&
        symbol.jiixBlockId &&
        this.math.hasGhostStrokes(symbol.jiixBlockId)
      ) {
        this.math.clearGhostStrokes(symbol.jiixBlockId)
      }
      this.model.removeSymbol(symbol.id)
      this.renderer.removeSymbol(symbol.id)
      const removedIds = new Set([id])
      const {
        erased: decErased,
        updatedOld: decUpdatedOld,
        updatedNew: decUpdatedNew,
      } = this.#cleanupDecoratorsForRemovedIds(removedIds)
      const { updatedOld: anchorUpdatedOld, updatedNew: anchorUpdatedNew } = this.#cleanupAnchorsForRemovedIds(
        removedIds,
        [symbol]
      )
      if (addToHistory) {
        const changes: TIIHistoryChanges = {
          erased: [symbol],
        }
        if (decErased.length) {
          changes.erased = [...changes.erased!, ...decErased]
        }
        const updatedOld = [...decUpdatedOld, ...anchorUpdatedOld]
        const updatedNew = [...decUpdatedNew, ...anchorUpdatedNew]
        if (updatedNew.length) {
          changes.updated = { oldSymbols: updatedOld, newSymbols: updatedNew }
        }
        this.history.push(changes)
      }
      this.updateLayerUI()
    } else {
      this.renderer.removeSymbol(id)
      this.startOperation("Recognizing")
      this.client.eraseStrokes([id])
    }
    this.selector.removeSelectedGroup()
  }

  /**
   * Remove multiple symbols from the model
   * @param ids - Array of symbol IDs to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbols are removed
   */
  async removeSymbols(ids: string[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("removeSymbols", { ids })
    const symbolsRemoved: TSymbol[] = []
    const strokesIds: string[] = []
    ids.forEach((id) => {
      const sym = this.model.getRootSymbol(id)
      if (sym) {
        symbolsRemoved.push(sym)
        if (isStroke(sym)) {
          strokesIds.push(sym.id)
          if (sym.jiixBlockType === "Math" && sym.jiixBlockId && this.math.hasGhostStrokes(sym.jiixBlockId)) {
            this.math.clearGhostStrokes(sym.jiixBlockId)
          }
        }
        this.model.removeSymbol(sym.id)
        this.renderer.removeSymbol(sym.id)
      }
    })
    if (strokesIds.length > 0) {
      this.startOperation("Recognizing")
      this.client.eraseStrokes(strokesIds)
    }

    const removedIds = new Set(symbolsRemoved.map((s) => s.id))
    const {
      erased: decErased,
      updatedOld: decUpdatedOld,
      updatedNew: decUpdatedNew,
    } = this.#cleanupDecoratorsForRemovedIds(removedIds)
    const { updatedOld: anchorUpdatedOld, updatedNew: anchorUpdatedNew } = this.#cleanupAnchorsForRemovedIds(
      removedIds,
      symbolsRemoved
    )

    if (addToHistory && symbolsRemoved.length) {
      const changes: TIIHistoryChanges = {
        erased: symbolsRemoved,
      }
      if (decErased.length) {
        changes.erased = [...changes.erased!, ...decErased]
      }
      const updatedOld = [...decUpdatedOld, ...anchorUpdatedOld]
      const updatedNew = [...decUpdatedNew, ...anchorUpdatedNew]
      if (updatedNew.length) {
        changes.updated = { oldSymbols: updatedOld, newSymbols: updatedNew }
      }
      this.history.push(changes)
      this.updateLayerUI()
    }
    this.manageIdleState(false)
    this.selector.removeSelectedGroup()
    return symbolsRemoved
  }

  /**
   * Select symbols by their IDs
   * @param ids - Array of symbol IDs to select
   */
  select(ids: string[]): void {
    this.tool = CanvasTool.Select
    this.model.symbols.forEach((s) => {
      const shouldBeSelected = ids.includes(s.id)
      const wasSelected = this.model.selectedIds.has(s.id)
      if (wasSelected !== shouldBeSelected) {
        if (shouldBeSelected) {
          this.model.selectedIds.add(s.id)
        } else {
          this.model.selectedIds.delete(s.id)
        }
        this.renderer.updateSelectedState(s, shouldBeSelected)
      }
    })
    this.selector.expandSelectionForMathBlocks()
    this.selector.expandSelectionForBlocks()
    this.selector.drawSelectedGroup(this.model.symbolsSelected)

    const selectedMathJiixBlockId = this.selector.getSelectedMathJiixBlockId()
    if (selectedMathJiixBlockId) {
      this.math.selectBlock(selectedMathJiixBlockId)
    } else {
      this.math.clearBlockSelection()
    }
    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  /**
   * Select all symbols
   */
  selectAll(): void {
    this.tool = CanvasTool.Select
    this.model.symbols.forEach((s) => {
      this.model.selectedIds.add(s.id)
      this.renderer.updateSelectedState(s, true)
    })
    this.selector.drawSelectedGroup(this.model.symbolsSelected)

    const selectedMathJiixBlockId = this.selector.getSelectedMathJiixBlockId()
    if (selectedMathJiixBlockId) {
      this.math.selectBlock(selectedMathJiixBlockId)
    } else {
      this.math.clearBlockSelection()
    }
    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  /**
   * Unselect all currently selected symbols
   */
  unselectAll(): void {
    if (this.model.symbolsSelected.length) {
      this.model.symbolsSelected.forEach((s) => {
        this.renderer.updateSelectedState(s, false)
      })
      this.model.resetSelection()
      this.selector.removeSelectedGroup()
      this.updateLayerUI()

      this.math.clearBlockSelection()
      setTimeout(() => this.event.emitSelected(this.model.symbolsSelected), 0)
    }
  }

  /**
   * Import strokes from point events
   * @param partialStrokes - Array of partial stroke data
   * @returns Promise resolving to updated model
   */
  async importPointEvents(partialStrokes: TPartialDeep<TStroke>[]): Promise<IIModel> {
    this.logger.info("importPointEvents", {
      partialStrokes,
    })
    this.manageIdleState(false)
    const strokes = partialStrokes.map(StrokeOps.createFromPartial)
    strokes.forEach((s) => {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.addStrokes(strokes, false)
    }
    this.history.push({
      added: strokes,
    })
    this.logger.debug("importPointEvents", this.model)
    this.updateLayerUI()
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  /**
   * Get bounding box for a list of symbols
   * @param symbols - Symbols to calculate bounds for
   * @param margin - TMargin to add around bounds (default: SELECTION_MARGIN)
   * @returns Bounding box containing all symbols
   */
  getSymbolsBounds(symbols: TSymbol[], margin: number = SELECTION_MARGIN): TBox {
    const box = BoxOps.createFromBoxes(symbols.map((s) => OBBOps.toBox(s.bounds)))
    box.x -= margin
    box.y -= margin
    box.width += margin * 2
    box.height += margin * 2
    return box
  }

  /**
   * Set the viewport zoom level, optionally anchored to a point.
   * @param zoom - Target zoom factor (e.g. 1.5 = 150 %)
   * @param centerX - X coordinate to zoom around (pixels, default: viewport center)
   * @param centerY - Y coordinate to zoom around (pixels, default: viewport center)
   */
  zoom(zoom: number, centerX?: number, centerY?: number): void {
    this.renderer.setZoom(zoom, centerX, centerY)
  }

  /**
   * Zoom and pan the view to fit the given symbols (or all symbols) within the viewport.
   * Resets to zoom 1 if there are no symbols.
   * @param symbols - Symbols to fit (default: all model symbols)
   */
  zoomToFit(symbols?: TSymbol[]): void {
    const targets = symbols ?? this.model.symbols
    const vpW = this.renderer.parent.clientWidth
    const vpH = this.renderer.parent.clientHeight

    if (!targets.length) {
      this.renderer.setZoom(1)
      this.renderer.setViewBox(0, 0, vpW, vpH)
      return
    }

    const bounds = this.getSymbolsBounds(targets, 0)
    const margin = InteractiveInkCanvas.ZOOM_FIT_MARGIN
    const zoom = Math.max(0.1, Math.min((vpW - margin * 2) / bounds.width, (vpH - margin * 2) / bounds.height))

    const vbW = vpW / zoom
    const vbH = vpH / zoom
    const vbX = bounds.x + bounds.width / 2 - vbW / 2
    const vbY = bounds.y + bounds.height / 2 - vbH / 2

    this.renderer.setZoom(zoom)
    this.renderer.setViewBox(vbX, vbY, vbW, vbH)
  }

  /**
   * Get the current viewport zoom level.
   * @returns Current zoom factor (1.0 = 100 %)
   */
  getZoom(): number {
    return this.renderer.getZoom()
  }

  /**
   * Shift the viewport by the given pixel delta without changing zoom.
   * @param dx - Horizontal offset in pixels (positive = pan right)
   * @param dy - Vertical offset in pixels (positive = pan down)
   */
  pan(dx: number, dy: number): void {
    this.renderer.pan(dx, dy)
  }

  /**
   * Export the content in the given format.
   *
   * `pdf` is not available here — printing produces no in-memory value, use
   * {@link InteractiveInkCanvas.download} instead.
   *
   * @param format - Format to export to; the resolved type follows from it
   * @param options - Which symbols to export (`scope`, or an explicit `symbols` list)
   * @returns Promise resolving with the exported content
   *
   * @example
   * ```typescript
   * const symbols = await canvas.exportAs("json")
   * const markdown = await canvas.exportAs("markdown")
   * const svg = await canvas.exportAs("svg", { scope: "selection" })
   * ```
   */
  exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]> {
    return this.exportManager.exportAs(format, options)
  }

  /**
   * Export the content and hand the resulting file to the browser.
   *
   * @param format - Format to download; `pdf` opens the print flow instead of saving a file
   * @param options - Which symbols to export, plus the file name. The PDF settings
   *                  (`format`/`orientation`/`mode`/`scale`) are ignored by every other format.
   *
   * @example
   * ```typescript
   * await canvas.download("svg")
   * await canvas.download("text", { scope: "selection", filename: "notes" })
   * await canvas.download("pdf", { orientation: "landscape" })
   * ```
   */
  download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void> {
    return this.exportManager.download(format, options)
  }

  /**
   * Extract all strokes from symbols recursively
   * @param symbols - Symbols to extract strokes from
   * @returns Array of extracted strokes
   */
  extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[] {
    return extractStrokes(symbols)
  }

  /**
   * Extract all math symbols recursively
   * @param symbols - Symbols to extract maths from
   * @returns Array of extracted math symbols
   */
  extractMathsFromSymbols(symbols: TSymbol[] | undefined): TMath[] {
    if (!symbols?.length) {
      return []
    }
    return symbols.filter(isMath)
  }

  protected handleWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      const rect = this.layers.root.getBoundingClientRect()
      this.#pendingWheelDeltaY += event.deltaY
      this.#pendingWheelOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      this.#scheduleWheelZoom()
    }
  }

  /**
   * Coalesces `setZoom()` (attribute mutation + virtualization reconciliation + guide redraw)
   * to at most one call per animation frame — a trackpad pinch/ctrl+scroll fires many `wheel`
   * events per frame. Summing `deltaY` across the coalesced events and applying it in one
   * `Math.exp()` against the pre-frame zoom is exactly equivalent to applying each event's zoom
   * factor in sequence (exponents add under multiplication), so no precision is lost.
   */
  #scheduleWheelZoom(): void {
    this.#wheelZoomCoalescer.schedule(() => {
      if (!this.#pendingWheelOffset) {
        return
      }
      const zoomIntensity = 0.001
      const zoom = this.renderer.getZoom() * Math.exp(-this.#pendingWheelDeltaY * zoomIntensity)
      this.renderer.setZoom(zoom, this.#pendingWheelOffset.x, this.#pendingWheelOffset.y)
      this.menu.action.update()
      this.#pendingWheelDeltaY = 0
      this.#pendingWheelOffset = undefined
    })
  }

  /**
   * Undo the last action
   * @returns Promise resolving to updated model
   */
  async undo(): Promise<IIModel> {
    this.logger.info("undo")
    if (this.history.context.canUndo) {
      return this.#undoInternal()
    }
    return this.model
  }

  #hasBackendActions(actions: TIIHistoryBackendChanges): boolean {
    return !!(
      actions.added?.length ||
      actions.erased?.length ||
      actions.replaced ||
      actions.matrix ||
      actions.translate?.length ||
      actions.scale?.length ||
      actions.rotate?.length
    )
  }

  #extractJIIXBlockIdFromBackendActions(actions: TIIHistoryBackendChanges): string[] {
    const strokes = [
      ...(actions.added || []),
      ...(actions.erased || []),
      ...(actions.replaced?.newStrokes || []),
      ...(actions.replaced?.oldStrokes || []),
      ...(actions.matrix?.strokes || []),
      ...(actions.translate?.flatMap((s) => s.strokes) || []),
      ...(actions.scale?.flatMap((s) => s.strokes) || []),
      ...(actions.rotate?.flatMap((s) => s.strokes) || []),
    ]

    return new Set(strokes.map((s) => s.jiixBlockId))
      .values()
      .toArray()
      .filter((a) => !!a) as string[]
  }

  /**
   * Applies a history diff locally (model + renderer), replacing the model-clone-swap this
   * used to do. Backend replay is a separate, consolidated message sent by the caller via
   * extractIIBackendChanges - this method must never talk to `this.client` itself, or the
   * backend would receive the same action twice.
   */
  #applyHistoryChanges(changes: TIIHistoryChanges): void {
    this.manageIdleState(false)
    this.unselectAll()

    changes.added?.forEach((sym) => {
      this.model.addSymbol(sym)
      this.renderer.drawSymbol(sym)
    })
    changes.erased?.forEach((sym) => {
      this.model.removeSymbol(sym.id)
      this.renderer.removeSymbol(sym.id)
    })
    changes.updated?.newSymbols.forEach((sym) => {
      this.model.updateSymbol(sym)
      this.renderer.drawSymbol(sym)
    })
    if (changes.replaced) {
      const [anchor, ...rest] = changes.replaced.oldSymbols
      rest.forEach((s) => {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })
      this.model.replaceSymbol(anchor.id, changes.replaced.newSymbols)
      this.renderer.replaceSymbol(anchor.id, changes.replaced.newSymbols)
    }
    if (changes.matrix) {
      const m = changes.matrix.matrix
      this.transform.applyMatrix(changes.matrix.symbols, new MatrixTransform(m.xx, m.yx, m.xy, m.yy, m.tx, m.ty))
    }
    changes.translate?.forEach((tr) => {
      this.transform.applyMatrix(tr.symbols, MatrixTransform.identity().translate(tr.tx, tr.ty))
    })
    changes.rotate?.forEach((r) => {
      this.transform.applyMatrix(r.symbols, MatrixTransform.identity().rotate(r.angle, r.center))
    })
    changes.scale?.forEach((sc) => {
      this.transform.applyMatrix(sc.symbols, MatrixTransform.identity().scale(sc.scaleX, sc.scaleY, sc.origin))
    })
    if (changes.style) {
      const { symbols, newStyles, newFontSizes } = changes.style
      symbols.forEach((sym, i) => {
        if (newStyles?.[i]) {
          sym.style = newStyles[i] as TStyle
        }
        const newFontSize = newFontSizes?.[i]
        if (newFontSize !== undefined && isText(sym)) {
          sym.chars.forEach((c) => {
            c.fontSize = newFontSize
          })
        }
        this.model.updateSymbol(sym)
        this.renderer.drawSymbol(sym)
      })
    }
    if (changes.order) {
      changes.order.symbols.forEach((sym) => {
        this.model.changeOrderSymbol(sym.id, changes.order!.position)
        this.renderer.changeOrderSymbol(sym, changes.order!.position)
      })
    }
  }

  async #undoInternal(): Promise<IIModel> {
    const changes = this.history.undo()
    this.logger.debug("undo", {
      changes,
    })

    this.#applyHistoryChanges(changes)
    const actionsToBackend = extractIIBackendChanges(changes)
    try {
      if (this.#hasBackendActions(actionsToBackend)) {
        this.#extractJIIXBlockIdFromBackendActions(actionsToBackend).forEach((jiixBlockId) => {
          this.math.clearGhostStrokes(jiixBlockId)
        })
        this.startOperation("Recognizing")
        await this.client.undo(actionsToBackend)
      }
    } finally {
      this.updateLayerUI()
    }
    this.updateLayerUI()
    return this.model
  }

  /**
   * Redo the previously undone action
   * @returns Promise resolving to updated model
   */
  async redo(): Promise<IIModel> {
    this.logger.info("redo")

    if (this.history.context.canRedo) {
      return this.#redoInternal()
    }
    return this.model
  }

  async #redoInternal(): Promise<IIModel> {
    const changes = this.history.redo()
    this.logger.debug("redo", { changes })
    this.#applyHistoryChanges(changes)
    const actionsToBackend = extractIIBackendChanges(changes)
    try {
      if (this.#hasBackendActions(actionsToBackend)) {
        this.#extractJIIXBlockIdFromBackendActions(actionsToBackend).forEach((jiixBlockId) => {
          this.math.clearGhostStrokes(jiixBlockId)
        })
        this.startOperation("Recognizing")
        await this.client.redo(actionsToBackend)
      }
    } finally {
      this.updateLayerUI()
    }
    this.updateLayerUI()
    return this.model
  }

  /**
   * Export content to specified MIME types
   * @param mimeTypes - Array of MIME types to export
   * @returns Promise resolving with exports
   */
  async export(mimeTypes?: string[]): Promise<TExport> {
    try {
      this.logger.info("export", { mimeTypes })
      const requestedMimeTypes = mimeTypes?.length ? mimeTypes : this.client.mimeTypes
      const missingMimeTypes = requestedMimeTypes.filter((mt) => !this.model.exports?.[mt])
      if (missingMimeTypes.length === 0) {
        return this.model.exports!
      }
      const versionAtRequest = this.model.version
      const exports = await this.client.export(missingMimeTypes)
      if (this.model.version !== versionAtRequest) {
        // The model mutated (e.g. a gesture-triggered stroke erase) while this export request
        // was in flight — the response reflects a server state that's already superseded, so
        // merging it would cache stale content. Debounce the retry so a burst of mutations
        // coalesces into a single re-fetch instead of one per mutation.
        return this.#debouncedExportRetry(missingMimeTypes)
      }
      this.model.mergeExport(exports as TExport)
      this.jiix.invalidateIndex()
      return this.model.exports!
    } catch (error) {
      this.logger.error("export", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Coalesces concurrent stale-export retries triggered within the debounce window into a
   * single re-fetch covering the union of requested mime types.
   */
  #debouncedExportRetry(mimeTypes: string[]): Promise<TExport> {
    mimeTypes.forEach((mt) => this.#pendingExportRetryMimeTypes.add(mt))
    clearTimeout(this.#exportRetryTimer)
    if (!this.#pendingExportRetry) {
      this.#pendingExportRetry = new Promise<TExport>((resolve, reject) => {
        this.#exportRetryTimer = setTimeout(() => {
          const mimeTypesToRetry = [...this.#pendingExportRetryMimeTypes]
          this.#pendingExportRetryMimeTypes.clear()
          this.#pendingExportRetry = undefined
          this.export(mimeTypesToRetry).then(resolve, reject)
        }, InteractiveInkCanvas.EXPORT_RETRY_DEBOUNCE_MS)
      })
    }
    return this.#pendingExportRetry
  }

  /**
   * Convert specific symbols, or all symbols if none specified
   * @param symbols - Symbols to convert (defaults to all symbols)
   * @returns Promise that resolves when conversion is complete
   */
  async convert(symbols?: TSymbol[]): Promise<void> {
    try {
      this.manageIdleState(false)
      const addedSymbols = await this.converter.apply(symbols)
      this.select(addedSymbols.map((s) => s.id))
      this.event.emitConverted()
    } catch (error) {
      this.logger.error("convert", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Duplicate specific symbols, or all symbols if none specified
   * @param symbols - Symbols to duplicate (defaults to all symbols)
   * @returns Promise resolving with duplicated symbols
   */
  async duplicate(symbols?: TSymbol[]): Promise<TSymbol[]> {
    try {
      this.manageIdleState(false)
      const symbolsToDuplicate = symbols ?? this.model.symbols
      const bounds = BoxOps.createFromBoxes(symbolsToDuplicate.map((s) => OBBOps.toBox(s.bounds)))

      const duplicatedSymbols = symbolsToDuplicate.map((s) => {
        const clone = cloneSymbol(s)

        // Generate unique ID for cloned symbols
        while (this.model.symbols.find((sym) => sym.id === clone.id)) {
          clone.id = `${clone.type}-${createUUID()}`
        }

        const matrix = MatrixTransform.identity().translate(SELECTION_MARGIN, bounds.height + SELECTION_MARGIN)
        this.transform.translate.applyToSymbol(clone, matrix)
        return clone
      })
      this.unselectAll()
      const syms = await this.addSymbols(duplicatedSymbols)
      this.select(syms.map((s) => s.id))
      return syms
    } catch (error) {
      this.logger.error("duplicate", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Wait for the client to become idle
   * @returns Promise that resolves when idle
   */
  async waitForIdle(): Promise<void> {
    return this.client.waitForIdle()
  }

  /**
   * Resize the canvas
   * @param dimensions - New height and/or width
   * @returns Promise that resolves when resize is complete
   */
  async resize({
    height,
    width,
  }: {
    height?: number
    width?: number
  } = {}): Promise<void> {
    try {
      this.logger.info("resize", {
        height,
        width,
      })
      const dims = this.resolveDimensions(height, width)

      if (dims.height === this.#renderedHeight && dims.width === this.#renderedWidth) {
        this.logger.debug("resize", "no change")
        return
      }
      this.#renderedHeight = dims.height
      this.#renderedWidth = dims.width

      this.manageIdleState(false)
      this.renderer.resize(dims.height, dims.width)
      this.updateLayerUI(50)
      this.manageIdleState(true)
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  protected get minDimensions(): { minHeight: number; minWidth: number } {
    return this.configuration.rendering
  }

  /**
   * Apply or replace CSS custom properties on the canvas root element.
   * Clears all existing `--ms-ink-*` properties first, then sets the provided vars.
   * Does not reinitialize — current model and session are preserved.
   * Pass `undefined` to reset to stylesheet defaults.
   * @group Canvas
   */
  setCssVars(vars: Record<string, string> | undefined): void {
    const rootStyle = this.layers.root.style
    Array.from(rootStyle)
      .filter((p) => p.startsWith("--ms-ink-"))
      .forEach((p) => rootStyle.removeProperty(p))
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => rootStyle.setProperty(key, value))
    }
    this.#configuration.cssVars = vars
  }

  /**
   * Clear all content from the canvas
   * @returns Promise that resolves when cleared
   */
  async clear(): Promise<void> {
    try {
      this.logger.info("clear")
      this.manageIdleState(false)
      if (this.model.symbols.length) {
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.history.push({ erased })
        this.startOperation("Recognizing")
        await this.client.clear()
        this.event.emitSelected(this.model.symbolsSelected)
      }
      this.updateLayerUI()
      this.event.emitCleared()
    } catch (error) {
      // "Recognizing" is normally bulk-cleared by onContentChanged, which is driven by the
      // client's contentChanged event — that never arrives if the clear failed, so the badge
      // would stay lit forever.
      this.clearOperation("Recognizing")
      this.manageError(error as Error)
    }
  }

  #isCopyableSymbol(symbol: TSymbol): boolean {
    if (isDecorator(symbol)) {
      return false
    }
    if (isStrokeSolverOutput(symbol)) {
      return false
    }
    return true
  }

  #cloneSymbolForPaste(symbol: TSymbol, tx: number, ty: number): TSymbol {
    const clone = cloneSymbol(symbol)
    clone.id = `${clone.type}-${createUUID()}`
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.transform.translate.applyToSymbol(clone, matrix)
    return clone
  }

  /**
   * Copy selected symbols (or all symbols if nothing selected) to the internal clipboard
   */
  copy(): void {
    this.logger.info("copy")
    const symbols = this.model.symbolsSelected.length ? this.model.symbolsSelected : this.model.symbols
    this.#clipboard = symbols.filter((s) => this.#isCopyableSymbol(s)).map((s) => cloneSymbol(s))
  }

  /**
   * Paste clipboard symbols at an offset and select them
   */
  async paste(): Promise<void> {
    if (!this.#clipboard.length) {
      return
    }
    this.logger.info("paste", {
      count: this.#clipboard.length,
    })
    const clones = this.#clipboard.map((s) =>
      this.#cloneSymbolForPaste(s, InteractiveInkCanvas.PASTE_OFFSET, InteractiveInkCanvas.PASTE_OFFSET)
    )
    this.unselectAll()
    await this.addSymbols(clones)
    this.select(clones.map((c) => c.id))
  }

  /**
   * Cut selected symbols: copy them to clipboard, then remove from model
   */
  async cut(): Promise<void> {
    this.logger.info("cut")
    this.copy()
    const ids = this.model.symbolsSelected.map((s) => s.id)
    if (ids.length) {
      await this.removeSymbols(ids)
    }
  }

  /**
   * Destroy the canvas and clean up resources
   * @returns Promise that resolves when destruction is complete
   */
  async destroy(): Promise<void> {
    this.logger.info("destroy")

    this.keyboard.detach()
    this.layers.root.removeEventListener("wheel", this.handleWheel)
    this.#wheelZoomCoalescer.cancel()

    this.layers.root.classList.remove("draw")
    this.layers.root.classList.remove("erase")
    this.layers.root.classList.remove("select")
    this.layers.root.classList.remove("move")

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()

    this.playback.destroy()
    this.exportManager.destroy()
    this.teardownCommon()
    this.menu.destroy()
    this.client.destroy()
    this.model.clear()
    this.history.clear()
    this.clearRootElementReference()
    return Promise.resolve()
  }
}
