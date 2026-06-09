import { mergeDeep, PartialDeep } from "@/utils"
import { DefaultStyle, TStyle } from "@/style"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "@/logger"
import { DefaultGrabberConfiguration, TGrabberConfiguration } from "@/grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "@/history"
import { DefaultMenuConfiguration, TMenuConfiguration } from "@/menu"
import { DefaultRecognizerWebSocketConfiguration, RecognizerWebSocketConfiguration, TRecognitionWebSocketConfiguration, TRecognizerWebSocketConfiguration, TServerWebsocketConfiguration } from "@/recognizer"
import { DefaultIIRendererConfiguration, TIIRendererConfiguration } from "@/renderer"
import { DefaultGestureConfiguration, TGestureConfiguration, DefaultSnapConfiguration, SnapConfiguration, TSnapConfiguration } from "@/manager"
import { TEditorConfiguration } from "@/editor/AbstractEditor"

/**
 * @group Editor
 * @remarks Level of text selection granularity
 */
export type TTextSelectionLevel = "block" | "word" | "char"

/**
 * @group Editor
 * @remarks Level of math selection granularity
 */
export type TMathSelectionLevel = "block" | "operand"

/**
 * @group Editor
 * @remarks Level of shape (Node/Edge) selection granularity
 */
export type TShapeSelectionLevel = "element" | "stroke"

/**
 * @group Editor
 */
export type TInteractiveInkEditorConfiguration = TEditorConfiguration & TRecognizerWebSocketConfiguration & {
 "undo-redo": THistoryConfiguration
  rendering: TIIRendererConfiguration
  grabber: TGrabberConfiguration
  menu: TMenuConfiguration
  penStyle: TStyle,
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration
  textSelectionLevel: TTextSelectionLevel
  mathSelectionLevel: TMathSelectionLevel
  shapeSelectionLevel: TShapeSelectionLevel
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
  textSelectionLevel: "block",
  mathSelectionLevel: "block",
  shapeSelectionLevel: "element",
}

/**
 * @group Editor
 */
export class InteractiveInkEditorConfiguration implements TInteractiveInkEditorConfiguration
{
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
  textSelectionLevel: TTextSelectionLevel
  mathSelectionLevel: TMathSelectionLevel
  shapeSelectionLevel: TShapeSelectionLevel

  constructor(configuration?: PartialDeep<TInteractiveInkEditorConfiguration>)
  {
    const { server, recognition } =  new RecognizerWebSocketConfiguration(configuration)
    this.recognition = recognition
    this.server = server

    this.grabber = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.grabber, configuration?.grabber)
    this.logger = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.logger, configuration?.logger)
    this.rendering = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.rendering, configuration?.rendering)
    this["undo-redo"] = mergeDeep({}, DefaultInteractiveInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.menu = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.menu, configuration?.menu)
    if (configuration?.menu?.style) {
      if (configuration.menu.style.colors) {
        this.menu.style.colors = configuration.menu.style.colors.filter((color): color is string => color !== undefined)
      }
      if (configuration.menu.style.thicknessList) {
        this.menu.style.thicknessList = configuration.menu.style.thicknessList.filter((item): item is { label: string, value: number } => item !== undefined)
      }
      if (configuration.menu.style.fontSizeList) {
        this.menu.style.fontSizeList = configuration.menu.style.fontSizeList.filter((item): item is { label: string, value: "auto" | number } => item !== undefined)
      }
      if (configuration.menu.style.fontWeightList) {
        this.menu.style.fontWeightList = configuration.menu.style.fontWeightList.filter((item): item is { label: string, value: "auto" | "normal" | "bold" } => item !== undefined)
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

    this.penStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.penStyle, configuration?.penStyle)
    this.fontStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.fontStyle, configuration?.fontStyle)
    this.textSelectionLevel = configuration?.textSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.textSelectionLevel
    this.mathSelectionLevel = configuration?.mathSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.mathSelectionLevel
    this.shapeSelectionLevel = configuration?.shapeSelectionLevel ?? DefaultInteractiveInkEditorConfiguration.shapeSelectionLevel
  }
}
