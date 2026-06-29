import type { TPartialDeep } from "@/utils"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import type {
  TConvertionConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TShapeConfiguration,
  TTextRecognizerHTTPV2Configuration,
} from "./recognition"
import {
  DefaultExportConfiguration,
  DefaultMathV2Configuration,
  DefaultRawContentV2Configuration,
  DefaultShapeConfiguration,
  DefaultTexConfigurationV2,
} from "./recognition"
import type { TRecognitionTypeV2 } from "./RecognitionConfiguration"
import type { TServerHTTPConfiguration } from "./ServerConfiguration"
import { DefaultServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TRecognizerHTTPV2RecognitionConfiguration = {
  type: TRecognitionTypeV2
  lang: string
  math: TMathConfiguration
  text: TTextRecognizerHTTPV2Configuration
  shape: TShapeConfiguration
  "raw-content": TRawContentConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRecognizerHTTPV2RecognitionConfiguration: TRecognizerHTTPV2RecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathV2Configuration,
  shape: DefaultShapeConfiguration,
  "raw-content": DefaultRawContentV2Configuration,
  text: DefaultTexConfigurationV2,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Recognizer
 */
export type TRecognizerHTTPV2Configuration = {
  server: TServerHTTPConfiguration
  recognition: TRecognizerHTTPV2RecognitionConfiguration
}

/**
 * @group Recognizer
 */
export const DefaultRecognizerHTTPV2Configuration: TRecognizerHTTPV2Configuration = {
  server: DefaultServerHTTPConfiguration,
  recognition: DefaultRecognizerHTTPV2RecognitionConfiguration,
}

/**
 * @group Recognizer
 * @source
 */
export class RecognizerHTTPV2Configuration implements TRecognizerHTTPV2Configuration {
  recognition: TRecognizerHTTPV2RecognitionConfiguration
  server: TServerHTTPConfiguration

  constructor(configuration?: TPartialDeep<TRecognizerHTTPV2Configuration>) {
    this.server = mergeDeep({}, DefaultRecognizerHTTPV2Configuration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultRecognizerHTTPV2Configuration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes.filter((t) => !!t)
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes.filter((t) => !!t)
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

    if (configuration?.recognition?.shape?.mimeTypes) {
      this.recognition.shape.mimeTypes = configuration.recognition.shape.mimeTypes.filter((t) => !!t)
    }
    this.recognition.shape.mimeTypes = [...new Set(this.recognition.shape.mimeTypes)]

    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration?.recognition?.[
        "raw-content"
      ]?.recognition?.types.filter((t) => !!t)
    }
    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration?.recognition?.[
        "raw-content"
      ]?.classification?.types.filter((t) => !!t)
    }

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
