import { TIIHistoryBackendChanges, THistoryContext } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"
import { TExport, TJIIXExport, TJIIXMathElement } from "@/model"
import { IIStroke } from "@/symbol"
import { TMatrixTransform } from "@/transform"
import { computeHmac, mergeDeep, DeferredPromise, PartialDeep, isVersionSuperiorOrEqual, getApiInfos } from "@/utils"
import
{
  TRecognizerWebSocketMessage,
  TRecognizerWebSocketMessageContentChange,
  TRecognizerWebSocketMessageContextlessGesture,
  TRecognizerWebSocketMessageError,
  TRecognizerWebSocketMessageExport,
  TRecognizerWebSocketMessageGesture,
  TRecognizerWebSocketMessageHMACChallenge,
  TRecognizerWebSocketMessageNewPart,
  TRecognizerWebSocketMessagePartChange,
  TRecognizerWebSocketMessageReceived,
  TRecognizerWebSocketMessageType,
  TInteractiveInkSessionDescriptionMessage,
  TRecognizerWebSocketMessageMathSolverResult,
  TMathVariable,
  TMathEvaluable,
  TMathVariableDefinition,
  TMathVariableDefinitions
} from "./RecognizerWebSocketMessage"
import { RecognizerError, mapCloseCodeToMessage } from "./RecognizerError"
import PingWorker from "web-worker:../worker/ping.worker.ts"
import { RecognizerEvent } from "./RecognizerEvent"
import { RecognizerWebSocketConfiguration, TRecognizerWebSocketConfiguration } from "./RecognizerWebSocketConfiguration"

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "partChanged" }
 * { type: "addStrokes" }                             ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "transform" }                              ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "eraseStrokes" }                           ==================>
 *                                                    <==================       { type: "contentChanged" }
 */

/**
 * @group Recognizer
 */
export class RecognizerWebSocket
{
  #logger = LoggerManager.getLogger(LoggerCategory.RECOGNIZER)

  protected socket!: WebSocket
  protected pingWorker?: Worker
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string

  protected boundOpenCallback: () => void
  protected boundCloseCallback: (evt: CloseEvent) => void
  protected boundMessageCallback: (message: MessageEvent<string>) => void
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  protected addStrokeDeferred?: DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>
  protected contextlessGestureDeferred: Map<string, DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>>
  protected transformStrokeDeferred?: DeferredPromise<void>
  protected eraseStrokeDeferred?: DeferredPromise<void>
  protected replaceStrokeDeferred?: DeferredPromise<void>
  protected exportDeferredMap: Map<string, DeferredPromise<TExport>>
  protected closeDeferred?: DeferredPromise<void>
  protected waitForIdleDeferred?: DeferredPromise<void>
  protected undoDeferred?: DeferredPromise<void>
  protected redoDeferred?: DeferredPromise<void>
  protected clearDeferred?: DeferredPromise<void>
  protected availableActionsDeferred: Map<string, DeferredPromise<string[]>[]>
  protected numericalComputationDeferred: Map<string, DeferredPromise<string>[]>
  protected getDiagnosticDeferred: Map<string, DeferredPromise<string>[]>
  protected getVariablesDeferred: Map<string, DeferredPromise<TMathVariable[]>[]>
  protected setVariableValueDeferred: Map<string, DeferredPromise<void>[]>
  protected getVariableValueDeferred: Map<string, DeferredPromise<number>[]>
  protected removeVariableValueDeferred: Map<string, DeferredPromise<void>[]>
  protected asVariableDefinitionDeferred: Map<string, DeferredPromise<TMathVariableDefinition>[]>
  protected getVariableDefinitionsDeferred: DeferredPromise<TMathVariableDefinitions[]>[]
  protected getEvaluablesDeferred: Map<string, DeferredPromise<TMathEvaluable[]>[]>
  protected evaluateDeferred: Map<string, DeferredPromise<number[][]>[]>

  configuration: RecognizerWebSocketConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: RecognizerEvent

