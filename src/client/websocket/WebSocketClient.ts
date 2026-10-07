import PingWorker from "web-worker:../../worker/ping.worker.ts"

import type { TMatrixTransform } from "@/core"
import {
  DeferredPromise,
  isVersionSuperiorOrEqual,
  mergeDeep,
  overrideDeep,
  PX_TO_MM_RATIO,
  type TPartialDeep,
} from "@/core"
import type { TIIHistoryBackendChanges } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"

import { parseExportedJIIX, type TExport } from "../jiix/JIIX"
import type { TJIIXMathElement } from "../jiix/JIIXMath"
import { ClientError, mapCloseCodeToMessage, mapErrorCodeToMessage } from "../shared/ClientError"
import { ClientEvent } from "../shared/ClientEvent"
import { resolveHmac } from "../shared/HmacAuth"
import { ensureServerVersion } from "../shared/infos"
import { redactServerSecrets } from "../shared/ServerConfiguration"
import type { TRecognitionStroke } from "../shared/StrokeSerializer"
import { toWireStroke } from "../shared/StrokeSerializer"
import type { TWebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import { WebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import type {
  TInteractiveInkSessionDescriptionMessage,
  TMathEvaluable,
  TMathSolverAction,
  TMathSolverResultMap,
  TMathVariable,
  TMathVariableDefinition,
  TMathVariableDefinitions,
  TWebSocketClientMessage,
  TWebSocketClientMessageContentChange,
  TWebSocketClientMessageContextlessGesture,
  TWebSocketClientMessageError,
  TWebSocketClientMessageExport,
  TWebSocketClientMessageGesture,
  TWebSocketClientMessageHMACChallenge,
  TWebSocketClientMessageMathSolverResult,
  TWebSocketClientMessageNewPart,
  TWebSocketClientMessagePartChange,
  TWebSocketClientMessageReceived,
} from "./WebSocketClientMessage"
import { readHistoryContext, TWebSocketClientMessageType } from "./WebSocketClientMessage"

const RECEIVED_MESSAGE_TYPES: ReadonlySet<unknown> = new Set(Object.values(TWebSocketClientMessageType))

// Checks the discriminant only: the payload is trusted to match its type, as the server's contract
const isWebSocketClientMessageReceived = (value: unknown): value is TWebSocketClientMessageReceived =>
  typeof value === "object" && value !== null && "type" in value && RECEIVED_MESSAGE_TYPES.has(value.type)

// What one item adds to a message's JSON, for `chunkBySize`.
const wireStrokeSize = (stroke: TRecognitionStroke): number => JSON.stringify(toWireStroke(stroke)).length
const strokeIdSize = (id: string): number => id.length + 2

/**
 * @group Client
 * @summary A request waiting on an answer from the server
 * @remarks `neutral` is what it settles with when a deliberate close makes the answer moot.
 */
export type TPendingRequest = {
  neutral: unknown
  resolve(answer: unknown): void
  reject(error: Error | string): void
}

// `get-variable-definitions` answers for the whole document, not a block: its requests queue under this key
const DOCUMENT_BLOCK_ID = ""

// What a math request settles with when a deliberate close makes it moot
const createMathSolverNeutralResults = (): TMathSolverResultMap => ({
  "available-actions": [],
  // "null" (not "") so callers doing `JSON.parse(await promise)` (see `getNumericalComputation`) get `null` instead of throwing
  "numerical-computation": "null",
  "get-diagnostic": "",
  "get-variables": [],
  "set-variable-value": undefined,
  // NaN, not 0 — 0 would read as a real value; NaN clearly signals "no value"
  "get-variable-value": NaN,
  "remove-variable-value": undefined,
  "as-variable-definition": { name: "", value: NaN },
  "get-variable-definitions": [],
  "get-evaluables": [],
  evaluate: [],
})

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "sendToSupport", [key]:[value] }           ==================>
 *                                                    <==================        { type: "ack" }
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
 * @group Client
 */
export class WebSocketClient {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  protected socket!: WebSocket
  /**
   * Largest message sent in one frame, in characters of its JSON. The backend closes the connection
   * (1009) on an incoming message over 500 KB; half of that leaves room to spare.
   */
  protected maxMessageBytes = 256 * 1024
  protected pingWorker?: Worker
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string

  protected boundOpenCallback: () => void
  protected boundCloseCallback: (evt: CloseEvent) => void
  protected boundMessageCallback: (message: MessageEvent<string>) => void
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  /**
   * Every request waiting on the server, under the key its answer is matched on (`gesture:<strokeId>`,
   * `export:<mimeType>`, `math:<action>:<blockId>`, `idle`, `support`), oldest first: the server
   * answers the requests of one key in order.
   */
  protected pendingRequests = new Map<string, TPendingRequest[]>()

  // Resolved once the queued message is actually sent (post-reconnect), not once any server ack
  // arrives — mutating calls (addStrokes, undo, etc.) never wait for a server ack; there's no
  // correlation id on "contentChanged"/"gestureDetected" to safely match one to a specific call.
  protected offlineQueue: {
    message: TWebSocketClientMessage
    deferred: DeferredPromise<void>
  }[] = []
  protected reconnectTimer?: ReturnType<typeof setTimeout>
  protected reconnectAttempts = 0
  // Guards against concurrent init() calls: the offline-queue reconnect loop and the legacy
  // auto-reconnect in `send()` can both observe a closed socket and call init() around the same
  // time. Without this, each would create its own `new WebSocket()`, leaving two live sockets
  // with only the last one referenced by `this.socket`.
  protected connectingPromise: Promise<void> | null = null
  // Set for the duration of a deliberate `close()` (e.g. `newSession()` switching language).
  // `send()`'s legacy auto-reconnect must wait for this instead of racing its own `init()` against
  // the one `newSession()` issues right after — starting a second socket before the first one's
  // close handshake completes has left the server never answering on either connection.
  protected closingPromise: Promise<void> | null = null

  configuration: WebSocketClientConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: ClientEvent

  constructor(config: TPartialDeep<TWebSocketClientConfiguration>, event?: ClientEvent) {
    this.logger.info("constructor", { config: redactServerSecrets(config) })
    this.configuration = new WebSocketClientConfiguration(config)
    const scheme = this.configuration.server.scheme === "https" ? "wss" : "ws"
    this.url = `${scheme}://${this.configuration.server.host}/api/v4.0/iink/offscreen?applicationKey=${encodeURIComponent(this.configuration.server.applicationKey)}`

    this.event = event || new ClientEvent()
    this.initialized = new DeferredPromise<void>()
    this.boundOpenCallback = this.openCallback.bind(this)
    this.boundCloseCallback = this.closeCallback.bind(this)
    this.boundMessageCallback = this.messageCallback.bind(this)
  }

  get mimeTypes(): string[] {
    return ["application/vnd.myscript.jiix"]
  }

  /**
   * Number of addStrokes batches currently queued locally while disconnected.
   */
  get offlineQueueLength(): number {
    return this.offlineQueue.length
  }

  /**
   * True while strokes are queued locally waiting for reconnection (see `server.websocket.offlineQueueEnabled`).
   */
  get isOffline(): boolean {
    return this.offlineQueueLength > 0
  }

  protected sendOnSocket(message: TWebSocketClientMessage): void {
    if (!this.socket) {
      throw new Error("Client must be initialized")
    }
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      throw new Error(`Can not send message: ${message.type}, connection not ready, state: ${this.socket.readyState}`)
    }
  }

  protected rejectDeferredPending(error: Error | string): void {
    this.initialized.reject(error)
    this.pendingRequests.forEach((requests) => requests.forEach((request) => request.reject(error)))
    // The server answers none of them now, so a later answer must not settle another request
    this.pendingRequests.clear()
  }

  /** Registers a request under the key its answer will be matched on, after those already waiting there. */
  protected waitForAnswer<T>(key: string, neutral: T): DeferredPromise<T> {
    const deferred = new DeferredPromise<T>()
    const requests = this.pendingRequests.get(key) ?? []
    requests.push({ neutral, resolve: deferred.resolve, reject: deferred.reject })
    this.pendingRequests.set(key, requests)
    return deferred
  }

  /** Settles the oldest request waiting on `key`, or all of them, with the server's answer. */
  protected answer(key: string, answer: unknown, all = false): void {
    const requests = this.pendingRequests.get(key) ?? []
    const answered = all ? requests.splice(0) : requests.splice(0, 1)
    if (!requests.length) {
      this.pendingRequests.delete(key)
    }
    answered.forEach((request) => request.resolve(answer))
  }

  /** Drops a request that was never sent: left waiting, it would take the answer meant for the next one. */
  protected withdraw(key: string, reject: TPendingRequest["reject"]): void {
    const requests = (this.pendingRequests.get(key) ?? []).filter((request) => request.reject !== reject)
    if (requests.length) {
      this.pendingRequests.set(key, requests)
    } else {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Settle completion-signal promises (no payload) as resolved rather than rejected — used on a
   * deliberate close (`close()`/`newSession()`), which isn't an error: the operation the caller
   * was waiting on (init, idle) is simply moot now, not failed.
   */
  protected resolveDeferredPending(): void {
    this.initialized.resolve()
    this.pendingRequests.forEach((requests) => requests.forEach((request) => request.resolve(request.neutral)))
    this.pendingRequests.clear()
  }

  protected resetAllDeferred(): void {
    this.initialized = new DeferredPromise<void>()
    this.pendingRequests.clear()
  }

  protected isDisconnected(): boolean {
    return (
      !this.socket || this.socket.readyState === this.socket.CLOSING || this.socket.readyState === this.socket.CLOSED
    )
  }

  protected enqueueOfflineMessage(message: TWebSocketClientMessage, deferred: DeferredPromise<void>): void {
    if (this.offlineQueue.length >= this.configuration.server.websocket.offlineQueueMaxSize) {
      deferred.reject(new Error("Offline queue full: unable to queue addStrokes while disconnected"))
      return
    }
    this.offlineQueue.push({ message, deferred })
    this.event.emitConnectionStatusChanged("offline")
    this.startReconnectLoop()
  }

  protected startReconnectLoop(): void {
    if (this.reconnectTimer) {
      return
    }
    this.scheduleReconnectAttempt()
  }

  protected scheduleReconnectAttempt(): void {
    const { reconnectDelay, maxReconnectAttempts } = this.configuration.server.websocket
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined
      this.reconnectAttempts++
      try {
        await this.init()
      } catch {
        if (this.reconnectAttempts >= maxReconnectAttempts) {
          this.giveUpReconnecting()
        } else {
          this.scheduleReconnectAttempt()
        }
      }
    }, reconnectDelay)
  }

  /**
   * Runs once per successful connection, regardless of which caller triggered it (the
   * reconnect loop above, or the legacy auto-reconnect in `send()`). Cancels any reconnect
   * attempt still scheduled by the other path so it doesn't open a redundant second socket
   * once this one is up, and drains the offline queue since nothing else would.
   */
  protected onConnected(): Promise<void> {
    this.hasConnected = true
    this.clearReconnectLoop()
    this.reconnectAttempts = 0
    this.event.emitConnectionStatusChanged("connected")
    return this.drainOfflineQueue()
  }

  protected async drainOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      if (this.isDisconnected()) {
        this.startReconnectLoop()
        return
      }
      const item = this.offlineQueue[0]
      this.sendOnSocket(item.message)
      item.deferred.resolve()
      this.offlineQueue.shift()
    }
  }

  /**
   * Reconnection attempts exhausted: reject and clear the queue, emit "error", and
   * reset the attempt counter so the next `addStrokes()` (or drop) gets a fresh retry budget.
   */
  protected giveUpReconnecting(): void {
    this.reconnectAttempts = 0
    this.clearOfflineQueue(new Error("Unable to reconnect after offline queueing; queued strokes were not sent"))
    this.event.emitConnectionStatusChanged("error")
  }

  protected clearOfflineQueue(error: Error): void {
    this.offlineQueue.forEach((item) => item.deferred.reject(error))
    this.offlineQueue = []
  }

  protected clearReconnectLoop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  protected clearSocketListener(): void {
    this.socket.removeEventListener("open", this.boundOpenCallback)
    this.socket.removeEventListener("close", this.boundCloseCallback)
    this.socket.removeEventListener("message", this.boundMessageCallback)
  }

  /** Set on the first successful connection: a drop after it is recoverable, one before is not */
  protected hasConnected = false

  /**
   * A network drop (1006, also what each failed reconnection attempt reports) once connected,
   * with the offline queue on: the ink is kept and replayed, so it is a state, not an error.
   * Reported as an error, it opened the canvas error modal over the ink every few seconds.
   */
  protected isRecoverableDrop(evt: CloseEvent): boolean {
    return this.hasConnected && evt.code === 1006 && this.configuration.server.websocket.offlineQueueEnabled
  }

  protected closeCallback(evt: CloseEvent): void {
    this.logger.info("closeCallback", { evt })
    let message = evt.reason
    if (!this.currentErrorCode) {
      message = mapCloseCodeToMessage(evt.code) ?? ClientError.CANT_ESTABLISH
    }

    this.clearSocketListener()
    this.answer("close", undefined, true)
    if (!this.currentErrorCode && evt.code !== 1000) {
      // Pending requests are rejected either way: a reconnection attempt's init() waits on one
      if (!this.isRecoverableDrop(evt)) {
        this.event.emitError(new Error(message))
      }
      this.rejectDeferredPending(message)
    }
    this.pingWorker?.terminate()
    this.resetAllDeferred()
    this.event.emitConnectionStatusChanged("offline")
  }

  protected openCallback(): void {
    this.reconnectionCount = 0
    this.sendOnSocket({
      type: "authenticate",
      "myscript-client-name": "iink-ts",
      "myscript-client-version": "1.0.0-buildVersion",
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TWebSocketClientMessageHMACChallenge): Promise<void> {
    if (
      typeof this.configuration.server.hmacKey !== "function" &&
      typeof this.configuration.server.hmacKey !== "string"
    ) {
      return this.initialized.reject(new Error("HMAC key is not a string nor a function"))
    }
    this.sendOnSocket({
      type: "hmac",
      hmac: await resolveHmac(this.configuration.server, hmacChallengeMessage.hmacChallenge),
    })
  }

  /** A handshake step failed: `init()` waits on `initialized`, so it must hear of it, not only the `error` listeners */
  protected failInitialization(error: unknown): void {
    const reason = error instanceof Error ? error : new Error(String(error))
    this.initialized.reject(reason)
    this.event.emitError(reason)
  }

  protected initPing(): void {
    // init() can run again without the close callback having terminated the previous worker.
    this.pingWorker?.terminate()
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({
      pingDelay: this.configuration.server.websocket.pingDelay,
    })
    this.pingWorker.onmessage = () => {
      if (this.socket.readyState < this.socket.CLOSING) {
        if (this.pingCount < this.configuration.server.websocket.maxPingLostCount) {
          this.send({ type: "ping" })
        } else {
          this.close(1000, "MAXIMUM_PING_REACHED")
          this.pingWorker?.terminate()
        }
        this.pingCount++
      }
    }
  }

  protected manageAuthenticated(): void {
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
      delete this.configuration.recognition["raw-content"].classification
    }
    this.sendOnSocket({
      type: this.sessionId ? "restoreSession" : "initSession",
      iinkSessionId: this.sessionId,
      scaleX: PX_TO_MM_RATIO,
      scaleY: PX_TO_MM_RATIO,
      configuration: this.configuration.recognition,
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    if (this.currentPartId) {
      this.sendOnSocket({
        type: "openContentPart",
        id: this.currentPartId,
      })
    } else {
      this.sendOnSocket({
        type: "newContentPart",
        contentType: "Raw Content",
        mimeTypes: this.mimeTypes,
      })
    }
  }

  protected manageNewPartMessage(newPartMessage: TWebSocketClientMessageNewPart): void {
    this.initialized.resolve()
    this.currentPartId = newPartMessage.id
  }

  protected managePartChangeMessage(partChangeMessage: TWebSocketClientMessagePartChange): void {
    this.initialized.resolve()
    this.currentPartId = partChangeMessage.partId
  }

  protected manageContentChangedMessage(contentChangeMessage: TWebSocketClientMessageContentChange): void {
    this.initialized.resolve()
    this.event.emitContentChanged(readHistoryContext(contentChangeMessage))
  }

  protected manageExportMessage(exportMessage: TWebSocketClientMessageExport): void {
    const exports = parseExportedJIIX(exportMessage.exports)
    Object.keys(exports).forEach((key) => {
      this.answer(`export:${key}`, exports)
    })
    this.event.emitExported(exports)
  }

  protected manageWaitForIdle(): void {
    // Every caller waiting for idle is answered by the same idle
    this.answer("idle", undefined, true)
    this.event.emitIdle(true)
  }

  protected manageErrorMessage(errorMessage: TWebSocketClientMessageError): void {
    this.currentErrorCode = errorMessage.data?.code || errorMessage.code
    let message = errorMessage.data?.message || errorMessage.message || ClientError.UNKNOWN

    if (this.currentErrorCode === "no.activity") {
      this.rejectDeferredPending(message)
      this.event.emitConnectionClose({
        code: 1000,
        message: ClientError.NO_ACTIVITY,
      })
    } else {
      message = mapErrorCodeToMessage(this.currentErrorCode) ?? message
      this.rejectDeferredPending(message)
      this.event.emitError(new Error(message))
    }
  }

  protected manageAck(): void {
    this.answer("support", undefined)
  }

  protected manageGestureDetected(gestureMessage: TWebSocketClientMessageGesture): void {
    this.event.emitGestureDetected(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TWebSocketClientMessageContextlessGesture): void {
    this.answer(`gesture:${gestureMessage.strokeId}`, gestureMessage)
  }

  protected manageMathSolverResult(mathSolverMessage: TWebSocketClientMessageMathSolverResult): void {
    const blockId =
      mathSolverMessage.action === "get-variable-definitions" ? DOCUMENT_BLOCK_ID : mathSolverMessage.blockId
    if (typeof blockId !== "string") {
      this.logger.warn(
        "manageMathSolverResult",
        "Received math solver result without blockId, unable to resolve corresponding promise",
        mathSolverMessage
      )
      return
    }
    this.answer(`math:${mathSolverMessage.action}:${blockId}`, mathSolverMessage.result)
  }

  protected async requestMathSolver<A extends TMathSolverAction>(
    action: A,
    blockId: string | undefined,
    parameters: Record<string, unknown> = {}
  ): Promise<TMathSolverResultMap[A]> {
    const key = `math:${action}:${blockId ?? DOCUMENT_BLOCK_ID}`
    const deferred = this.waitForAnswer(key, createMathSolverNeutralResults()[action])
    try {
      // blockId undefined is dropped by JSON.stringify, as get-variable-definitions expects
      await this.send({ type: "mathSolver", action, blockId, ...parameters })
    } catch (error) {
      this.withdraw(key, deferred.reject)
      throw error
    }
    return deferred.promise
  }

  protected messageCallback(message: MessageEvent<string>): void {
    this.currentErrorCode = undefined
    let websocketMessage: unknown
    try {
      websocketMessage = JSON.parse(message.data)
    } catch {
      // The payload is not JSON at all: the payload itself is the useful diagnostic.
      this.event.emitError(new Error(message.data))
      return
    }
    if (!isWebSocketClientMessageReceived(websocketMessage)) {
      this.logger.warn("messageCallback", `Message type unknown: "${message.data}".`)
      return
    }
    try {
      if (websocketMessage.type === TWebSocketClientMessageType.Pong) {
        this.pingCount = 0
        return
      }
      switch (websocketMessage.type) {
        case TWebSocketClientMessageType.HMAC_Challenge:
          this.manageHMACChallenge(websocketMessage).catch((err) => this.failInitialization(err))
          break
        case TWebSocketClientMessageType.Authenticated:
          this.manageAuthenticated()
          break
        case TWebSocketClientMessageType.SessionDescription:
          this.manageSessionDescriptionMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.NewPart:
          this.manageNewPartMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.PartChanged:
          this.managePartChangeMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.ContentChanged:
          this.manageContentChangedMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.Exported:
          this.manageExportMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.GestureDetected:
          this.manageGestureDetected(websocketMessage)
          break
        case TWebSocketClientMessageType.ContextlessGesture:
          this.manageContextlessGesture(websocketMessage)
          break
        case TWebSocketClientMessageType.MathSolverResult:
          this.manageMathSolverResult(websocketMessage)
          break
        case TWebSocketClientMessageType.Error:
          this.manageErrorMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.Idle:
          this.manageWaitForIdle()
          break
        case TWebSocketClientMessageType.Ack:
          this.manageAck()
          break
        default: {
          // Unreachable once the guard passed; a TWebSocketClientMessageType without a case stops compiling here
          const unhandled: never = websocketMessage
          this.logger.warn("messageCallback", `Message type unhandled: "${JSON.stringify(unhandled)}".`)
          break
        }
      }
    } catch (error) {
      // A handler threw. Reporting the payload here, as this used to, hid every
      // message-handling bug in the client behind an error that only said what the server sent.
      this.event.emitError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  async newSession(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void> {
    await this.close(1000, "new-session")
    // overrideDeep, not a second mergeDeep source: mergeDeep appends arrays, which would repeat every one on each new session
    this.configuration = overrideDeep(mergeDeep<WebSocketClientConfiguration>({}, this.configuration), config)
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async init(): Promise<void> {
    if (this.connectingPromise) {
      return this.connectingPromise
    }
    this.connectingPromise = this.connect()
      .then(() => this.onConnected())
      .finally(() => {
        this.connectingPromise = null
      })
    return this.connectingPromise
  }

  protected async connect(): Promise<void> {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode = undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    await ensureServerVersion(this.configuration)
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
    this.event.emitEndInitialization()
  }

  async send(message: TWebSocketClientMessage): Promise<void> {
    if (!this.socket) {
      return Promise.reject(new Error("Client must be initialized"))
    }

    switch (this.socket.readyState) {
      case this.socket.CONNECTING:
      case this.socket.OPEN:
        await this.initialized.promise
        this.sendOnSocket(message)
        return Promise.resolve()
      case this.socket.CLOSING:
      case this.socket.CLOSED:
        if (this.closingPromise) {
          // A deliberate `close()` (e.g. `newSession()`) is already tearing down the socket —
          // wait for it instead of racing our own `init()` against the one it issues right after.
          // The message is not replayed: it was built for the session being closed (its partId,
          // its blockIds), and close() has already settled everything that waited on an answer.
          await this.closingPromise
          return
        }
        if (this.configuration.server.websocket.autoReconnect) {
          this.reconnectionCount++
          if (this.configuration.server.websocket.maxRetryCount > this.reconnectionCount) {
            await this.init()
            await this.waitForIdle()
            return this.sendOnSocket(message)
          } else {
            return Promise.reject(
              new Error("Unable to send message. The maximum number of connection attempts has been reached.")
            )
          }
        } else {
          return Promise.reject(
            new Error("Unable to send message. Connection closed and automatic reconnection disabled")
          )
        }
        break
    }
  }

  protected buildAddStrokesMessage(strokes: TRecognitionStroke[], processGestures = true): TWebSocketClientMessage {
    return {
      type: "addStrokes",
      processGestures,
      strokes: strokes.map((s) => toWireStroke(s)),
    }
  }
  /**
   * @remarks Resolves once the message is sent, not once the server acks it — gesture detection
   * results (if any) arrive asynchronously via `event.addGestureDetectedListener`, not this promise.
   */
  async addStrokes(strokes: TRecognitionStroke[], processGestures = true): Promise<void> {
    if (strokes.length === 0) {
      return
    }
    const promises: Promise<void>[] = []
    const _processGestures = processGestures && strokes.length < 3
    for (const strokesPart of this.chunkBySize(strokes, wireStrokeSize, 1000)) {
      const message = this.buildAddStrokesMessage(strokesPart, _processGestures)
      if (this.configuration.server.websocket.offlineQueueEnabled && this.isDisconnected()) {
        const deferred = new DeferredPromise<void>()
        this.enqueueOfflineMessage(message, deferred)
        promises.push(deferred.promise)
      } else {
        promises.push(this.send(message))
      }
    }
    await Promise.all(promises)
  }

  /**
   * Groups `items` so that each group, once sent, stays under `maxMessageBytes`, with at most
   * `maxCount` items. Order is kept; an item larger than the budget goes alone.
   */
  protected chunkBySize<T>(items: T[], sizeOf: (item: T) => number, maxCount = Infinity): T[][] {
    // Room left for the message around the items: its type and other fields.
    const budget = this.maxMessageBytes - 256
    const chunks: T[][] = []
    let current: T[] = []
    let currentBytes = 0
    for (const item of items) {
      const bytes = sizeOf(item) + 1
      if (current.length && (current.length === maxCount || currentBytes + bytes > budget)) {
        chunks.push(current)
        current = []
        currentBytes = 0
      }
      current.push(item)
      currentBytes += bytes
    }
    if (current.length) {
      chunks.push(current)
    }
    return chunks
  }

  /** Sends `build`'s message once per group of `strokeIds` that fits in a frame. */
  protected async sendPerStrokeIds(
    strokeIds: string[],
    build: (strokeIds: string[]) => TWebSocketClientMessage
  ): Promise<void> {
    await Promise.all(this.chunkBySize(strokeIds, strokeIdSize).map((ids) => this.send(build(ids))))
  }

  async getAvailableActions(blockId: string): Promise<string[]> {
    return this.requestMathSolver("available-actions", blockId)
  }

  async getNumericalComputation(blockId: string): Promise<TJIIXMathElement> {
    return JSON.parse(await this.requestMathSolver("numerical-computation", blockId)) as TJIIXMathElement
  }

  async getDiagnostic(blockId: string, task: string): Promise<string> {
    return this.requestMathSolver("get-diagnostic", blockId, { task })
  }

  async getVariables(blockId: string): Promise<TMathVariable[]> {
    return this.requestMathSolver("get-variables", blockId)
  }

  async getVariableValue(blockId: string, variableName: string): Promise<number> {
    return this.requestMathSolver("get-variable-value", blockId, { variableName })
  }

  async setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void> {
    await this.requestMathSolver("set-variable-value", blockId, { variableName, variableValue })
  }

  async removeVariableValue(blockId: string, variableName: string): Promise<void> {
    await this.requestMathSolver("remove-variable-value", blockId, { variableName })
  }

  async asVariableDefinition(blockId: string): Promise<TMathVariableDefinition> {
    return this.requestMathSolver("as-variable-definition", blockId)
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    return this.requestMathSolver("get-variable-definitions", undefined)
  }

  async getEvaluables(blockId: string): Promise<TMathEvaluable[]> {
    return this.requestMathSolver("get-evaluables", blockId)
  }

  async evaluate(
    blockId: string,
    evaluation: {
      inputVariableName: string
      outputVariableName: string
      from: number
      to: number
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]> {
    const result = await this.requestMathSolver("evaluate", blockId, { evaluation })

    // Transform result arrays to series of points
    // Result format: [[x1, y1, x2, y2, ...], [x1, y1, x2, y2, ...]] for multiple curves
    const allSeries: {
      [key: string]: number
    }[][] = []

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
            [yKey]: yVal,
          })
        }
      }

      allSeries.push(points)
    }

    this.logger.info("Evaluate result transformed", {
      inputVar: evaluation.inputVariableName || "x",
      outputVar: evaluation.outputVariableName || "?",
      seriesCount: allSeries.length,
      totalPoints: allSeries.reduce((sum, series) => sum + series.length, 0),
    })

    return allSeries
  }

  protected buildReplaceStrokesMessage(
    oldStrokeIds: string[],
    newStrokes: TRecognitionStroke[]
  ): TWebSocketClientMessage {
    return {
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map((s) => toWireStroke(s)),
    }
  }
  async replaceStrokes(oldStrokeIds: string[], newStrokes: TRecognitionStroke[]): Promise<void> {
    if (oldStrokeIds.length === 0) {
      return
    }
    // The first group goes with the replacement, the others as plain additions: same content, and
    // no frame over the budget.
    const [first = [], ...rest] = this.chunkBySize(newStrokes, wireStrokeSize, 1000)
    await Promise.all([
      this.send(this.buildReplaceStrokesMessage(oldStrokeIds, first)),
      ...rest.map((strokes) => this.send(this.buildAddStrokesMessage(strokes, false))),
    ])
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "TRANSLATE",
      strokeIds,
      tx,
      ty,
    }
  }
  async transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformTranslateMessage(ids, tx, ty))
  }

  protected buildTransformRotateMessage(
    strokeIds: string[],
    angle: number,
    x0: number = 0,
    y0: number = 0
  ): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "ROTATE",
      strokeIds,
      angle,
      x0,
      y0,
    }
  }
  async transformRotate(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformRotateMessage(ids, angle, x0, y0))
  }

  protected buildTransformScaleMessage(
    strokeIds: string[],
    scaleX: number,
    scaleY: number,
    x0: number = 0,
    y0: number = 0
  ): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "SCALE",
      strokeIds,
      scaleX,
      scaleY,
      x0,
      y0,
    }
  }
  async transformScale(
    strokeIds: string[],
    scaleX: number,
    scaleY: number,
    x0: number = 0,
    y0: number = 0
  ): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformScaleMessage(ids, scaleX, scaleY, x0, y0))
  }

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "MATRIX",
      strokeIds,
      ...matrix,
    }
  }
  async transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformMatrixMessage(ids, matrix))
  }

  protected buildEraseStrokesMessage(strokeIds: string[]): TWebSocketClientMessage {
    return {
      type: "eraseStrokes",
      strokeIds,
    }
  }
  async eraseStrokes(strokeIds: string[]): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildEraseStrokesMessage(ids))
  }

  async recognizeGesture(stroke: TRecognitionStroke): Promise<TWebSocketClientMessageContextlessGesture | undefined> {
    if (!stroke) {
      return
    }
    const deferred = this.waitForAnswer<TWebSocketClientMessageContextlessGesture>(`gesture:${stroke.id}`, {
      type: TWebSocketClientMessageType.ContextlessGesture,
      strokeId: stroke.id,
      gestureType: "none",
    })
    await this.send({
      type: "contextlessGesture",
      scaleX: PX_TO_MM_RATIO,
      scaleY: PX_TO_MM_RATIO,
      stroke: toWireStroke(stroke),
    })
    return deferred.promise
  }

  async waitForIdle(): Promise<void> {
    const deferred = this.waitForAnswer<void>("idle", undefined)
    await this.send({ type: "waitForIdle" })
    return deferred.promise
  }

  // Not split by `maxMessageBytes`: an undo or redo is one step of the server's history, and
  // spreading it over several messages would record several.
  protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TWebSocketClientMessage[] {
    const changesMessages: TWebSocketClientMessage[] = []
    if (changes.added?.length) {
      changesMessages.push(this.buildAddStrokesMessage(changes.added, false))
    }
    if (changes.erased?.length) {
      changesMessages.push(this.buildEraseStrokesMessage(changes.erased.map((s) => s.id)))
    }
    if (changes.replaced?.newStrokes.length) {
      changesMessages.push(
        this.buildReplaceStrokesMessage(
          changes.replaced.oldStrokes.map((s) => s.id),
          changes.replaced.newStrokes
        )
      )
    }
    return changesMessages
  }

  async undo(actions: TIIHistoryBackendChanges): Promise<void> {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    const message: TWebSocketClientMessage = {
      type: "undo",
      changes,
    }
    await this.send(message)
  }

  async redo(actions: TIIHistoryBackendChanges): Promise<void> {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    const message: TWebSocketClientMessage = {
      type: "redo",
      changes,
    }
    await this.send(message)
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport> {
    const run = this.exportQueue.then(() => this.sendExport(requestedMimeTypes))
    this.exportQueue = run.catch(() => undefined)
    return run
  }

  // Exports run one after another: the server's answer names its mime types, not the request it
  // answers, so two exports in flight could only be told apart by their order.
  protected exportQueue: Promise<unknown> = Promise.resolve()

  protected async sendExport(requestedMimeTypes?: string[]): Promise<TExport> {
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes.slice()
    const none: TExport = {}
    const deferreds = mimeTypes.map((mt) => this.waitForAnswer(`export:${mt}`, none))
    await this.send({ type: "export", partId: this.currentPartId, mimeTypes })
    const exports = await Promise.all(deferreds.map((deferred) => deferred.promise))
    return Object.assign({}, ...exports)
  }

  async clear(): Promise<void> {
    await this.send({
      type: "clear",
    })
  }

  async sendToSupport(data: Record<string, unknown>): Promise<void> {
    const deferred = this.waitForAnswer<void>("support", undefined)
    await this.send({
      type: "sendToSupport",
      metadata: { ...data },
    })
    return deferred.promise
  }

  async close(code: number, reason: string): Promise<void> {
    this.clearReconnectLoop()
    this.clearOfflineQueue(new Error(`Client closed (${reason}): queued strokes were not sent`))
    this.resolveDeferredPending()
    this.resetAllDeferred()
    // Answered by the socket's close event; an error message arriving meanwhile ends the wait too
    const closed = this.waitForAnswer<void>("close", undefined)
    const doClose = async (): Promise<void> => {
      if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
        this.socket.close(code, reason)
      } else {
        this.answer("close", undefined, true)
      }
      await closed.promise.catch(() => undefined)
    }
    this.closingPromise = doClose().finally(() => {
      this.closingPromise = null
    })
    await this.closingPromise
  }

  async destroy(): Promise<void> {
    if (this.socket) {
      await this.close(1000, "Client destroyed")
    }
  }
}
