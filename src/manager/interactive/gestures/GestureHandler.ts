import type { TStroke, TSymbol } from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture, TGestureType } from "@/manager/interactive/gestures/GestureTypes"
import type { GestureHelpers } from "./GestureHelpers"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { IIHistoryManager } from "@/history"
import type { RecognizerWebSocket } from "@/recognizer"
import type { IITranslateManager } from "@/manager/interactive/transform/IITranslateManager"
import type { IITypesetManager } from "@/manager/interactive/IITypesetManager"
import type { IIGestureManager } from "../IIGestureManager"
import { LoggerManager, LoggerCategory, type Logger } from "@/logger"
import { IIGestureAnnotationProcessor } from "./IIGestureAnnotationProcessor"

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Manager
 */
export type TGestureHandler =
{
  /**
   * The type of gesture this handler manages
   */
  readonly gestureType: TGestureType

  /**
   * Apply the gesture to the model
   * @param gestureStroke - The stroke that forms the gesture
   * @param gesture - The detected gesture information
   * @returns Promise that resolves when the gesture is applied
   */
  apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>
}

/**
 * Abstract base class for gesture handlers
 * Provides common functionality and access to editor services via helpers
 * @group Manager
 */
export type { TGestureAnnotation } from "./GestureAnnotation"

export abstract class GestureHandler implements TGestureHandler
{
  protected readonly logger: Logger
  protected readonly processor: IIGestureAnnotationProcessor

  constructor(
    protected editor: InteractiveInkEditor,
    protected helpers: GestureHelpers
  )
  {
    this.logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
    this.processor = new IIGestureAnnotationProcessor(editor)
  }

  abstract readonly gestureType: TGestureType
  abstract apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>

  /**
   * Get the editor's model
   */
  protected get model(): IIModel
  {
    return this.editor.model
  }
  /**
   * Get the editor's model
   */
  protected get manager(): IIGestureManager
  {
    return this.editor.gesture
  }

  /**
   * Get the editor's renderer
   */
  protected get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  /**
   * Get the editor's history manager
   */
  protected get history(): IIHistoryManager
  {
    return this.editor.history
  }

  /**
   * Get the editor's recognizer
   */
  protected get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  /**
   * Get the editor's translator manager
   */
  protected get translator(): IITranslateManager
  {
    return this.editor.transform.translate
  }

  /**
   * Get the editor's typeset manager
   */
  protected get typeset(): IITypesetManager
  {
    return this.editor.typeset
  }

  /**
   * Get the row height from configuration
   */
  protected get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  /**
   * Get the stroke space width from configuration
   */
  protected get strokeSpaceWidth(): number
  {
    return this.editor.configuration.rendering.guides.gap * 2
  }
}
