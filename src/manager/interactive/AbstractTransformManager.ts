import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { LoggerCategory, LoggerManager } from "@/logger"
import { IIModel } from "@/model"
import
{
  IIStroke,
  IIText,
  IIMath,
  SymbolType,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TIIRecognized
} from "@/symbol"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * Factorizes common code and structure across transformation types
 * @group Manager
 */
export abstract class AbstractTransformManager<TParams extends unknown[]>
{
  protected logger = LoggerManager.getLogger(LoggerCategory.TRANSFORMER)
  protected abstract transformName: string
  editor: InteractiveInkEditor
  interactElementsGroup?: SVGElement

  constructor(editor: InteractiveInkEditor)
  {
    this.logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  /**
   * Apply transformation to a stroke
   * Must be implemented by concrete classes
   */
  protected abstract applyToStroke(stroke: IIStroke, ...params: TParams): IIStroke

  /**
   * Apply transformation to a shape
   * Must be implemented by concrete classes
   */
  protected abstract applyToShape(shape: TIIShape, ...params: TParams): TIIShape

  /**
   * Apply transformation to an edge
   * Must be implemented by concrete classes
   */
  protected abstract applyToEdge(edge: TIIEdge, ...params: TParams): TIIEdge

  /**
   * Apply transformation to text
   * Must be implemented by concrete classes
   */
  protected abstract applyOnText(text: IIText, ...params: TParams): IIText

  /**
   * Apply transformation to math
   * Must be implemented by concrete classes
   */
  protected abstract applyOnMath(math: IIMath, ...params: TParams): IIMath

  /**
   * Apply transformation to recognized symbol
   * Must be implemented by concrete classes
   */
  protected abstract applyOnRecognizedSymbol(recognized: TIIRecognized, ...params: TParams): TIIRecognized

  /**
   * Apply transformation to any symbol based on its type
   * Delegates to specific methods via template method pattern
   */
  applyToSymbol(symbol: TIISymbol, ...params: TParams): TIISymbol
  {
    this.logger.info("applyToSymbol", { symbol, params })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, ...params)
      case SymbolType.Shape:
        return this.applyToShape(symbol, ...params)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, ...params)
      case SymbolType.Text:
        return this.applyOnText(symbol, ...params)
      case SymbolType.Math:
        return this.applyOnMath(symbol, ...params)
      case SymbolType.Recognized:
        return this.applyOnRecognizedSymbol(symbol, ...params)
      default:
        throw new Error(`Can't apply ${ this.transformName } on symbol, type unknown: ${ JSON.stringify(symbol) }`)
    }
  }
}
