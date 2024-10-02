import { EditorTool } from "../Constants"
import { Configuration, TConfiguration, TConverstionState, TMarginConfiguration } from "../configuration"
import { PointerEventGrabber } from "../grabber"
import { LoggerClass, LoggerManager } from "../logger"
import { IModel, Model, TExport, TJIIXExport } from "../model"
import { TWSMessageEventSVGPatch, WSRecognizer } from "../recognizer"
import { WSSmartGuide } from "../smartguide"
import { WSSVGRenderer } from "../renderer"
import { DefaultPenStyle, StyleManager, TPenStyle, TTheme } from "../style"
import { HistoryManager, TUndoRedoContext } from "../history"
import { DeferredPromise, PartialDeep } from "../utils"
import { Stroke, TStroke, TPointer } from "../primitive"
import { IBehaviors } from "./IBehaviors"
import { TBehaviorOptions } from "./TBehaviorOptions"
import { EditorLayer } from "../EditorLayer"
import { EditorEvent } from "../EditorEvent"

/**
 * @group Behavior
 */
export class WSBehaviors implements IBehaviors
{
  name = "WSBehaviors"
  #logger = LoggerManager.getLogger(LoggerClass.BEHAVIORS)
  #configuration: TConfiguration
  #model: Model
  #resizeTimer?: ReturnType<typeof setTimeout>
  layers: EditorLayer
  event: EditorEvent

  smartGuide?: WSSmartGuide
  grabber: PointerEventGrabber
  renderer: WSSVGRenderer
  recognizer: WSRecognizer
  history: HistoryManager
  styleManager: StyleManager
  #tool: EditorTool = EditorTool.Write

  constructor(options: PartialDeep<TBehaviorOptions>, layers: EditorLayer, event: EditorEvent)
  {
    this.#logger.info("constructor", { options })
    this.layers = layers
    this.event = event
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options?.penStyle, options?.theme)

