import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import
{
  EdgeKind,
  IIStroke,
  IIText,
  IIMath,
  ShapeKind,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TPoint
} from "@/symbol"
import { MatrixTransform } from "@/transform"
import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IITranslateManager extends IIAbstractTransformManager
{
  protected managerName = "IITranslateManager"
  protected transformName = "translate"
  transformOrigin!: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  protected applyToStroke(stroke: IIStroke, matrix: MatrixTransform): IIStroke
  {
    this.applyMatrixToPoints(stroke.pointers, matrix)
    return stroke
  }

  protected applyToShape(shape: TIIShape, matrix: MatrixTransform): TIIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse:
      case ShapeKind.Circle: {
        shape.center = matrix.applyToPoint(shape.center)
        return shape
      }
      case ShapeKind.Polygon: {
        this.applyMatrixToPoints(shape.points, matrix)
        return shape
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknown: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TIIEdge, matrix: MatrixTransform): TIIEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.center = matrix.applyToPoint(edge.center)
        return edge
      }
      case EdgeKind.Line: {
        edge.start = matrix.applyToPoint(edge.start)
        edge.end = matrix.applyToPoint(edge.end)
        return edge
      }
      case EdgeKind.PolyEdge: {
        this.applyMatrixToPoints(edge.points, matrix)
        return edge
      }
    }
    return edge
  }

  protected applyOnText(text: IIText, matrix: MatrixTransform): IIText
  {
    if (text.rotation) {
      text.rotation.center = matrix.applyToPoint(text.rotation.center)
    }
    const np = matrix.applyToPoint(text.point)
    text.point.x = +np.x.toFixed(3)
    text.point.y = +np.y.toFixed(3)
    return this.editor.texter.updateBounds(text)
  }

  protected applyOnMath(math: IIMath, matrix: MatrixTransform): IIMath
  {
    if (math.rotation) {
      math.rotation.center = matrix.applyToPoint(math.rotation.center)
    }
    const np = matrix.applyToPoint(math.point)
    math.point.x = +np.x.toFixed(3)
    math.point.y = +np.y.toFixed(3)

    const bp = matrix.applyToPoint({ x: math.bounds.x, y: math.bounds.y })
    math.bounds.x = +bp.x.toFixed(3)
    math.bounds.y = +bp.y.toFixed(3)

    math.elements.forEach(e =>
    {
      const ep = matrix.applyToPoint({ x: e.bounds.x, y: e.bounds.y })
      e.bounds.x = +ep.x.toFixed(3)
      e.bounds.y = +ep.y.toFixed(3)
    })

    return math
  }

  translate(symbols: TIISymbol[], tx: number, ty: number, addToHistory = true): Promise<void>
  {
    this.logger.info("translate", { symbols, tx, ty })
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.applyAndDraw(symbols, matrix)
    if (addToHistory) {
      this.editor.history.push(this.model, { translate: [{ symbols: this.model.symbolsSelected, tx, ty }] })
    }
    const strokes = this.editor.extractStrokesFromSymbols(symbols)
    return this.editor.recognizer.transformTranslate(strokes.map(s => s.id), tx, ty)
  }

  translateElement(id: string, tx: number, ty: number): void
  {
    this.logger.info("translateElement", { id, tx, ty })
    this.editor.renderer.setAttribute(id, "transform", `translate(${ tx },${ ty })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.logger.info("start", { origin })
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.transformOrigin = origin
  }

  continue(point: TPoint): { tx: number, ty: number }
  {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.editor.snaps.snapTranslate(tx, ty)
    tx = nudge.x
    ty = nudge.y

    this.translateElement(this.interactElementsGroup.id as string, tx, ty)
    this.model.symbolsSelected.forEach(s =>
    {
      this.translateElement(s.id as string, tx, ty)
    })
    return { tx, ty }
  }

  async end(point: TPoint): Promise<void>
  {
    this.logger.info("end", { point })
    const { tx, ty } = this.continue(point)
    this.editor.snaps.clearSnapToElementLines()
    this.translate(this.model.symbolsSelected, tx, ty)
    this.finalizeTransform()
  }
}
