import type { TEditorConfiguration } from "@/editor/AbstractEditor"
import type { TGrabberConfiguration } from "@/grabber"
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history"
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration } from "@/logger"
import type { TGestureConfiguration, TMathConfig, TOverlayConfig, TSnapConfiguration } from "@/manager"
import {
  DefaultGestureConfiguration,
  DefaultOverlayConfig,
  DefaultSnapConfiguration,
  SnapConfiguration,
} from "@/manager"
import type { TMenuConfiguration } from "@/menu"
import { DefaultMenuConfiguration } from "@/menu"
import type {
  TRecognitionWebSocketConfiguration,
  TRecognizerWebSocketConfiguration,
  TServerWebsocketConfiguration,
} from "@/recognizer"
import { DefaultRecognizerWebSocketConfiguration, RecognizerWebSocketConfiguration } from "@/recognizer"
import type { TIIRendererConfiguration } from "@/renderer"
import { DefaultIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TPartialDeep } from "@/utils"
import { mergeDeep } from "@/utils"

/**
 * @group Editor
 * @remarks Level of text selection granularity
 */
export type TTextSelectionLevel = "element" | "word" | "char"

/**
 * @group Editor
 * @remarks Level of math selection granularity
 */
export type TMathSelectionLevel = "element" | "operand"

/**
 * @group Editor
 * @remarks Level of shape (Node/Edge) selection granularity
 */
export type TShapeSelectionLevel = "element" | "stroke"

/**
 * @group Editor
 */
export type TInteractiveInkEditorConfiguration = TEditorConfiguration &
  TRecognizerWebSocketConfiguration & {
    "undo-redo": THistoryConfiguration
    rendering: TIIRendererConfiguration
    grabber: TGrabberConfiguration
    menu: TMenuConfiguration
    penStyle: TStyle
    fontStyle: {
      size: number | "auto"
      weight: "bold" | "normal" | "auto"
    }
    gesture: TGestureConfiguration
    snap: TSnapConfiguration
    overlays: TOverlayConfig
    textSelectionLevel: TTextSelectionLevel
    mathSelectionLevel: TMathSelectionLevel
    shapeSelectionLevel: TShapeSelectionLevel
    /** Math manager configuration (computation behavior and visual interactions) */
    math: TMathConfig
    /** CSS custom property overrides applied to the editor root element (e.g. `{ "--iink-primary": "#ff0" }`) */
    cssVars?: Record<string, string>
  }

/**
 * @group Editor
 * @source
 */
export const DefaultInteractiveInkEditorConfiguration: TInteractiveInkEditorConfiguration = {
  server: DefaultRecognizerWebSocketConfiguration.server,
  recognition: DefaultRecognizerWebSocketConfiguration.recognition,
  menu: DefaultMenuConfiguration,
  rendering: DefaultIIRendererConfiguration,
  logger: DefaultLoggerConfiguration,
  grabber: DefaultGrabberConfiguration,
  "undo-redo": DefaultHistoryConfiguration,

  penStyle: DefaultStyle,
  fontStyle: {
    size: "auto",
    weight: "auto",
  },
  gesture: DefaultGestureConfiguration,
  snap: DefaultSnapConfiguration,
  overlays: DefaultOverlayConfig,
  textSelectionLevel: "element",
  mathSelectionLevel: "element",
  shapeSelectionLevel: "element",
  math: {},
  cssVars: undefined,
}

/**
 * @group Editor
 */
export class InteractiveInkEditorConfiguration implements TInteractiveInkEditorConfiguration {
  grabber: TGrabberConfiguration
  logger: TLoggerConfiguration
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  menu: TMenuConfiguration

  penStyle: TStyle
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration
  overlays: TOverlayConfig
  textSelectionLevel: TTextSelectionLevel
  mathSelectionLevel: TMathSelectionLevel
  shapeSelectionLevel: TShapeSelectionLevel
  math: TMathConfig
  cssVars?: Record<string, string>

  constructor(configuration?: TPartialDeep<TInteractiveInkEditorConfiguration>) {
    const { server, recognition } = new RecognizerWebSocketConfiguration(configuration)
    this.recognition = recognition
    this.server = server

    this.grabber = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.grabber, configuration?.grabber)
    this.logger = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.logger, configuration?.logger)
    this.rendering = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.rendering, configuration?.rendering)
    this["undo-redo"] = mergeDeep(
      {},
      DefaultInteractiveInkEditorConfiguration["undo-redo"],
      configuration?.["undo-redo"]
    )
    this.menu = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.menu, configuration?.menu)
    if (configuration?.menu?.style) {
      if (configuration.menu.style.colors) {
        this.menu.style.colors = configuration.menu.style.colors.filter((color): color is string => color !== undefined)
      }
      if (configuration.menu.style.thicknessList) {
        this.menu.style.thicknessList = configuration.menu.style.thicknessList.filter(
          (
            item
          ): item is {
            label: string
            value: number
          } => item !== undefined
        )
      }
      if (configuration.menu.style.fontSizeList) {
        this.menu.style.fontSizeList = configuration.menu.style.fontSizeList.filter(
          (
            item
          ): item is {
            label: string
            value: "auto" | number
          } => item !== undefined
        )
      }
      if (configuration.menu.style.fontWeightList) {
        this.menu.style.fontWeightList = configuration.menu.style.fontWeightList.filter(
          (
            item
          ): item is {
            label: string
            value: "auto" | "normal" | "bold"
          } => item !== undefined
        )
      }
      this.menu.style.strokeColor = configuration.menu.style.strokeColor ?? this.menu.style.strokeColor
      this.menu.style.fillColor = configuration.menu.style.fillColor ?? this.menu.style.fillColor
      this.menu.style.thickness = configuration.menu.style.thickness ?? this.menu.style.thickness
      this.menu.style.fontSize = configuration.menu.style.fontSize ?? this.menu.style.fontSize
      this.menu.style.fontWeight = configuration.menu.style.fontWeight ?? this.menu.style.fontWeight
      this.menu.style.opacity = configuration.menu.style.opacity ?? this.menu.style.opacity
    }
    this.gesture = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.gesture, configuration?.gesture)
    this.snap = new SnapConfiguration(configuration?.snap)
    this.overlays = mergeDeep({}, DefaultOverlayConfig, configuration?.overlays)

    this.penStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.penStyle, configuration?.penStyle)
    this.fontStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.fontStyle, configuration?.fontStyle)
    this.textSelectionLevel =
      configuration?.textSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.textSelectionLevel
    this.mathSelectionLevel =
      configuration?.mathSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.mathSelectionLevel
    this.shapeSelectionLevel =
      configuration?.shapeSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.shapeSelectionLevel
    this.math = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.math, configuration?.math)
    this.cssVars = configuration?.cssVars as Record<string, string> | undefined
  }
}