    if (options.behaviors?.grabber) {
      const CustomGrabber = options.behaviors?.grabber as unknown as typeof PointerEventGrabber
      this.grabber = new CustomGrabber(this.#configuration.grabber)
    }
    else {
      this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    }
    if (options.behaviors?.recognizer) {
      const CustomRecognizer = options.behaviors?.recognizer as unknown as typeof WSRecognizer
      this.recognizer = new CustomRecognizer(this.#configuration.server, this.#configuration.recognition)
    }
    else {
      this.recognizer = new WSRecognizer(this.#configuration.server, this.#configuration.recognition)
    }
    this.renderer = new WSSVGRenderer(this.#configuration.rendering)

    this.tool = EditorTool.Write
    this.#model = new Model()
    this.history = new HistoryManager(this.#configuration["undo-redo"], this.event)
  }

  get tool(): EditorTool
  {
    return this.#tool
  }
  set tool(i: EditorTool)
  {
    this.#tool = i
    this.setCursorStyle()
  }

  protected setCursorStyle(): void
  {
    switch (this.tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        break
      default:
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        break
    }
  }

  get model(): Model
  {
    return this.#model
  }

  get configuration(): TConfiguration
  {
    return this.#configuration
  }

  get currentPenStyle(): TPenStyle
  {
    return this.styleManager.currentPenStyle
  }

  get penStyle(): TPenStyle
  {
    return this.styleManager.penStyle
  }
  setPenStyle(penStyle?: PartialDeep<TPenStyle>): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
    this.#logger.debug("setPenStyle", this.styleManager.penStyle)
    return this.recognizer.setPenStyle(this.styleManager.penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  setPenStyleClasses(penClass?: string): Promise<void>
  {
    this.#logger.info("setPenStyleClasses", { penClass })
    this.styleManager.setPenStyleClasses(penClass)
    this.#logger.debug("setPenStyleClasses", this.styleManager.penStyleClasses)
    return this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  setTheme(theme?: PartialDeep<TTheme>): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
    this.#logger.debug("setTheme", this.styleManager.theme)
    return this.recognizer.setTheme(this.styleManager.theme)
  }

  protected onExport(exports: TExport): void
  {
    this.#logger.debug("onExport", { exports })
    if (this.smartGuide && exports?.["application/vnd.myscript.jiix"]) {
      const jjix = exports["application/vnd.myscript.jiix"] as TJIIXExport
      this.smartGuide.update(jjix)
    }
    this.model.mergeExport(exports)
    this.event.emitExported(exports)
  }

  protected onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerDown", { tool: this.tool, evt, point })
    let { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    if (this.tool === EditorTool.Erase) {
      pointerType = "eraser"
    }
    this.model.initCurrentStroke(point, pointerType, style)
    this.drawCurrentStroke()
  }

  protected onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerMove", { tool: this.tool, point })
    this.model.appendToCurrentStroke(point)
    this.drawCurrentStroke()
  }

  protected async onPointerUp(_evt: PointerEvent, point: TPointer): Promise<void>
  {
    try {
      this.#logger.info("onPointerUp", { tool: this.tool, point })
      this.model.endCurrentStroke(point)
      await this.synchronizeModelWithBackend()
    } catch (error) {
      this.event.emitError(error as Error)
    }
  }

  protected onSVGPatch(evt: TWSMessageEventSVGPatch): void
  {
    this.#logger.info("onSVGPatch", { evt })
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  protected initializeSmartGuide(): void
  {
    this.smartGuide?.destroy()
    this.#logger.info("initializeSmartGuide", { smartGuide: this.configuration.rendering.smartGuide })
    if (this.configuration.rendering.smartGuide.enable) {
      this.smartGuide = new WSSmartGuide(this)
      let margin: TMarginConfiguration = { top: 20, left: 10, right: 10, bottom: 10 }
      switch (this.configuration.recognition.type) {
        case "TEXT":
          margin = this.configuration.recognition.text.margin
          break
        case "MATH":
          margin = this.configuration.recognition.math.margin
          break
      }
      this.smartGuide.init(this.layers.ui.root, margin, this.configuration.rendering)
    }
  }

  protected onContetChaned(undoRedoContext: TUndoRedoContext): void
  {
    this.history.context = undoRedoContext
    this.event.emitChanged(undoRedoContext)
  }

  async init(): Promise<void>
  {
    this.#logger.info("init")
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
    this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.rendering.minHeight)
    this.history.push(this.model)

    this.renderer.init(this.layers.render)

    this.grabber.attach(this.layers.render)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    this.initializeSmartGuide()
    this.recognizer.event.addExportedListener(this.onExport.bind(this))
    this.recognizer.event.addSVGPatchListener(this.onSVGPatch.bind(this))
    this.recognizer.event.addContentChangedListener(this.onContetChaned.bind(this))
    this.recognizer.event.addIdleListener(this.event.emitIdle.bind(this.event))
    this.recognizer.event.addErrorListener(this.event.emitError.bind(this.event))

    await this.recognizer.init(this.model.height, this.model.width)
    await this.setPenStyle(this.penStyle)
    await this.setTheme(this.theme as PartialDeep<TTheme>)
    await this.setPenStyleClasses(this.penStyleClasses)
  }

  drawCurrentStroke(): void
  {
    this.#logger.debug("drawCurrentStroke", { stroke: this.model.currentSymbol })
    const currentSymbol = this.model.currentSymbol as Stroke
    if (currentSymbol) {
      this.renderer.drawPendingStroke(currentSymbol)
    }
  }

  async synchronizeModelWithBackend(): Promise<IModel>
  {
    this.#logger.info("synchronizeModelWithBackend")
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      const unsentStrokes = this.model.extractUnsentStrokes()
      this.model.updatePositionSent()
      this.history.push(this.model)
      this.renderer.clearErasingStrokes()
      const exports = await this.recognizer.addStrokes(unsentStrokes)
      this.model.mergeExport(exports)
      this.history.updateStack(this.model)
    }
    this.#logger.debug("synchronizeModelWithBackend", this.model)
    return this.model
  }

  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    this.#logger.info("export", { mimeTypes })
    try {
      if (this.#configuration.triggers.exportContent === "DEMAND") {
        const unsentStrokes = this.model.extractUnsentStrokes()
        this.model.updatePositionSent()
        const exports = await this.recognizer.addStrokes(unsentStrokes)
        this.model.updatePositionReceived()
        this.model.mergeExport(exports)
        this.#logger.debug("export", this.model)
        return this.model
      } else {
        return this.recognizer.export(this.model, mimeTypes)
      }
    } catch (error) {
      this.#logger.error("export", { error })
      this.event.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(conversionState?: TConverstionState): Promise<IModel>
  {
    this.#logger.info("convert", { conversionState })
    this.history.push(this.model)
    this.history.stack.push(this.model.clone())
    this.#model = await this.recognizer.convert(this.model, conversionState)
    this.#logger.debug("convert", this.model)
    this.history.push(this.model)
    this.event.emitConverted(this.model.converts as TExport)
    return this.model
  }

  async import(data: Blob, mimeType?: string): Promise<IModel>
  {
    this.#logger.info("import", { data, mimeType })
    this.history.stack.push(this.model.clone())
    const m = await this.recognizer.import(this.model, data, mimeType)
    this.history.push(m)
    this.event.emitImported(this.model.exports as TExport)
    return m
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<IModel>
  {
    this.#logger.info("importPointEvents", { strokes })
    const errors: string[] = []
    const strokesToImport = strokes.map((s, strokeIndex) =>
    {
      const str = new Stroke(s.style || DefaultPenStyle, s.pointerType)
      if (s.id) str.id = s.id
      if (s.pointerType) str.pointerType = s.pointerType
      if (!s.pointers?.length) {
        errors.push(`stroke ${ strokeIndex + 1 } has not pointers`)
      }
      let flag = true
      s.pointers?.forEach((pp, pIndex) =>
      {
        flag = true
        if (!pp) {
          errors.push(`stroke ${ strokeIndex + 1 } has no pointer at ${ pIndex }`)
          return
        }
        const pointer: TPointer = {
          p: pp.p || 1,
          t: pp.t || pIndex,
          x: 0,
          y: 0
        }
        if (pp?.x == undefined || pp?.x == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no x at pointer at ${ pIndex }`)
          flag = false
        }
        else {
          pointer.x = pp.x
        }
        if (pp?.y == undefined || pp?.y == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no y at pointer at ${ pIndex }`)
          flag = false
        }
        else {
          pointer.y = pp.y
        }
        if (flag) {
          str.pointers.push(pointer)
        }
      })
      return str
    })
    if (errors.length) {
      this.event.emitError(new Error(errors.join("\n")))
    }
    strokesToImport.map(s => this.model.addStroke(s))
    const exportPoints = await this.recognizer.importPointEvents(strokesToImport)
    this.model.mergeExport(exportPoints)
    this.#logger.debug("importPointEvents", this.model)
    return this.model
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    this.#logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<Model>()
    this.model.height = height
    this.model.width = width
    const clonedModel = this.model.clone()
    this.renderer.resize(clonedModel)
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      try {
        const resizeModel = await this.recognizer.resize(clonedModel)
        deferredResize.resolve(resizeModel)
      } catch (error) {
        this.#logger.error("resize", { height, width, error })
        deferredResize.reject(error as Error)
      }
    }, this.#configuration.triggers.resizeTriggerDelay)

    this.#model = await deferredResize.promise
    this.smartGuide?.resize()
    this.event.emitExported(this.model.exports as TExport)
    this.#logger.debug("resize", this.model)
    return this.model
  }

  async undo(): Promise<IModel>
  {
    this.#logger.info("undo")
    if (this.history.context.canUndo) {
      this.#model = this.history.undo() as Model
      return this.recognizer.undo(this.model)
    }
    else {
      throw new Error("Undo not allowed")
    }
  }

  async redo(): Promise<IModel>
  {
    this.#logger.info("redo")
    if (this.history.context.canRedo) {
      this.#model = this.history.redo() as Model
      this.#logger.debug("undo", this.#model)
      return this.recognizer.redo(this.model)
    }
    else {
      throw new Error("Redo not allowed")
    }
  }

  async clear(): Promise<IModel>
  {
    this.#logger.info("clear")
    this.model.clear()
    this.history.push(this.model)
    await this.recognizer.clear(this.model)
    this.event.emitCleared()
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.destroy()
    this.smartGuide?.destroy()
    return Promise.resolve()
  }
}
