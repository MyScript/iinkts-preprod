import { LoggerCategory, LoggerManager } from "@/logger"

import type { TEditorType } from "./AbstractEditor"
import type { TInkEditorOptions } from "./variants/InkEditor"
import { InkEditor } from "./variants/InkEditor"
import type { TInkEditorDeprecatedOptions } from "./variants/InkEditorDeprecated"
import { InkEditorDeprecated } from "./variants/InkEditorDeprecated"
import type { TInteractiveInkEditorOptions } from "./variants/InteractiveInkEditor"
import { InteractiveInkEditor } from "./variants/InteractiveInkEditor"
import type { TInteractiveInkSSREditorOptions } from "./variants/InteractiveInkSSREditor"
import { InteractiveInkSSREditor } from "./variants/InteractiveInkSSREditor"

/**
 * @group Editor
 * @hidden
 */
export type TEditorVariantMap = {
  INTERACTIVEINK: InteractiveInkEditor
  INKV1: InkEditorDeprecated
  INTERACTIVEINKSSR: InteractiveInkSSREditor
  INKV2: InkEditor
}

/**
 * @group Editor
 * @hidden
 */
export type TEditorOptionsMap = {
  INTERACTIVEINK: TInteractiveInkEditorOptions
  INKV1: TInkEditorDeprecatedOptions
  INTERACTIVEINKSSR: TInteractiveInkSSREditorOptions
  INKV2: TInkEditorOptions
}

/**
 * @group Editor
 * @hidden
 */
export class EditorFactory {
  private static logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  private static instances = new Map<string, TEditorVariantMap[TEditorType]>()

  /**
   * Creates and initializes an editor instance based on the specified type
   * Replaces any previously created instance
   *
   * @template T - The editor type to create
   * @param rootElement - The HTML element to mount the editor
   * @param type - The editor variant type
   * @param options - Configuration options specific to the editor type
   * @returns Promise resolving to the initialized editor instance
   */
  static async createEditor<T extends TEditorType>(
    rootElement: HTMLElement,
    type: T,
    options: TEditorOptionsMap[T]
  ): Promise<TEditorVariantMap[T]> {
    EditorFactory.logger.info("createEditor", {
      type,
      options,
    })

    if (!options) {
      throw new Error(`Param 'options' missing`)
    }

    // Cleanup any existing instances before creating a new one
    await EditorFactory.clearInstances()

    let instance: TEditorVariantMap[TEditorType]

    // Create appropriate editor variant based on type
    switch (type) {
      case "INTERACTIVEINK":
        instance = new InteractiveInkEditor(rootElement, options as TInteractiveInkEditorOptions)
        break

      case "INKV1":
        EditorFactory.logger.warn("createEditor", "InkEditorDeprecated (INKV1) is deprecated, use INKV2 instead")
        instance = new InkEditorDeprecated(rootElement, options as TInkEditorDeprecatedOptions)
        break

      case "INKV2":
        instance = new InkEditor(rootElement, options as TInkEditorOptions)
        break

      case "INTERACTIVEINKSSR":
      default:
        instance = new InteractiveInkSSREditor(rootElement, options as TInteractiveInkSSREditorOptions)
        break
    }

    // Initialize the instance
    await instance.initialize()

    // Store instance for reference
    EditorFactory.instances.set(type, instance)

    return instance as TEditorVariantMap[T]
  }

  /**
   * Retrieves the currently active editor instance
   *
   * @returns The current editor instance or undefined if none exists
   */
  static getInstance(): TEditorVariantMap[TEditorType] | undefined {
    // Return the most recently created instance
    return Array.from(EditorFactory.instances.values()).pop()
  }

  /**
   * Retrieves a specific editor instance by type
   *
   * @param type - The editor type to retrieve
   * @returns The editor instance of the specified type or undefined
   */
  static getInstanceByType<T extends TEditorType>(type: T): TEditorVariantMap[T] | undefined {
    return EditorFactory.instances.get(type) as TEditorVariantMap[T] | undefined
  }

  /**
   * Clears all stored editor instances
   */
  static async clearInstances(): Promise<void> {
    for (const instance of EditorFactory.instances.values()) {
      await instance.destroy()
    }
    EditorFactory.instances.clear()
  }
}
