import { IIStroke, SymbolType, isDecorator } from "@/symbol"
import { IIHistoryManager } from "@/history"
import { isBetween, PartialDeep } from "@/utils"
import { IITranslateManager, IITextManager } from "."
import { InteractiveInkEditor } from "@/editor"
import { IIAbstractManager } from "./IIAbstractManager"
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
import {
  TGestureType,
  TGesture,
  SurroundAction,
  StrikeThroughAction,
  UnderlineAction,
  InsertAction,
  TGestureConfiguration,
  DefaultGestureConfiguration
} from "./gestures/GestureTypes"
import { LoggerCategory } from "@/logger"

/**
 * @group Manager
 * @remarks Orchestrator for gesture recognition and handling using Strategy Pattern
 */
export class IIGestureManager extends IIAbstractManager
{
  protected managerName = "IIGestureManager"

  #handlers: Map<TGestureType, IGestureHandler> = new Map()
  #helpers: GestureHelpers

  static readonly #TEXT_STROKE_GROUP_TYPES = new Set([SymbolType.Text, SymbolType.Stroke, SymbolType.Group])
  static readonly #SURROUND_SELECT_TYPES = new Set([SymbolType.Group, SymbolType.Stroke, SymbolType.Text])
  static readonly #ERASE_OVERLAY_TYPES = new Set([SymbolType.Stroke, SymbolType.Text, SymbolType.Group])
  static readonly #ERASE_CONTAIN_TYPES = new Set([SymbolType.Shape, SymbolType.Edge])

  insertAction: InsertAction = InsertAction.LineBreak
  surroundAction: SurroundAction = SurroundAction.Select
  strikeThroughAction: StrikeThroughAction = StrikeThroughAction.Draw
  underlineAction: UnderlineAction = UnderlineAction.Draw

  constructor(editor: InteractiveInkEditor, gestureAction?: PartialDeep<TGestureConfiguration>)
  {
    super(editor, LoggerCategory.GESTURE)
    this.logger.info("constructor")
    this.surroundAction = gestureAction?.surround || DefaultGestureConfiguration.surround
    this.strikeThroughAction = gestureAction?.strikeThrough || DefaultGestureConfiguration.strikeThrough
    this.underlineAction = gestureAction?.underline || DefaultGestureConfiguration.underline
    this.insertAction = gestureAction?.insert || DefaultGestureConfiguration.insert

    // Initialize helpers with reference to this manager and register handlers
    this.#helpers = new GestureHelpers(editor)
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

  get translator(): IITranslateManager
  {
    return this.editor.translator
  }

  get texter(): IITextManager
  {
    return this.editor.texter
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  /**
   * Apply a detected gesture using the appropriate handler
   * @param gestureStroke - The stroke that represents the gesture
   * @param gesture - The detected gesture with metadata
   */
  async apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void>
  {
    this.logger.info("apply", { gestureStroke, gesture })

    this.editor.removeSymbol(gestureStroke.id, false)

    // Dispatch to appropriate handler
    const handler = this.#handlers.get(gesture.gestureType)
    if (handler) {
      await handler.apply(gestureStroke, gesture)
    } else {
      this.logger.warn("apply", `No handler found for gesture type: ${gesture.gestureType}`)
    }

    // Emit event and update UI
    this.editor.event.emitGestured({ gestureType: gesture.gestureType, stroke: gestureStroke })
    this.editor.overlays.apply()
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
          if (s.id !== gestureStroke.id && !isDecorator(s) && gestureStroke.bounds.contains(s.bounds)) {
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
