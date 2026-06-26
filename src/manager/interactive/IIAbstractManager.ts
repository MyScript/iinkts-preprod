import type { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import type { InteractiveInkEditorConfiguration } from "@/editor/variants/InteractiveInkEditorConfiguration"
import type { LoggerCategory, Logger } from "@/logger";
import { LoggerManager } from "@/logger"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { RecognizerWebSocket } from "@/recognizer"

/**
 * Base abstract class for all Interactive Ink managers
 * Provides common structure and utilities to reduce code duplication
 *
 * All managers in iink-ts should extend this class to ensure consistent:
 * - Logger management
 * - Editor reference
 * - Common getters (model, renderer, recognizer, configuration)
 * - Lifecycle hooks (onInit, onDestroy)
 *
 * @example
 * ```typescript
 * export class IIMyManager extends IIAbstractManager {
 *   protected managerName = "IIMyManager"
 *
 *   constructor(editor: InteractiveInkEditor) {
 *     super(editor)
 *     // Custom initialization
 *   }
 *
 *   protected onInit(): void {
 *     // Called after constructor
 *     this.logger.info("IIMyManager initialized")
 *   }
 *
 *   myMethod() {
 *     // Use this.editor, this.model, this.renderer, this.logger
 *     this.logger.info("Doing something")
 *   }
 *
 *   protected onDestroy(): void {
 *     // Cleanup
 *   }
 * }
 * ```
 *
 * @group Manager
 */
export abstract class IIAbstractManager
{
  /**
   * Logger instance for this manager
   * Automatically uses LoggerCategory.MANAGER
   */
  protected logger: Logger

  /**
   * Name of the manager for logging purposes
   * Must be overridden in concrete classes
   *
   * @example "IITypesetManager", "IIMathManager"
   */
  protected abstract managerName: string

  /**
   * Create a new manager
   * @param editor - The Interactive Ink Editor instance
   */
  constructor(protected editor: InteractiveInkEditor, logger: LoggerCategory)
  {
    this.logger = LoggerManager.getLogger(logger)

    // Call optional initialization hook
    if (this.onInit) {
      this.onInit()
    }
  }

  /**
   * Get the model from the editor
   * Convenience getter to avoid accessing editor.model everywhere
   */
  get model(): IIModel
  {
    return this.editor.model
  }

  /**
   * Get the renderer from the editor
   * Convenience getter to avoid accessing editor.renderer everywhere
   */
  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  /**
   * Get the recognizer from the editor
   * Convenience getter to avoid accessing editor.recognizer everywhere
   */
  get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  /**
   * Get the configuration from the editor
   * Convenience getter to avoid accessing editor.configuration everywhere
   */
  get configuration(): InteractiveInkEditorConfiguration
  {
    return this.editor.configuration
  }

  /**
   * Lifecycle hook called after manager initialization
   * Override in subclasses if needed
   *
   * This is called at the end of the constructor, allowing subclasses
   * to perform initialization that requires access to this.managerName
   * or other properties set in the subclass constructor.
   *
   * @example
   * ```typescript
   * protected onInit(): void {
   *   this.logger.info(`${this.managerName} initialized`)
   *   // Setup event listeners, etc.
   * }
   * ```
   */
  protected onInit?(): void

  /**
   * Lifecycle hook called when the manager is being destroyed
   * Override in subclasses to cleanup resources
   *
   * @example
   * ```typescript
   * protected onDestroy(): void {
   *   this.logger.info(`${this.managerName} destroyed`)
   *   // Remove event listeners, clear intervals, etc.
   * }
   * ```
   */
  protected onDestroy?(): void

  /**
   * Destroy the manager and cleanup resources
   * Calls the onDestroy hook if defined
   */
  destroy(): void
  {
    if (this.onDestroy) {
      this.onDestroy()
    }
  }
}
