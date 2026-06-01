import type { IIStroke, TIISymbol } from "../../../symbol"
import type { InteractiveInkEditor } from "../../../editor"
import type { TGesture, TGestureType } from "../IIGestureManager"
import type { GestureHelpers } from "./GestureHelpers"
import { IIModel } from "../../../model"
import { SVGRenderer } from "../../../renderer"
import { IIHistoryManager } from "../../../history"
import { RecognizerWebSocket } from "../../../recognizer"
import { IITranslateManager } from "../IITranslateManager"
import { IITextManager } from "../IITextManager"

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Gesture/Handler
 */
export interface IGestureHandler
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
  apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>
}

/**
 * Abstract base class for gesture handlers
 * Provides common functionality and access to editor services via helpers
 * @group Gesture/Handler
 */
export abstract class GestureHandler implements IGestureHandler
{
  constructor(
    protected editor: InteractiveInkEditor,
    protected helpers: GestureHelpers
  )
  {
  }

  abstract readonly gestureType: TGestureType
  abstract apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>

  /**
   * Get the editor's model
   */
  protected get model(): IIModel
  {
    return this.helpers.model
  }

  /**
   * Get the editor's renderer
   */
  protected get renderer(): SVGRenderer
  {
    return this.helpers.renderer
  }

  /**
   * Get the editor's history manager
   */
  protected get history(): IIHistoryManager
  {
    return this.helpers.history
  }

  /**
   * Get the editor's recognizer
   */
  protected get recognizer(): RecognizerWebSocket
  {
    return this.helpers.recognizer
  }

  /**
   * Get the editor's translator manager
   */
  protected get translator(): IITranslateManager
  {
    return this.helpers.translator
  }

  /**
   * Get the editor's text manager
   */
  protected get texter(): IITextManager
  {
    return this.helpers.texter
  }

  /**
   * Get the row height from configuration
   */
  protected get rowHeight(): number
  {
    return this.helpers.rowHeight
  }

  /**
   * Get the stroke space width from configuration
   */
  protected get strokeSpaceWidth(): number
  {
    return this.helpers.strokeSpaceWidth
  }
}