  constructor(config: PartialDeep<TRecognizerWebSocketConfiguration>, event?: RecognizerEvent)
  {
    this.#logger.info("constructor", { config })
    this.configuration = new RecognizerWebSocketConfiguration(config)
    const scheme = (this.configuration.server.scheme === "https") ? "wss" : "ws"
    this.url = `${ scheme }://${ this.configuration.server.host }/api/v4.0/iink/offscreen?applicationKey=${ this.configuration.server.applicationKey }`

    this.event = event || new RecognizerEvent()
    this.initialized = new DeferredPromise<void>()
    this.boundOpenCallback = this.openCallback.bind(this)
    this.boundCloseCallback = this.closeCallback.bind(this)
    this.boundMessageCallback = this.messageCallback.bind(this)
    this.exportDeferredMap = new Map()
    this.contextlessGestureDeferred = new Map()
    this.availableActionsDeferred = new Map()
    this.numericalComputationDeferred = new Map()
    this.getDiagnosticDeferred = new Map()
    this.getVariablesDeferred = new Map()
    this.setVariableValueDeferred = new Map()
    this.getVariableValueDeferred = new Map()
    this.removeVariableValueDeferred = new Map()
    this.asVariableDefinitionDeferred = new Map()
    this.getVariableDefinitionsDeferred = []
    this.getEvaluablesDeferred = new Map()
    this.evaluateDeferred = new Map()
  }

  get mimeTypes(): string[]
  {
    return ["application/vnd.myscript.jiix"]
  }

  async #send(message: TRecognizerWebSocketMessage): Promise<void>
  {
    if (!this.socket) {
      throw new Error("Recognizer must be initilized")
    }
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
    else {
      throw new Error(`Can not send message: ${message.type}, connection not ready, state: ${ this.socket.readyState }`)
    }
  }

  protected rejectDeferredPending(error: Error | string): void
  {
    this.initialized.reject(error)
    this.addStrokeDeferred?.reject(error)
    this.transformStrokeDeferred?.reject(error)
    this.eraseStrokeDeferred?.reject(error)
    this.replaceStrokeDeferred?.reject(error)
    this.undoDeferred?.reject(error)
    this.redoDeferred?.reject(error)
    this.clearDeferred?.reject(error)
    Array.from(this.contextlessGestureDeferred.values())
      .forEach(v =>
      {
        v.reject(error)
      })
    Array.from(this.exportDeferredMap.values())
      .forEach(v =>
      {
        v.reject(error)
      })
    this.waitForIdleDeferred?.reject(error)
  }

  protected resetAllDeferred(): void
  {
    this.initialized = new DeferredPromise<void>()
    this.addStrokeDeferred = undefined
    this.contextlessGestureDeferred.clear()
    this.transformStrokeDeferred = undefined
    this.eraseStrokeDeferred = undefined
    this.replaceStrokeDeferred = undefined
    this.exportDeferredMap.clear()
    this.waitForIdleDeferred = undefined
    this.undoDeferred = undefined
    this.redoDeferred = undefined
    this.closeDeferred = undefined
    this.availableActionsDeferred.clear()
    this.numericalComputationDeferred.clear()
    this.getDiagnosticDeferred.clear()
    this.getVariablesDeferred.clear()
    this.setVariableValueDeferred.clear()
    this.getVariableValueDeferred.clear()
    this.removeVariableValueDeferred.clear()
    this.asVariableDefinitionDeferred.clear()
    this.getVariableDefinitionsDeferred = []
    this.getEvaluablesDeferred.clear()
    this.evaluateDeferred.clear()
  }

  protected clearSocketListener(): void
  {
    this.socket.removeEventListener("open", this.boundOpenCallback)
    this.socket.removeEventListener("close", this.boundCloseCallback)
    this.socket.removeEventListener("message", this.boundMessageCallback)
  }

  protected closeCallback(evt: CloseEvent): void
  {
    this.#logger.info("closeCallback", { evt })
    let message = evt.reason
    if (!this.currentErrorCode) {
      message = mapCloseCodeToMessage(evt.code) ?? RecognizerError.CANT_ESTABLISH
    }

    this.clearSocketListener()
    this.closeDeferred?.resolve()
    if (!this.currentErrorCode && evt.code !== 1000) {
      const error = new Error(message)
      this.event.emitError(error)
      this.rejectDeferredPending(message)
    }
    this.pingWorker?.terminate()
    this.resetAllDeferred()
  }

