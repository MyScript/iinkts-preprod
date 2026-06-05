import { SvgElementRole } from "@/Constants"
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
import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IITranslateManager extends IIAbstractTransformManager<[number, number]>
{
  protected managerName = "IITranslateManager"
  protected transformName = "translate"
  transformOrigin!: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  protected applyToStroke(stroke: IIStroke, tx: number, ty: number): IIStroke
  {
    // NEW ARCHITECTURE: Skip solver outputs - they should be recalculated
    if (stroke.isSolverOutput) {
      this.logger.warn("applyToStroke", "Skipping solver output stroke - it will be recalculated", stroke.id)
      return stroke
    }

    stroke.pointers.forEach(p =>
    {
      p.x += tx
      p.y += ty
    })

    // Note: Text bounds in blockMetadata would need to be translated too
    // but this is now handled by the IIBlockMetadataManager during synchronization
    // The bounds will be recalculated on the next sync from the backend

    return stroke
  }

  protected applyToShape(shape: TIIShape, tx: number, ty: number): TIIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse:
      case ShapeKind.Circle: {
        shape.center.x += tx
        shape.center.y += ty
        return shape
      }
      case ShapeKind.Polygon: {
        shape.points.forEach(p =>
        {
          p.x += tx
          p.y += ty
        })
        return shape
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknown: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TIIEdge, tx: number, ty: number): TIIEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.center.x += tx
        edge.center.y += ty
        return edge
      }
      case EdgeKind.Line: {
        edge.start.x += tx
        edge.start.y += ty
        edge.end.x += tx
        edge.end.y += ty
        return edge
      }
      case EdgeKind.PolyEdge: {
        edge.points.forEach(p =>
        {
          p.x += tx
          p.y += ty
        })
        return edge
      }
    }

    return edge
  }

  protected applyOnText(text: IIText, tx: number, ty: number): IIText
  {
    if (text.rotation) {
      text.rotation.center = { x: text.rotation.center.x + tx, y: text.rotation.center.y + ty }
    }
    text.point.x += tx
    text.point.y += ty
    return this.editor.texter.updateBounds(text)
  }

  protected applyOnMath(math: IIMath, tx: number, ty: number): IIMath
  {
    if (math.rotation) {
      math.rotation.center = { x: math.rotation.center.x + tx, y: math.rotation.center.y + ty }
    }
    math.point.x += tx
    math.point.y += ty

    // Update bounds
    math.bounds.x += tx
    math.bounds.y += ty

    // Update element bounds
    math.elements.forEach(e => {
      e.bounds.x += tx
      e.bounds.y += ty
    })

    return math
  }

  // applyOnRecognizedSymbol removed - recognized symbols no longer exist

  translate(symbols: TIISymbol[], tx: number, ty: number, addToHistory = true): Promise<void>
  {
    this.logger.info("translate", { symbols, tx, ty })
    symbols.forEach(s =>
    {
      this.applyToSymbol(s, tx, ty)
      this.model.updateSymbol(s)
      this.editor.renderer.drawSymbol(s)
    })
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
    this.interactElementsGroup = (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
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
    return {
      tx,
      ty
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.logger.info("end", { point })
    const { tx, ty } = this.continue(point)
    this.editor.snaps.clearSnapToElementLines()
    this.translate(this.model.symbolsSelected, tx, ty)

    this.interactElementsGroup = undefined
    this.editor.svgDebugger.apply()
  }

}
