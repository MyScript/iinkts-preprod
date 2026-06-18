import { SvgElementRole } from "@/Constants"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import
{
  IIStroke,
  IIText,
  IIMath,
  SymbolType,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TPoint
} from "@/symbol"
import { LoggerCategory } from "@/logger"
import { MatrixTransform } from "@/transform"
import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
export abstract class IIAbstractTransformManager extends IIAbstractManager
{
  protected abstract transformName: string
  interactElementsGroup?: SVGElement

  constructor(editor: InteractiveInkEditor)
  {
    super(editor, LoggerCategory.TRANSFORMER)
  }

  protected applyMatrixToPoints(points: TPoint[], matrix: MatrixTransform): void
  {
    points.forEach(p =>
    {
      const np = matrix.applyToPoint(p)
      p.x = +np.x.toFixed(3)
      p.y = +np.y.toFixed(3)
    })
  }

  setTransformOrigin(id: string, originX: number, originY: number): void
  {
    this.editor.renderer.setAttribute(id, "transform-origin", `${ originX }px ${ originY }px`)
  }

  protected resolveInteractGroup(target: Element): SVGGElement
  {
    return (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
  }

  protected applyAndDraw(symbols: TIISymbol[], matrix: MatrixTransform): void
  {
    symbols.forEach(s =>
    {
      this.applyToSymbol(s, matrix)
      this.editor.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })
  }

  protected finalizeTransform(): void
  {
    this.interactElementsGroup = undefined
    this.editor.overlays.apply()
  }

  protected abstract applyToStroke(stroke: IIStroke, matrix: MatrixTransform): IIStroke
  protected abstract applyToShape(shape: TIIShape, matrix: MatrixTransform): TIIShape
  protected abstract applyToEdge(edge: TIIEdge, matrix: MatrixTransform): TIIEdge
  protected abstract applyOnText(text: IIText, matrix: MatrixTransform): IIText
  protected abstract applyOnMath(math: IIMath, matrix: MatrixTransform): IIMath

  applyToSymbol(symbol: TIISymbol, matrix: MatrixTransform): TIISymbol
  {
    this.logger.info("applyToSymbol", { symbol })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, matrix)
      case SymbolType.Shape:
        return this.applyToShape(symbol, matrix)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, matrix)
      case SymbolType.Text:
        return this.applyOnText(symbol, matrix)
      case SymbolType.Math:
        return this.applyOnMath(symbol, matrix)
      default:
        throw new Error(`Can't apply ${ this.transformName } on symbol, type unknown: ${ JSON.stringify(symbol) }`)
    }
  }
}
