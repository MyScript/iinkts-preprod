import { IBehaviors, TBehaviorOptions } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TStroke } from "../@types/model/Stroke"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"
import { TPointer } from "../@types/geometry"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { ModeInteraction, WSMessage } from "../Constants"
import { InternalEvent } from "../event/InternalEvent"
import { DeferredPromise } from "../utils/DeferredPromise"
import { WSSVGRenderer } from "../renderer/svg/WSSVGRenderer"
import { StyleManager } from "../style/StyleManager"
import { Configuration } from "../configuration/Configuration"
import { Model } from "../model/Model"
import { UndoRedoManager } from "../undo-redo"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class WSBehaviors implements IBehaviors
{
  name = "WSBehaviors"
  options: TBehaviorOptions
  grabber: PointerEventGrabber
  renderer: WSSVGRenderer
  recognizer: WSRecognizer
  undoRedoManager: UndoRedoManager
  styleManager: StyleManager
  #configuration: TConfiguration
  #model: IModel
  mode: ModeInteraction
  #logger: Logger

  #resizeTimer?: ReturnType<typeof setTimeout>

  constructor(options: TBehaviorOptions)
  {
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.BEHAVIORS)
    this.#logger.info("constructor", { options })
    this.options = options
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options.penStyle, options.theme)

    this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    this.renderer = new WSSVGRenderer(this.#configuration.rendering)
    this.recognizer = new WSRecognizer(this.#configuration.server, this.#configuration.recognition)

    this.mode = ModeInteraction.Writing
    this.#model = new Model()
    this.undoRedoManager = new UndoRedoManager(this.#configuration["undo-redo"], this.model)
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get model(): IModel
  {
    return this.#model
  }

  get context(): TUndoRedoContext
  {
    return this.undoRedoManager.context
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
  setPenStyle(ps?: TPenStyle): Promise<void>
  {
    this.#logger.debug("setPenStyle", { ps })
    this.#logger.info("setPenStyle", { ps })
    this.styleManager.setPenStyle(ps)
    this.#logger.debug("setPenStyle", this.styleManager.penStyle)
    return this.recognizer.setPenStyle(this.styleManager.penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  setPenStyleClasses(psc?: string): Promise<void>
  {
    this.#logger.debug("setPenStyleClasses", { psc })
    this.#logger.info("setPenStyleClasses", { psc })
    this.styleManager.setPenStyleClasses(psc)
    this.#logger.debug("setPenStyleClasses", this.styleManager.penStyleClasses)
    return this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  setTheme(t: TTheme): Promise<void>
  {
    this.#logger.debug("setTheme", { t })
    this.#logger.info("setTheme", { t })
    this.styleManager.setTheme(t)
    this.#logger.debug("setTheme", this.styleManager.theme)
    return this.recognizer.setTheme(this.styleManager.theme)
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    this.#logger.info("init", { domElement })
    this.model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
    this.model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
    this.undoRedoManager.updateModelInStack(this.model)

    this.renderer.init(domElement)

    this.grabber.attach(domElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    this.internalEvent.addSVGPatchListener(this.onSVGPatch)

    await this.recognizer.init(this.model.height, this.model.width)
    await this.setPenStyle(this.penStyle)
    await this.setTheme(this.theme)
    await this.setPenStyleClasses(this.penStyleClasses)
  }

  private onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerDown", { evt, point })
    let { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    if (this.mode === ModeInteraction.Erasing) {
      pointerType = "eraser"
    }
    this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
    this.drawCurrentStroke()
  }

  private onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerMove", { _evt, point })
    this.model.appendToCurrentStroke(point)
    this.drawCurrentStroke()
  }

  private async onPointerUp(_evt: PointerEvent, point: TPointer): Promise<void>
  {
    try {
      this.#logger.info("onPointerUp", { _evt, point })
      this.model.endCurrentStroke(point)
      await this.updateModelRendering()
    } catch (error) {
      this.internalEvent.emitError(error as Error)
    }
  }

  private onSVGPatch = (evt: TWebSocketSVGPatchEvent) =>
  {
    this.#logger.info("onSVGPatch", { evt })
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  drawCurrentStroke(): void
  {
    const currentStroke = this.model.currentStroke as TStroke
    if (currentStroke) {
      this.renderer.drawPendingStroke(currentStroke)
    }
  }

  async updateModelRendering(): Promise<IModel>
  {
    this.#logger.debug("updateModelRendering", this.model)
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      const unsentStrokes = this.model.extractUnsentStrokes()
      this.model.updatePositionSent()
      this.undoRedoManager.addModelToStack(this.model)
      this.renderer.clearErasingStrokes()
      const exports = await this.recognizer.addStrokes(unsentStrokes)
      this.model.mergeExport(exports)
      this.undoRedoManager.updateModelInStack(this.model)
    }
    this.#logger.debug("updateModelRendering", this.model)
    return this.model
  }

  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  async importPointEvents(strokes: TStroke[]): Promise<IModel | never>
  {
    this.#logger.debug("importPointEvents", this.model)
    this.#logger.info("importPointEvents", { strokes })
    const exportPoints = await this.recognizer.importPointEvents(strokes)
    this.model.mergeExport(exportPoints)
    this.#logger.debug("importPointEvents", this.model)
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IModel | never>
  {
    this.#logger.debug("export", this.model)
    this.#logger.info("export", { mimeTypes })
    try {
      if (this.#configuration.triggers.exportContent === "DEMAND") {
        const unsentStrokes = this.model.extractUnsentStrokes()
        this.model.updatePositionSent()
        const exports = await this.recognizer.addStrokes(unsentStrokes)
        this.model.updatePositionReceived()
        this.model.mergeExport(exports)
        return this.model
      } else {
        return this.recognizer.export(this.model, mimeTypes)
      }
    } catch (error) {
      this.#logger.error("export", { error } )
      this.internalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(conversionState?: TConverstionState): Promise<IModel | never>
  {
    this.#logger.debug("convert", this.model)
    this.#logger.info("convert", { conversionState })
    this.context.stack.push(this.model.getClone())
    this.#model = await this.recognizer.convert(this.model, conversionState)
    this.#logger.debug("convert", this.model)
    this.undoRedoManager.addModelToStack(this.model)
    return this.model
  }

  async import(data: Blob, mimeType?: string): Promise<IModel | never>
  {
    this.#logger.info("import", { data, mimeType })
    this.context.stack.push(this.model.getClone())
    const m = await this.recognizer.import(this.model, data, mimeType)
    this.undoRedoManager.addModelToStack(m)
    return m
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    this.#logger.info("resize", { height, width })
    this.#logger.debug("resize", this.model)
    const deferredResize = new DeferredPromise<IModel>()
    this.model.height = height
    this.model.width = width
    const clonedModel = this.model.getClone()
    this.renderer.resize(clonedModel)
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      try {
        const resizeModel = await this.recognizer.resize(clonedModel)
        deferredResize.resolve(resizeModel)
      } catch (error) {
        this.#logger.error("resize", { height, width, error } )
        deferredResize.reject(error as Error)
      }
    }, this.#configuration.triggers.resizeTriggerDelay)

    this.#model = await deferredResize.promise
    this.internalEvent.emitExported(this.model.exports as TExport)
    this.#logger.debug("resize", this.model)
    return this.model
  }

  async undo(): Promise<IModel>
  {
    this.#logger.debug("undo", this.#model)
    this.#logger.info("undo", {})
    if (this.context.canUndo) {
      this.#model = this.undoRedoManager.undo()
      return this.recognizer.undo(this.model)
    }
    else {
      this.#logger.error( "undo", { "Redo Not Allowed": String })
      throw new Error("Undo not allowed")
    }
  }

  async redo(): Promise<IModel>
  {
    this.#logger.debug("redo", this.#model)
    this.#logger.info("redo", {})
    if (this.context.canRedo) {
      this.#model = this.undoRedoManager.redo()
      this.#logger.debug("undo", this.#model)
      return this.recognizer.redo(this.model)
    }
    else {
      this.#logger.error("redo", { "Redo Not Allowed": String })
      throw new Error("Redo not allowed")
    }
  }

  async clear(): Promise<IModel>
  {
    this.#logger.info("clear", this.model)
    this.model.clear()
    this.undoRedoManager.addModelToStack(this.model)
    return this.recognizer.clear(this.model)
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy", {})
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.close(1000, WSMessage.CLOSE_RECOGNIZER)
    return Promise.resolve()
  }
}
