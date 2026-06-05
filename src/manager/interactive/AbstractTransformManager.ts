import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { IIAbstractManager } from "./IIAbstractManager"
import
{
  IIStroke,
  IIText,
  IIMath,
  SymbolType,
  TIIEdge,
  TIIShape,
  TIISymbol
} from "@/symbol"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * Factorizes common code and structure across transformation types
 * Extends IIAbstractManager to benefit from common manager structure
 * @group Manager
 */
export abstract class IIAbstractTransformManager<TParams extends unknown[]> extends IIAbstractManager
{
  /**
   * Name of the transformation (translate, rotate, resize)
   * Used for error messages and logging
   */
  protected abstract transformName: string

  /**
   * SVG group element for interaction feedback
   */
  interactElementsGroup?: SVGElement

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
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

  // applyOnRecognizedSymbol removed - recognized symbols no longer exist

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
      // SymbolType.Recognized removed - recognized symbols no longer exist
      default:
        throw new Error(`Can't apply ${ this.transformName } on symbol, type unknown: ${ JSON.stringify(symbol) }`)
    }
  }
}
