import type { TGesture } from "@/manager"
import type { TExport } from "@/model"

/**
 * @group Recognizer
 */
export enum TRecognizerWebSocketMessageType
{
  HMAC_Challenge = "hmacChallenge",
  Authenticated = "authenticated",
  SessionDescription = "sessionDescription",
  NewPart = "newPart",
  PartChanged = "partChanged",
  ContentChanged = "contentChanged",
  Idle = "idle",
  Pong = "pong",
  Exported = "exported",
  GestureDetected = "gestureDetected",
  ContextlessGesture = "contextlessGesture",
  MathSolverResult = "mathSolverResult",
  Error = "error",
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessage<T = string> = {
  type: T
  [key: string]: unknown
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageAuthenticated = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Authenticated>

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageHMACChallenge = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.HMAC_Challenge> & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TInteractiveInkSessionDescriptionMessage = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.SessionDescription> & {
  contentPartCount: number
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageNewPart = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.NewPart> & {
  id: string
  idx: null
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessagePartChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.PartChanged> & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageContentChange = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContentChanged> & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageExport = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Exported> & {
  partId: string
  exports: TExport
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.GestureDetected> & TGesture

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageContextlessGesture = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.ContextlessGesture> & {
  gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround",
  strokeId: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessagePong = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Pong>

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageIdle = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Idle>

/**
 * @group Recognizer
 */
export type TMathVariable = {
  name: string
  value?: number
  sourceType?: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED"
  sourceId?: string
  occurrenceCount?: number
}

/**
 * @group Recognizer
 */
export type TMathEvaluable = {
  inputName: string
  outputName: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverAvailableActions = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "available-actions"
  result: string[]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverGetDiagnostic = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "get-diagnostic"
  result: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverNumericalComputation = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "numerical-computation"
  result: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverGetVariables = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "get-variables"
  result: TMathVariable[]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverSetVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "set-variable-value"
  result?: undefined
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverGetVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "get-variable-value"
  result: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverGetEvaluables = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "get-evaluables"
  result: TMathEvaluable[]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverEvaluate = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "evaluate"
  result: number[][]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverRemoveVariableValue = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "remove-variable-value"
  result?: undefined
}

/**
 * @group Recognizer
 */
export type TMathVariableDefinition = {
  name: string
  value: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverAsVariableDefinition = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  blockId: string
  action: "as-variable-definition"
  result: TMathVariableDefinition
}

/**
 * @group Recognizer
 */
export type TMathVariableDefinitionInfo = {
  value: number
  sourceType: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED"
  blockId: string
}

/**
 * @group Recognizer
 */
export type TMathVariableDefinitions = {
  name: string
  definitions: TMathVariableDefinitionInfo[]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverGetVariableDefinitions = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.MathSolverResult> & {
  action: "get-variable-definitions"
  result: TMathVariableDefinitions[]
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageMathSolverResult =
  | TRecognizerWebSocketMessageMathSolverAvailableActions
  | TRecognizerWebSocketMessageMathSolverGetDiagnostic
  | TRecognizerWebSocketMessageMathSolverNumericalComputation
  | TRecognizerWebSocketMessageMathSolverGetVariables
  | TRecognizerWebSocketMessageMathSolverSetVariableValue
  | TRecognizerWebSocketMessageMathSolverGetVariableValue
  | TRecognizerWebSocketMessageMathSolverGetEvaluables
  | TRecognizerWebSocketMessageMathSolverRemoveVariableValue
  | TRecognizerWebSocketMessageMathSolverAsVariableDefinition
  | TRecognizerWebSocketMessageMathSolverGetVariableDefinitions
  | TRecognizerWebSocketMessageMathSolverEvaluate

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageError = TRecognizerWebSocketMessage<TRecognizerWebSocketMessageType.Error> & {
  code?: number | string
  message?: string
  data?: {
    code: number | string
    message: string
  }
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketMessageReceived =
  TRecognizerWebSocketMessageAuthenticated |
  TRecognizerWebSocketMessageHMACChallenge |
  TInteractiveInkSessionDescriptionMessage |
  TRecognizerWebSocketMessageNewPart |
  TRecognizerWebSocketMessagePartChange |
  TRecognizerWebSocketMessageContentChange |
  TRecognizerWebSocketMessageExport |
  TRecognizerWebSocketMessageGesture |
  TRecognizerWebSocketMessageContextlessGesture |
  TRecognizerWebSocketMessagePong |
  TRecognizerWebSocketMessageIdle |
  TRecognizerWebSocketMessageMathSolverResult |
  TRecognizerWebSocketMessageError
