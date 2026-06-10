import type { IIStroke, TIISymbol, IIText } from "@/symbol"
import { IIDecorator, DecoratorKind, isRecognizedText, isText } from "@/symbol"
import type { InteractiveInkEditor } from "@/editor"
import type { TGesture, TGestureType } from "@/manager/interactive/gestures/GestureTypes"
import type { GestureHelpers } from "./GestureHelpers"
import { IIModel } from "@/model"
import { SVGRenderer } from "@/renderer"
import { IIHistoryManager } from "@/history"
import { RecognizerWebSocket } from "@/recognizer"
import { IITranslateManager } from "@/manager/interactive/IITranslateManager"
import { IITextManager } from "@/manager/interactive/IITextManager"
import { IIGestureManager } from "../IIGestureManager"
import { LoggerManager, LoggerCategory, type Logger } from "@/logger"

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Manager
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
 * @group Manager
 */
export type TDecoratorChange = { symbol: IIText | IIStroke, decorator: IIDecorator, added: boolean }

export abstract class GestureHandler implements IGestureHandler
{
  protected readonly logger: Logger

  constructor(
    protected editor: InteractiveInkEditor,
    protected helpers: GestureHelpers
  )
  {
    this.logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
  }

  abstract readonly gestureType: TGestureType
  abstract apply(gestureStroke: IIStroke, gesture: TGesture): Promise<void | TIISymbol[]>

  protected applyDecoratorToIds(
    ids: string[],
    gestureStroke: IIStroke,
    kind: DecoratorKind
  ): TDecoratorChange[]
  {
    const changes: TDecoratorChange[] = []
    const seen = new Set<string>()

    for (const id of ids) {
      const sym = this.model.getRootSymbol(id)
      if (!sym || !this.helpers.isDecorable(sym) || seen.has(sym.id)) continue
      const symWithDec = sym as IIText | IIStroke
      if (isRecognizedText(symWithDec) || isText(symWithDec)) {
        const modified = this.helpers.applyDecoratorOnWords(symWithDec, gestureStroke, kind)
        if (modified) {
          this.model.updateSymbol(symWithDec)
          this.renderer.drawSymbol(symWithDec)
          seen.add(symWithDec.id)
          changes.push({ symbol: symWithDec, decorator: new IIDecorator(kind, this.editor.penStyle), added: true })
        }
      }
    }

    return changes
  }

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
    return this.editor.translator
  }

  /**
   * Get the editor's text manager
   */
  protected get texter(): IITextManager
  {
    return this.editor.texter
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
