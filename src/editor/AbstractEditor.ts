import type { TPartialDeep, TApiInfos } from "@/utils";
import { getApiInfos } from "@/utils"
import type {
  TLoggerConfiguration
} from "@/logger";
import {
  LoggerCategory,
  LoggerManager,
  DefaultLoggerConfiguration
} from "@/logger"
import type { TServerHTTPConfiguration } from "@/recognizer"
import { EditorEvent } from "./EditorEvent"
import { EditorLayer } from "./EditorLayer"

/**
 * @hidden
 * @group Editor
 */
export type TEditorConfiguration = {
  logger: TLoggerConfiguration
}

/**
 * @group Editor
 * @remarks "INKV1" is deprecated use "INKV2" instead.
 */
export type TEditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2"

/**
 * @hidden
 * @group Editor
 */
export type TEditorOptionsBase = {
  configuration: TEditorConfiguration
  override?: {
    cssClass?: string
  }
}

/**
 * @hidden
 * @group Editor
 */
export abstract class AbstractEditor
{
  /** Logger instance for this editor. */
  logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  /** DOM layer manager handling rendering, UI, and modal elements. */
  layers: EditorLayer
  /** Event bus for subscribing to editor lifecycle and content events. */
  event: EditorEvent
  /** Server API information (version, etc.) loaded on first connection. */
  info?: TApiInfos

  #loggerConfiguration!: TLoggerConfiguration
  #resizeObserver?: ResizeObserver
  #resizeDebounceTimer?: ReturnType<typeof setTimeout>

  constructor(rootElement: HTMLElement, options?: TPartialDeep<TEditorOptionsBase>)
  {
    this.loggerConfiguration = { ...DefaultLoggerConfiguration, ...options?.configuration?.logger }
    this.logger.info("constructor", { rootElement, options })

    this.event = new EditorEvent(rootElement)
    this.layers = new EditorLayer(rootElement, options?.override?.cssClass || "ms-editor")

    //@ts-ignore
    rootElement.editor = this
  }

  get loggerConfiguration(): TLoggerConfiguration
  {
    return this.#loggerConfiguration
  }

  set loggerConfiguration(loggerConfig: TLoggerConfiguration)
  {
    this.#loggerConfiguration = { ...DefaultLoggerConfiguration, ...loggerConfig }
    LoggerManager.setLoggerLevel(this.#loggerConfiguration)
  }

  abstract initialize(): Promise<void>

  abstract clear(): Promise<void>

  abstract destroy(): Promise<void>

  abstract resize(dims?: { height?: number; width?: number }): Promise<void>

  protected startResizeObserver(): void
  {
    this.#resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.#resizeDebounceTimer)
      this.#resizeDebounceTimer = setTimeout(() => this.resize(), 150)
    })
    this.#resizeObserver.observe(this.layers.root)
  }

  protected stopResizeObserver(): void
  {
    clearTimeout(this.#resizeDebounceTimer)
    this.#resizeObserver?.disconnect()
    this.#resizeObserver = undefined
  }

  async loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>
  {
    if (!this.info) {
      this.info = await getApiInfos({ server })
    }
    return this.info
  }
}
