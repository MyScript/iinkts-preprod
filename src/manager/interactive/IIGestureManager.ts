import { LoggerManager, LoggerCategory } from "../../logger"
import { IIModel } from "../../model"
import { IIStroke, SymbolType } from "../../symbol"
import { RecognizerWebSocket } from "../../recognizer"
import { SVGRenderer } from "../../renderer"
import { IIHistoryManager } from "../../history"
import { isBetween, PartialDeep } from "../../utils"
import { IITranslateManager, IITextManager } from "."
import { InteractiveInkEditor } from "../../editor"
import type { IGestureHandler } from "./gestures"
import {
  GestureHelpers,
  SurroundGestureHandler,
  StrikeThroughGestureHandler,
  UnderlineGestureHandler,
  ScratchGestureHandler,
  JoinGestureHandler,
  InsertGestureHandler
} from "./gestures"

/**
 * @group Gesture
 * @summary List all authorized gestures
 */
export type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND"

/**
 * @group Gesture
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: { fullStrokeId: string, x: number[], y: number[] }[]
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum SurroundAction
{
  Select = "select",
  Surround = "surround",
  Highlight = "highlight"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum StrikeThroughAction
{
  Erase = "erase",
  Draw = "draw"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on underline detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum UnderlineAction
{
  Draw = "draw",
  Thicken = "thicken"
}

/**
 * @group Gesture
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of offscreen
 */
export enum InsertAction
{
  /**
   * @remarks Add line break on gesture place
   */
  LineBreak = "line-break",
  /**
   * @remarks Insert place in gesture place
   */
  Insert = "insert"
}

/**
 * @group Gesture
 * @source
 */
export type TGestureConfiguration = {
  surround: SurroundAction
  strikeThrough: StrikeThroughAction
  underline: UnderlineAction
  insert: InsertAction
}

/**
 * @group Gesture
 * @source
 */
export const DefaultGestureConfiguration: TGestureConfiguration = {
  surround: SurroundAction.Select,
  strikeThrough: StrikeThroughAction.Draw,
  underline: UnderlineAction.Draw,
  insert: InsertAction.LineBreak
}

/**
 * @group Gesture
 * @remarks Orchestrator for gesture recognition and handling using Strategy Pattern
 */
