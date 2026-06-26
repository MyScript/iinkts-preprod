import type { TGrabberConfiguration } from "@/grabber";
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history";
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger";
import { DefaultLoggerConfiguration } from "@/logger"
import type { TRecognizerHTTPV2Configuration, TRecognizerHTTPV2RecognitionConfiguration, TServerHTTPConfiguration } from "@/recognizer";
import { DefaultRecognizerHTTPV2Configuration, RecognizerHTTPV2Configuration } from "@/recognizer"
import type { TIIRendererConfiguration } from "@/renderer";
import { DefaultIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style";
import { DefaultStyle } from "@/style"
import type { TPartialDeep } from "@/utils";
import { convertPixelToMillimeter, mergeDeep } from "@/utils"
import type { TEditorConfiguration } from "@/editor/AbstractEditor"
import type { TEditorTriggerConfiguration } from "@/editor/EditorTriggerConfiguration";
import { DefaultEditorTriggerConfiguration } from "@/editor/EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TInkEditorConfiguration = TEditorConfiguration & TRecognizerHTTPV2Configuration & {
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle
}

/**
 * @group Editor
 * @source
 */
export const DefaultInkEditorConfiguration: TInkEditorConfiguration = {
  server: DefaultRecognizerHTTPV2Configuration.server,
  recognition: DefaultRecognizerHTTPV2Configuration.recognition,
  rendering: DefaultIIRendererConfiguration,
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultEditorTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: DefaultStyle,
}

/**
 * @group Editor
 */
export class InkEditorConfiguration implements TInkEditorConfiguration
{
  server: TServerHTTPConfiguration
  recognition: TRecognizerHTTPV2RecognitionConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle

  constructor(configuration?: TPartialDeep<InkEditorConfiguration>)
  {
    const { server, recognition } = new RecognizerHTTPV2Configuration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultInkEditorConfiguration.rendering, configuration?.rendering)
    this.recognition.text.guides.enable = this.rendering.guides.enable
    if (this.rendering.guides.enable)
    {
      this.recognition.text.guides["line-gap-mm"] = convertPixelToMillimeter(this.rendering.guides.gap)
    }
    this.grabber = mergeDeep({}, DefaultInkEditorConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkEditorConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkEditorConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkEditorConfiguration.penStyle, configuration?.penStyle)
  }
}
