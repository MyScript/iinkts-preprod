
import type { TEraserConfiguration } from "./EraserConfiguration";
import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Recognizer
 */
export type TRawContentConfiguration = {
  text?: TTextConfConfiguration
  "session-time"?: number
  recognition: {
    types: ("text" | "shape" | "math" | "decoration")[]
  }
  classification: {
    types: ("text" | "shape" | "math" | "decoration" | "drawing")[]
  }
  eraser?: TEraserConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRawContentConfiguration: TRawContentConfiguration = {
  recognition: {
    types: [ "text", "math", "shape", "decoration"]
  },
  classification: {
    types: [ "text", "math", "shape", "decoration", "drawing"]
  },
  eraser: DefaultEraserConfiguration,
}