export class IIGestureManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
  #handlers: Map<TGestureType, IGestureHandler> = new Map()
  #helpers: GestureHelpers

  static readonly #TEXT_STROKE_GROUP_TYPES = new Set([SymbolType.Text, SymbolType.Stroke, SymbolType.Group])
  static readonly #SURROUND_SELECT_TYPES = new Set([SymbolType.Group, SymbolType.Stroke, SymbolType.Text, SymbolType.Recognized])
  static readonly #ERASE_OVERLAY_TYPES = new Set([SymbolType.Stroke, SymbolType.Text, SymbolType.Group])
  static readonly #ERASE_CONTAIN_TYPES = new Set([SymbolType.Shape, SymbolType.Edge])

  insertAction: InsertAction = InsertAction.LineBreak
  surroundAction: SurroundAction = SurroundAction.Select
  strikeThroughAction: StrikeThroughAction = StrikeThroughAction.Draw
  underlineAction: UnderlineAction = UnderlineAction.Draw
  editor: InteractiveInkEditor

  constructor(editor: InteractiveInkEditor, gestureAction?: PartialDeep<TGestureConfiguration>)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.surroundAction = gestureAction?.surround || DefaultGestureConfiguration.surround
    this.strikeThroughAction = gestureAction?.strikeThrough || DefaultGestureConfiguration.strikeThrough
    this.underlineAction = gestureAction?.underline || DefaultGestureConfiguration.underline
    this.insertAction = gestureAction?.insert || DefaultGestureConfiguration.insert

    // Initialize helpers with reference to this manager and register handlers
    this.#helpers = new GestureHelpers(editor, this)
    this.#registerHandlers()
  }

  /**
   * Register all gesture handlers using Strategy Pattern
   * @private
   */
  #registerHandlers(): void
  {
    this.#handlers.set("SURROUND", new SurroundGestureHandler(this.editor, this.#helpers))
    this.#handlers.set("STRIKETHROUGH", new StrikeThroughGestureHandler(this.editor, this.#helpers))
    this.#handlers.set("UNDERLINE", new UnderlineGestureHandler(this.editor, this.#helpers))
    this.#handlers.set("SCRATCH", new ScratchGestureHandler(this.editor, this.#helpers))
    this.#handlers.set("JOIN", new JoinGestureHandler(this.editor, this.#helpers))
    this.#handlers.set("INSERT", new InsertGestureHandler(this.editor, this.#helpers))
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  get translator(): IITranslateManager
  {
    return this.editor.translator
  }

  get texter(): IITextManager
  {
    return this.editor.texter
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get strokeSpaceWidth(): number
  {
    return this.editor.configuration.rendering.guides.gap * 2
  }

  /**
   * Apply a detected gesture using the appropriate handler
   * @param gestureStroke - The stroke that represents the gesture
   * @param gesture - The detected gesture with metadata
   */
  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.info("apply", { gestureStroke, gesture })

    // Prepare gesture stroke for removal
    this.editor.updateSymbolsStyle([gestureStroke.id], { opacity: (gestureStroke.style.opacity || 1) / 2 }, false)
    await this.editor.removeSymbol(gestureStroke.id, false)
    await this.editor.synchronizeStrokesWithJIIX()

    // Dispatch to appropriate handler
    const handler = this.#handlers.get(gesture.gestureType)
    if (handler) {
      await handler.apply(gestureStroke, gesture)
    } else {
      this.#logger.warn("apply", `No handler found for gesture type: ${gesture.gestureType}`)
    }

    // Emit event and update UI
    this.editor.event.emitGestured({ gestureType: gesture.gestureType, stroke: gestureStroke })
    this.editor.svgDebugger.apply()
    return Promise.resolve()
  }

  /**
   * Detect gesture type from a stroke using contextless recognition
   * @param gestureStroke - The stroke to analyze
   * @returns The detected gesture or undefined
   */
  async getGestureFromContextLess(gestureStroke: IIStroke): Promise<TGesture | undefined>
  {
    const gesture = await this.recognizer.recognizeGesture(gestureStroke)
    if (!gesture) return
    switch (gesture.gestureType) {
      case "surround": {
        const hasSymbolsToSurrond = this.model.symbols.some(s =>
        {
          if (s.id !== gestureStroke.id && gestureStroke.bounds.contains(s.bounds)) {
            return this.surroundAction === SurroundAction.Select || IIGestureManager.#SURROUND_SELECT_TYPES.has(s.type)
          }
          return false
        })
        if (hasSymbolsToSurrond) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "left-right":
      case "right-left": {
        const symbolsToUnderline = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id && IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height * 3 / 4, s.bounds.y + s.bounds.height * 5 / 4)
        })
        if (symbolsToUnderline.length) {
          return {
            gestureType: "UNDERLINE",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToUnderline.map(s => s.id),
          }
        }
        const symbolsToStrikeThrough = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id && IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height / 4, s.bounds.y + s.bounds.height * 3 / 4)
        })
        if (symbolsToStrikeThrough.length) {
          return {
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToStrikeThrough.map(s => s.id),
          }
        }
        return
      }
      case "scratch": {
        const symbolsToErase = this.model.symbols.filter(s =>
        {
          return s.id !== gestureStroke.id &&
            (
              gestureStroke.bounds.overlaps(s.bounds) && IIGestureManager.#ERASE_OVERLAY_TYPES.has(s.type) ||
              gestureStroke.bounds.contains(s.bounds) && IIGestureManager.#ERASE_CONTAIN_TYPES.has(s.type)
            )
        })

        if (symbolsToErase.length) {
          return {
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToErase.map(s => s.id),
          }
        }
        return
      }
      case "bottom-top": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          s.id !== gestureStroke.id &&
          IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "top-bottom": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          s.id !== gestureStroke.id &&
          IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "INSERT",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "none":
      default:
        return
    }
  }
}
