import { StrokeHelper } from "@/symbol/stroke/Stroke"
import type { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import type {
  TStroke,
  TText,
  TMath,
  TEdge,
  TShape,
  TPoint} from "@/symbol";
import
{
  EdgeKind,
  ShapeKind,
  updateShapeDerivedFields,
  updateEdgeDerivedFields,
  cloneSymbol,
} from "@/symbol"
import { BoxHelper } from "@/symbol/primitives/Box"
import { computeAngleRadian, convertDegreeToRadian, convertRadianToDegree, TWO_PI } from "@/utils"
import { MatrixTransform } from "@/transform"
import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IIRotationManager extends IIAbstractTransformManager
{
  protected managerName = "IIRotationManager"
  protected transformName = "rotate"
  center!: TPoint
  origin!: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke
  {
    if (stroke.isSolverOutput) {
      this.logger.warn("applyToStroke", "Skipping solver output stroke - it will be recalculated", stroke.id)
      return stroke
    }
    this.applyMatrixToPoints(stroke.pointers, matrix)
    StrokeHelper.updateBounds(stroke)
    return stroke
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        shape.center = matrix.applyToPoint(shape.center)
        shape.orientation = (shape.orientation + MatrixTransform.rotation(matrix)) % TWO_PI
        updateShapeDerivedFields(shape)
        return shape
      }
      case ShapeKind.Circle: {
        shape.center = matrix.applyToPoint(shape.center)
        updateShapeDerivedFields(shape)
        return shape
      }
      case ShapeKind.Polygon: {
        this.applyMatrixToPoints(shape.points, matrix)
        updateShapeDerivedFields(shape)
        return shape
      }
      default:
        throw new Error(`Can't apply rotate on shape, kind unknown: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.phi = (edge.phi - MatrixTransform.rotation(matrix)) % TWO_PI
        edge.center = matrix.applyToPoint(edge.center)
        updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.Line: {
        edge.start = matrix.applyToPoint(edge.start)
        edge.end = matrix.applyToPoint(edge.end)
        updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.PolyEdge: {
        edge.points = edge.points.map(p => matrix.applyToPoint(p))
        updateEdgeDerivedFields(edge)
        return edge
      }
      default:
        throw new Error(`Can't apply rotate on edge, kind unknown: ${ JSON.stringify(edge) }`)
    }
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText
  {
    text.rotation = {
      degree: convertRadianToDegree(MatrixTransform.rotation(matrix)) + (text.rotation?.degree || 0),
      center: this.center
    }
    return this.editor.typeset.updateBounds(text)
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath
  {
    math.rotation = {
      degree: convertRadianToDegree(MatrixTransform.rotation(matrix)) + (math.rotation?.degree || 0),
      center: this.center
    }
    return math
  }

  rotateElement(id: string, degree: number): void
  {
    this.logger.info("rotateElement", { id, degree })
    this.editor.renderer.setAttribute(id, "transform", `rotate(${ degree })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.logger.info("start", { target })
    this.interactElementsGroup = this.resolveInteractGroup(target)
    const boundingBox = BoxHelper.createFromPoints(this.model.symbolsSelected.flatMap(s => s.vertices))

    this.center = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2
    }
    this.origin = origin
    this.setTransformOrigin(this.interactElementsGroup.id, this.center.x, this.center.y)
    this.model.symbolsSelected.forEach(s =>
    {
      this.setTransformOrigin(s.id, this.center.x, this.center.y)
    })
    this.clearGhostStrokesForSelectedMath()
  }

  continue(point: TPoint): number
  {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = Math.round(convertRadianToDegree(computeAngleRadian(this.origin, this.center, point)))

    angleDegree = this.editor.snaps.snapRotation(angleDegree)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }

    this.rotateElement(this.interactElementsGroup.id, angleDegree)
    this.model.symbolsSelected.forEach(s =>
    {
      this.rotateElement(s.id, angleDegree)
    })
    return angleDegree
  }

  async end(point: TPoint): Promise<void>
  {
    this.logger.info("end", { point })
    const angleDegree = this.continue(point)
    const angleRad = convertDegreeToRadian(angleDegree) % TWO_PI
    const oldSymbols = this.model.symbolsSelected.map(s => cloneSymbol(s))
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    this.applyAndDraw(this.model.symbolsSelected, matrix)
    const strokesFromSymbols = this.editor.extractStrokesFromSymbols(this.model.symbolsSelected)
    this.editor.recognizer.transformRotate(strokesFromSymbols.map(s => s.id), angleRad, this.center.x, this.center.y)
    this.editor.history.push(this.model, { rotate: [{ symbols: oldSymbols, angle: angleRad, center: {...this.center} }] })
    this.finalizeTransform()
  }
}