  protected openCallback(): void
  {
    this.reconnectionCount = 0
    this.#send({
      type: "authenticate",
      "myscript-client-name": "iink-ts",
      "myscript-client-version": "1.0.0-buildVersion",
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TRecognizerWebSocketMessageHMACChallenge): Promise<void>
  {
    let hmacKey: string
    if (typeof this.configuration.server.hmacKey == "string") {
      hmacKey = this.configuration.server.hmacKey
    } else if (typeof this.configuration.server.hmacKey == "function") {
      hmacKey = await this.configuration.server.hmacKey(this.configuration.server.applicationKey)
    }
    else {
      return this.initialized.reject(new Error("HMAC key is not a string nor a function"))
    }
    if (!hmacKey) {
      return this.initialized.reject(new Error("HMAC key is required"))
    }
    this.#send({
      type: "hmac",
      hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.configuration.server.applicationKey, hmacKey)
    })
  }

  protected initPing(): void
  {
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({
      pingDelay: this.configuration.server.websocket.pingDelay,
    })
    this.pingWorker.onmessage = () =>
    {
      if (this.socket.readyState <= 1) {
        if (this.pingCount < this.configuration.server.websocket.maxPingLostCount) {
          this.send({ type: "ping" })
        }
        else {
          this.close(1000, "MAXIMUM_PING_REACHED")
          this.pingWorker?.terminate()
        }
        this.pingCount++
      }
    }
  }

  protected manageAuthenticated(): void
  {
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
      delete this.configuration.recognition["raw-content"].classification
    }
    const pixelTomm = 25.4 / 96
    this.#send({
      type: this.sessionId ? "restoreSession" : "initSession",
      iinkSessionId: this.sessionId,
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      configuration: this.configuration.recognition
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void
  {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    if (this.currentPartId) {
      this.#send({ type: "openContentPart", id: this.currentPartId })
    }
    else {
      this.#send({ type: "newContentPart", contentType: "Raw Content", mimeTypes: this.mimeTypes })
    }
  }

  protected manageNewPartMessage(newPartMessage: TRecognizerWebSocketMessageNewPart): void
  {
    this.initialized.resolve()
    this.currentPartId = newPartMessage.id
  }

  protected managePartChangeMessage(partChangeMessage: TRecognizerWebSocketMessagePartChange): void
  {
    this.initialized.resolve()
    this.currentPartId = partChangeMessage.partId
  }

  protected manageContentChangedMessage(contentChangeMessage: TRecognizerWebSocketMessageContentChange): void
  {
    this.initialized.resolve()
    this.replaceStrokeDeferred?.resolve()
    this.transformStrokeDeferred?.resolve()
    this.eraseStrokeDeferred?.resolve()
    this.undoDeferred?.resolve()
    this.redoDeferred?.resolve()
    this.clearDeferred?.resolve()
    this.event.emitContentChanged({
      canRedo: contentChangeMessage.canRedo,
      canUndo: contentChangeMessage.canUndo,
    } as THistoryContext)
  }

  protected manageExportMessage(exportMessage: TRecognizerWebSocketMessageExport): void
  {
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(exportMessage.exports["application/vnd.myscript.jiix"].toString()) as TJIIXExport
    }

    Object.keys(exportMessage.exports)
      .forEach(key =>
      {
        if (this.exportDeferredMap.has(key)) {
          this.exportDeferredMap.get(key)!.resolve(exportMessage.exports)
        }
      })
    this.event.emitExported(exportMessage.exports)
  }

  protected manageWaitForIdle(): void
  {
    this.waitForIdleDeferred?.resolve()
    this.event.emitIdle(true)
  }

  protected manageErrorMessage(errorMessage: TRecognizerWebSocketMessageError): void
  {
    this.currentErrorCode = errorMessage.data?.code || errorMessage.code
    let message = errorMessage.data?.message || errorMessage.message || RecognizerError.UNKNOWN

    if (this.currentErrorCode === "no.activity") {
      this.rejectDeferredPending(message)
      this.event.emitConnectionClose({ code: 1000,  message: RecognizerError.NO_ACTIVITY })
    }
    else {
      switch (this.currentErrorCode) {
        case "access.not.granted":
          message = RecognizerError.WRONG_CREDENTIALS
          break
        case "session.too.old":
          message = RecognizerError.TOO_OLD
          break
        case "restore.session.not.found":
          message = RecognizerError.NO_SESSION_FOUND
          break
      }
      this.rejectDeferredPending(message)
      this.event.emitError(new Error(message))
    }
  }

  protected manageGestureDetected(gestureMessage: TRecognizerWebSocketMessageGesture): void
  {
    this.addStrokeDeferred?.resolve(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TRecognizerWebSocketMessageContextlessGesture): void
  {
    this.contextlessGestureDeferred.get(gestureMessage.strokeId)?.resolve(gestureMessage)
  }

  protected resolveFirstInQueue<T>(map: Map<string, DeferredPromise<T>[]>, blockId: string | undefined, value?: T): void
  {
    if (blockId === undefined || blockId === null) return
    const queue = map.get(blockId)
    if (!queue?.length) return
    queue.shift()!.resolve(value as T)
    if (queue.length === 0) map.delete(blockId)
  }

  protected manageMathSolverResult(mathSolverMessage: TRecognizerWebSocketMessageMathSolverResult): void
  {
    if (mathSolverMessage.action === "get-variable-definitions") {
      if (this.getVariableDefinitionsDeferred.length) {
        this.getVariableDefinitionsDeferred.shift()!.resolve(mathSolverMessage.result)
      }
      return
    }

    const blockId = mathSolverMessage.blockId
    if (blockId === undefined || blockId === null) {
      this.#logger.warn("manageMathSolverResult", "Received math solver result without blockId, unable to resolve corresponding promise", mathSolverMessage)
    }

    switch (mathSolverMessage.action) {
      case "available-actions":
        this.resolveFirstInQueue(this.availableActionsDeferred, blockId, mathSolverMessage.result)
        break;
      case "numerical-computation":
        this.resolveFirstInQueue(this.numericalComputationDeferred, blockId, mathSolverMessage.result)
        break;
      case "get-diagnostic":
        this.resolveFirstInQueue(this.getDiagnosticDeferred, blockId, mathSolverMessage.result)
        break;
      case "get-variables":
        this.resolveFirstInQueue(this.getVariablesDeferred, blockId, mathSolverMessage.result)
        break;
      case "set-variable-value":
        this.resolveFirstInQueue(this.setVariableValueDeferred, blockId)
        break;
      case "get-variable-value":
        this.resolveFirstInQueue(this.getVariableValueDeferred, blockId, mathSolverMessage.result)
        break;
      case "remove-variable-value":
        this.resolveFirstInQueue(this.removeVariableValueDeferred, blockId)
        break;
      case "as-variable-definition":
        this.resolveFirstInQueue(this.asVariableDefinitionDeferred, blockId, mathSolverMessage.result)
        break;
      case "get-evaluables":
        this.resolveFirstInQueue(this.getEvaluablesDeferred, blockId, mathSolverMessage.result)
        break;
      case "evaluate":
        this.resolveFirstInQueue(this.evaluateDeferred, blockId, mathSolverMessage.result)
        break;
      default:
        break;
    }
  }

  protected messageCallback(message: MessageEvent<string>): void
  {
    this.currentErrorCode = undefined
    try {
      const websocketMessage: TRecognizerWebSocketMessageReceived = JSON.parse(message.data)
      if (websocketMessage.type === TRecognizerWebSocketMessageType.Pong) {
        return
      }
      this.pingCount = 0
      switch (websocketMessage.type) {
        case TRecognizerWebSocketMessageType.HMAC_Challenge:
          this.manageHMACChallenge(websocketMessage).catch(err => this.event.emitError(err))
          break
        case TRecognizerWebSocketMessageType.Authenticated:
          this.manageAuthenticated()
          break
        case TRecognizerWebSocketMessageType.SessionDescription:
          this.manageSessionDescriptionMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.NewPart:
          this.manageNewPartMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.PartChanged:
          this.managePartChangeMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.ContentChanged:
          this.manageContentChangedMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Exported:
          this.manageExportMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.GestureDetected:
          this.manageGestureDetected(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.ContextlessGesture:
          this.manageContextlessGesture(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.MathSolverResult:
          this.manageMathSolverResult(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Error:
          this.manageErrorMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Idle:
          this.manageWaitForIdle()
          break
        default:
          this.#logger.warn("messageCallback", `Message type unknown: "${ websocketMessage }".`)
          break
      }
    }
    catch {
      this.event.emitError(new Error(message.data))
    }
  }

  async newSession(config: PartialDeep<TRecognizerWebSocketConfiguration>): Promise<void>
  {
    await this.close(1000, "new-session")
    this.configuration = mergeDeep({}, this.configuration, config)
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async init(): Promise<void>
  {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode = undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    if (!this.configuration.server.version) {
      this.configuration.server.version = (await getApiInfos(this.configuration)).version
    }
    this.socket = new WebSocket(this.url)
    this.clearSocketListener()
    this.socket.addEventListener("open", this.boundOpenCallback)
    this.socket.addEventListener("close", this.boundCloseCallback)
    this.socket.addEventListener("message", this.boundMessageCallback)
    await this.initialized.promise
    if (this.configuration.server.websocket.pingEnabled) {
      this.pingCount = 0
      this.initPing()
    }
    this.event.emitEndtInitialization()
  }

  async send(message: TRecognizerWebSocketMessage): Promise<void>
  {
    if (!this.socket) {
      return Promise.reject(new Error("Recognizer must be initilized"))
    }

    switch (this.socket.readyState) {
      case this.socket.CONNECTING:
      case this.socket.OPEN:
        await this.initialized.promise
        this.#send(message)
        return Promise.resolve()
      case this.socket.CLOSING:
      case this.socket.CLOSED:
        if (this.configuration.server.websocket.autoReconnect) {
          this.reconnectionCount++
          if (this.configuration.server.websocket.maxRetryCount > this.reconnectionCount) {
            await this.init()
            await this.waitForIdle()
            return this.#send(message)
          }
          else {
            return Promise.reject(new Error("Unable to send message. The maximum number of connection attempts has been reached."))
          }
        }
        else {
          return Promise.reject(new Error("Unable to send message. Connection closed and automatic reconnection disabled"))
        }
        break
    }
  }

  protected buildAddStrokesMessage(strokes: IIStroke[], processGestures = true): TRecognizerWebSocketMessage
  {
    return {
      type: "addStrokes",
      processGestures,
      strokes: strokes.map(s => s.formatToSend())
    }
  }
  async addStrokes(strokes: IIStroke[], processGestures = true): Promise<TRecognizerWebSocketMessageGesture | undefined>
  {
    this.addStrokeDeferred = new DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve(undefined)
      return this.addStrokeDeferred?.promise
    }
    await this.send(this.buildAddStrokesMessage(strokes, processGestures))
    return this.addStrokeDeferred?.promise
  }

  async getAvailableActions(blockId: string): Promise<string[]>
  {
    const deferred = new DeferredPromise<string[]>()
    const queue = this.availableActionsDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.availableActionsDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "available-actions",
      blockId,
    })
    return deferred.promise
  }

  async getNumericalComputation(blockId: string): Promise<TJIIXMathElement>
  {
    const deferred = new DeferredPromise<string>()
    const queue = this.numericalComputationDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.numericalComputationDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "numerical-computation",
      blockId: blockId
    })
    return JSON.parse(await deferred.promise) as TJIIXMathElement
  }

  async getDiagnostic(blockId: string, task: string): Promise<string>
  {
    const deferred = new DeferredPromise<string>()
    const queue = this.getDiagnosticDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getDiagnosticDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-diagnostic",
      task,
      blockId
    })
    return deferred.promise
  }

  async getVariables(blockId: string): Promise<TMathVariable[]>
  {
    const deferred = new DeferredPromise<TMathVariable[]>()
    const queue = this.getVariablesDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getVariablesDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-variables",
      blockId
    })
    return deferred.promise
  }

  async getVariableValue(blockId: string, variableName: string): Promise<number>
  {
    const deferred = new DeferredPromise<number>()
    const queue = this.getVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-variable-value",
      blockId,
      variableName
    })
    return deferred.promise
  }

  async setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void>
  {
    const deferred = new DeferredPromise<void>()
    const queue = this.setVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.setVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "set-variable-value",
      blockId,
      variableName,
      variableValue
    })
    await deferred.promise
  }

  async removeVariableValue(blockId: string, variableName: string): Promise<void>
  {
    const deferred = new DeferredPromise<void>()
    const queue = this.removeVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.removeVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "remove-variable-value",
      blockId,
      variableName
    })
    await deferred.promise
  }

  async asVariableDefinition(blockId: string): Promise<TMathVariableDefinition>
  {
    const deferred = new DeferredPromise<TMathVariableDefinition>()
    const queue = this.asVariableDefinitionDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.asVariableDefinitionDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "as-variable-definition",
      blockId
    })
    return deferred.promise
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]>
  {
    const deferred = new DeferredPromise<TMathVariableDefinitions[]>()
    this.getVariableDefinitionsDeferred.push(deferred)
    await this.send({
      type: "mathSolver",
      action: "get-variable-definitions"
    })
    return deferred.promise
  }

  async getEvaluables(blockId: string): Promise<TMathEvaluable[]>
  {
    const deferred = new DeferredPromise<TMathEvaluable[]>()
    const queue = this.getEvaluablesDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getEvaluablesDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-evaluables",
      blockId
    })
    return deferred.promise
  }

  async evaluate(blockId: string, evaluation: {
    inputVariableName: string,
    outputVariableName: string,
    from: number,
    to: number,
    pointCount: number
  }): Promise<{ [key: string]: number }[][]>
  {
    const deferred = new DeferredPromise<number[][]>()
    const queue = this.evaluateDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.evaluateDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "evaluate",
      blockId,
      evaluation
    })
    const result = await deferred.promise

    // Transform result arrays to series of points
    // Result format: [[x1, y1, x2, y2, ...], [x1, y1, x2, y2, ...]] for multiple curves
    const allSeries: { [key: string]: number }[][] = []

    for (const flatArray of result) {
      const points: { [key: string]: number }[] = []

      // Server always returns [x1, y1, x2, y2, ...] format, even for constant functions
      const xKey = evaluation.inputVariableName || "x"
      const yKey = evaluation.outputVariableName || "?"

      for (let i = 0; i < flatArray.length; i += 2) {
        if (i + 1 < flatArray.length) {
          const xVal = flatArray[i]
          const yVal = flatArray[i + 1]

          points.push({
            [xKey]: xVal,
            [yKey]: yVal
          })
        }
      }

      allSeries.push(points)
    }

    this.#logger.info("Evaluate result transformed", {
      inputVar: evaluation.inputVariableName || "x",
      outputVar: evaluation.outputVariableName || "?",
      seriesCount: allSeries.length,
      totalPoints: allSeries.reduce((sum, series) => sum + series.length, 0)
    })

    this.evaluateDeferred.delete(blockId)
    return allSeries
  }

  protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: IIStroke[]): TRecognizerWebSocketMessage
  {
    return {
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map(s => s.formatToSend())
    }
  }
  async replaceStrokes(oldStrokeIds: string[], newStrokes: IIStroke[]): Promise<void>
  {
    this.replaceStrokeDeferred = new DeferredPromise<void>()
    if (oldStrokeIds.length === 0) {
      this.replaceStrokeDeferred.resolve()
      return this.replaceStrokeDeferred?.promise
    }
    await this.send(this.buildReplaceStrokesMessage(oldStrokeIds, newStrokes))
    return this.replaceStrokeDeferred?.promise
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TRecognizerWebSocketMessage
  {
    return {
      type: "transform",
      transformationType: "TRANSLATE",
      strokeIds,
      tx,
      ty
    }
  }
  async transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformTranslateMessage(strokeIds, tx, ty))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): TRecognizerWebSocketMessage
  {
    return {
      type: "transform",
      transformationType: "ROTATE",
      strokeIds,
      angle,
      x0,
      y0
    }
  }
  async transformRotate(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformRotateMessage(strokeIds, angle, x0, y0))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0: number = 0, y0: number = 0): TRecognizerWebSocketMessage
  {
    return {
      type: "transform",
      transformationType: "SCALE",
      strokeIds,
      scaleX,
      scaleY,
      x0,
      y0
    }
  }
  async transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0: number = 0, y0: number = 0): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformScaleMessage(strokeIds, scaleX, scaleY, x0, y0))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TRecognizerWebSocketMessage
  {
    return {
      type: "transform",
      transformationType: "MATRIX",
      strokeIds,
      ...matrix
    }
  }
  async transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformMatrixMessage(strokeIds, matrix))
    return this.transformStrokeDeferred?.promise
  }

  protected buildEraseStrokesMessage(strokeIds: string[]): TRecognizerWebSocketMessage
  {
    return {
      type: "eraseStrokes",
      strokeIds
    }
  }
  async eraseStrokes(strokeIds: string[]): Promise<void>
  {
    this.eraseStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.eraseStrokeDeferred.resolve()
      return this.eraseStrokeDeferred?.promise
    }
    await this.send(this.buildEraseStrokesMessage(strokeIds))
    return this.eraseStrokeDeferred?.promise
  }

  async recognizeGesture(stroke: IIStroke): Promise<TRecognizerWebSocketMessageContextlessGesture | undefined>
  {
    if (!stroke) {
      return
    }
    this.contextlessGestureDeferred.set(stroke.id, new DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>())
    const pixelTomm = 25.4 / 96
    await this.send({
      type: "contextlessGesture",
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      stroke: stroke.formatToSend()
    })
    return this.contextlessGestureDeferred.get(stroke.id)!.promise
  }

  async waitForIdle(): Promise<void>
  {
    if (!this.waitForIdleDeferred || this.waitForIdleDeferred.isFullFilled) {
      this.waitForIdleDeferred = new DeferredPromise<void>()
    }
    const message: TRecognizerWebSocketMessage = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TRecognizerWebSocketMessage[]
  {
    const changesMessages: TRecognizerWebSocketMessage[] = []
    if (changes.added?.length) {
      changesMessages.push(this.buildAddStrokesMessage(changes.added, false))
    }
    if (changes.erased?.length) {
      changesMessages.push(this.buildEraseStrokesMessage(changes.erased.map(s => s.id)))
    }
    if (changes.replaced?.newStrokes.length) {
      changesMessages.push(this.buildReplaceStrokesMessage(changes.replaced.oldStrokes.map(s => s.id), changes.replaced.newStrokes))
    }
    if (changes.matrix?.strokes.length) {
      changesMessages.push(this.buildTransformMatrixMessage(changes.matrix.strokes.map(s => s.id), changes.matrix.matrix))
    }
    if (changes.translate?.length) {
      changes.translate.forEach(tr =>
      {
        changesMessages.push(this.buildTransformTranslateMessage(tr.strokes.map(s => s.id), tr.tx, tr.ty))
      })
    }
    if (changes.rotate?.length) {
      changes.rotate.forEach(tr =>
      {
        changesMessages.push(this.buildTransformRotateMessage(tr.strokes.map(s => s.id), tr.angle, tr.center.x, tr.center.y))
      })
    }
    if (changes.scale?.length) {
      changes.scale.forEach(tr =>
      {
        changesMessages.push(this.buildTransformScaleMessage(tr.strokes.map(s => s.id), tr.scaleX, tr.scaleY, tr.origin.x, tr.origin.y))
      })
    }
    return changesMessages
  }

  async undo(actions: TIIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.undoDeferred = new DeferredPromise<void>()
    const message: TRecognizerWebSocketMessage = {
      type: "undo",
      changes
    }
    await this.send(message)
    return this.undoDeferred?.promise
  }

  async redo(actions: TIIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.redoDeferred = new DeferredPromise<void>()

    const message: TRecognizerWebSocketMessage = {
      type: "redo",
      changes
    }
    await this.send(message)
    return this.redoDeferred?.promise
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport>
  {
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes.slice()
    await Promise.all(mimeTypes.map(mt => this.exportDeferredMap.get(mt)?.promise))
    mimeTypes.forEach(mt =>
    {
      this.exportDeferredMap.set(mt, new DeferredPromise<TExport>())
    })

    const message: TRecognizerWebSocketMessage = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes
    }
    await this.send(message)
    const exports = await Promise.all(mimeTypes.map(mt => this.exportDeferredMap.get(mt)!.promise))
    return Object.assign({}, ...exports)
  }

  async clear(): Promise<void>
  {
    this.clearDeferred = new DeferredPromise<void>()
    await this.send({
      type: "clear"
    })
    return this.clearDeferred?.promise
  }

  async close(code: number, reason: string): Promise<void>
  {
    this.resetAllDeferred()
    this.closeDeferred = new DeferredPromise<void>()
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.socket.close(code, reason)
    }
    else {
      this.closeDeferred.resolve()
    }
    await this.closeDeferred.promise
  }

  async destroy(): Promise<void>
  {
    if (this.socket) {
      await this.close(1000, "Recognizer destroyed")
    }
  }
}
