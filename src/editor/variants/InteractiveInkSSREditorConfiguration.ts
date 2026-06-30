import type { TEditorConfiguration } from "@/editor/AbstractEditor"
import type { TEditorTriggerConfiguration } from "@/editor/EditorTriggerConfiguration"
import { DefaultEditorTriggerConfiguration } from "@/editor/EditorTriggerConfiguration"
import type { TGrabberConfiguration } from "@/grabber"
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history"
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration } from "@/logger"
import type {
  TRecognizerWebSocketSSRConfiguration,
  TRecognizerWebSocketSSRRecognitionConfiguration,
  TServerWebsocketConfiguration,
} from "@/recognizer"
import { DefaultRecognizerWebSocketSSRConfiguration, RecognizerWebSocketSSRConfiguration } from "@/recognizer"
import type { TRendererConfiguration } from "@/renderer"
import { DefaultRendererConfiguration } from "@/renderer"
import type { TPenStyle, TTheme } from "@/style"
import { DefaultTheme } from "@/style"
import type { TPartialDeep } from "@/utils"
import { mergeDeep } from "@/utils"

/**
 * @group Editor
 */
export type TInteractiveInkSSREditorConfiguration = TEditorConfiguration &
  TRecognizerWebSocketSSRConfiguration & {
    rendering: TRendererConfiguration
    smartGuide: {
      enable: boolean
    }
    "undo-redo": THistoryConfiguration
    grabber: TGrabberConfiguration
    triggers: TEditorTriggerConfiguration
    logger: TLoggerConfiguration
    penStyle: TPenStyle
    penStyleClasses?: string
    theme: TTheme
  }

/**
 * @group Editor
 * @source
 */
export const DefaultInteractiveInkSSREditorConfiguration: TInteractiveInkSSREditorConfiguration = {
  server: DefaultRecognizerWebSocketSSRConfiguration.server,
  recognition: DefaultRecognizerWebSocketSSRConfiguration.recognition,
  rendering: DefaultRendererConfiguration,
  smartGuide: {
    enable: true,
  },
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultEditorTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: {},
  theme: DefaultTheme,
}

/**
 * @group Editor
 */
export class InteractiveInkSSREditorConfiguration implements TInteractiveInkSSREditorConfiguration {
  server: TServerWebsocketConfiguration
  recognition: TRecognizerWebSocketSSRRecognitionConfiguration
  rendering: TRendererConfiguration
  smartGuide: {
    enable: boolean
  }
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: TPartialDeep<TInteractiveInkSSREditorConfiguration>) {
    const { server, recognition } = new RecognizerWebSocketSSRConfiguration(configuration)
    this.server = server
    this.recognition = recognition

    this.rendering = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.rendering, configuration?.rendering)
    this.smartGuide = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.smartGuide, configuration?.smartGuide)
    this["undo-redo"] = mergeDeep(
      {},
      DefaultInteractiveInkSSREditorConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.grabber = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.grabber, configuration?.grabber)
    this.triggers = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.theme, configuration?.theme)

    if (this.recognition.type !== "TEXT") {
      this.smartGuide.enable = false
    }
    if (this.smartGuide.enable && !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")) {
      this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
    }
  }
}
