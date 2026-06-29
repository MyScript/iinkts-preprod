import type { TPartialDeep } from "@/utils";
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"
import type {
  TConvertionConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration
} from "./recognition";
import {
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultTextConfiguration
} from "./recognition"
import type { TRecognitionTypeV1 } from "./RecognitionConfiguration"
import type { TServerWebsocketConfiguration } from "./ServerConfiguration";
import { DefaultServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRRecognitionConfiguration = {
  type: Omit<TRecognitionTypeV1, "DIAGRAM" | "Raw Content">
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRecognizerWebSocketSSRRecognitionConfiguration: TRecognizerWebSocketSSRRecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  renderer: DefaultRecognitionRendererConfiguration,
  text: DefaultTextConfiguration,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TRecognizerWebSocketSSRRecognitionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRecognizerWebSocketSSRConfiguration: TRecognizerWebSocketSSRConfiguration =
{
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultRecognizerWebSocketSSRRecognitionConfiguration
}

/**
 * @group Recognizer
 */
export class RecognizerWebSocketSSRConfiguration implements TRecognizerWebSocketSSRConfiguration
{
  recognition: TRecognizerWebSocketSSRRecognitionConfiguration
  server: TServerWebsocketConfiguration

  constructor(configuration?: TPartialDeep<TRecognizerWebSocketSSRConfiguration>) {
    this.server = mergeDeep({}, DefaultRecognizerWebSocketSSRConfiguration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultRecognizerWebSocketSSRConfiguration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes as ("text/plain" | "application/vnd.myscript.jiix")[]
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes as ("application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml")[]
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

    if (this.server.version) {
      if (!isVersionSuperiorOrEqual(this.server.version, "2.3.0")) {
        delete this.recognition.convert
      }
      if (!isVersionSuperiorOrEqual(this.server.version, "3.2.0")) {
        delete this.recognition.export.jiix.text.lines
      }
    }
  }
}
