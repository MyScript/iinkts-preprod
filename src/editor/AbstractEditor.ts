import { getApiInfos, PartialDeep, TApiInfos } from "@/utils"
import {
  LoggerCategory,
  LoggerManager,
  DefaultLoggerConfiguration,
  TLoggerConfiguration
} from "@/logger"
import { TServerHTTPConfiguration } from "@/recognizer"
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
export type EditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2"

/**
 * @hidden
 * @group Editor
 */
export type EditorOptionsBase = {
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

  constructor(rootElement: HTMLElement, options?: PartialDeep<EditorOptionsBase>)
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

  async loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>
  {
    if (!this.info) {
      this.info = await getApiInfos({ server })
    }
    return this.info
  }
}
