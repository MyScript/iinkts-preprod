import { ResizeDirection } from "@/Constants"
import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import
{
  Box,
  EdgeKind,
  IIStroke,
  IIText,
  IIMath,
  ShapeKind,
  TIIEdge,
  TIIShape,
  TPoint,
  isText,
  isMath,
  isShape,
  isCircleShape
} from "@/symbol"
import { MatrixTransform } from "@/transform"
import { IIAbstractTransformManager } from "./AbstractTransformManager"

const isEasternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast].includes(direction)

const isWesternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest].includes(direction)

const isNorthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest].includes(direction)

const isSouthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest].includes(direction)

/**
 * @group Manager
 */
export class IIResizeManager extends IIAbstractTransformManager
{
  protected managerName = "IIResizeManager"
  protected transformName = "resize"
  direction!: ResizeDirection
  boundingBox!: Box
  transformOrigin!: TPoint
  keepRatio = false

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
  }

  protected applyToStroke(stroke: IIStroke, matrix: MatrixTransform): IIStroke
  {
    this.logger.debug("applyToStroke", { stroke })
    if (stroke.isSolverOutput) {
      this.logger.warn("applyToStroke", "Skipping solver output stroke - it will be recalculated", stroke.id)
      return stroke
    }
    this.applyMatrixToPoints(stroke.pointers, matrix)
    return stroke
  }

  protected applyToShape(shape: TIIShape, matrix: MatrixTransform): TIIShape
  {
    this.logger.debug("applyToShape", { shape })
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        const cosPhi = Math.cos(shape.orientation)
        const sinPhi = Math.sin(shape.orientation)
        const scaleX = matrix.xx
        const scaleY = matrix.yy
        const ox = this.transformOrigin.x
        const oy = this.transformOrigin.y
        shape.center.x = +(shape.center.x + ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (shape.center.x - ox)).toFixed(3)
        shape.center.y = +(shape.center.y + ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (shape.center.y - oy)).toFixed(3)
        shape.radiusX = +(Math.abs(shape.radiusX * (scaleX * cosPhi - scaleY * sinPhi))).toFixed(3)
        shape.radiusY = +(Math.abs(shape.radiusY * (scaleX * sinPhi + scaleY * cosPhi))).toFixed(3)
        return shape
      }
      case ShapeKind.Circle: {
        shape.radius = +(shape.radius * (matrix.xx + matrix.yy) / 2).toFixed(3)
        shape.center = matrix.applyToPoint(shape.center)
        return shape
      }
      case ShapeKind.Polygon: {
        this.applyMatrixToPoints(shape.points, matrix)
        return shape
      }
      default:
        throw new Error(`Can't apply resize on shape, kind unknown: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TIIEdge, matrix: MatrixTransform): TIIEdge
  {
    this.logger.debug("applyToEdge", { edge })
    switch (edge.kind) {
      case EdgeKind.Arc: {
        const cosPhi = Math.cos(edge.phi)
        const sinPhi = Math.sin(edge.phi)
        const scaleX = matrix.xx
        const scaleY = matrix.yy
        const ox = this.transformOrigin.x
        const oy = this.transformOrigin.y
        edge.center.x = +(edge.center.x + ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (edge.center.x - ox)).toFixed(3)
        edge.center.y = +(edge.center.y + ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (edge.center.y - oy)).toFixed(3)
        edge.radiusX = +(edge.radiusX * Math.abs(scaleX * cosPhi + scaleY * sinPhi)).toFixed(3)
        edge.radiusY = +(edge.radiusY * Math.abs(scaleX * sinPhi + scaleY * cosPhi)).toFixed(3)
        if (scaleX < 0) {
          edge.startAngle = +(Math.PI - edge.startAngle).toFixed(3)
          edge.sweepAngle *= -1
        }
        else if (scaleY < 0) {
          edge.sweepAngle *= -1
        }
        return edge
      }
      case EdgeKind.Line: {
        this.applyMatrixToPoints([edge.start, edge.end], matrix)
        return edge
      }
      case EdgeKind.PolyEdge: {
        this.applyMatrixToPoints(edge.points, matrix)
        return edge
      }
      default:
        throw new Error(`Can't apply resize on edge, kind unknown: ${ JSON.stringify(edge) }`)
    }
  }

  protected applyOnText(text: IIText, matrix: MatrixTransform): IIText
  {
    const np = matrix.applyToPoint(text.point)
    text.point.x = +np.x.toFixed(3)
    text.point.y = +np.y.toFixed(3)
    const scale = (matrix.xx + matrix.yy) / 2
    text.chars.forEach(c =>
    {
      c.fontSize = +(c.fontSize * scale).toFixed(3)
    })
    return this.editor.typeset.updateBounds(text)
  }

  protected applyOnMath(math: IIMath, matrix: MatrixTransform): IIMath
  {
    const np = matrix.applyToPoint(math.point)
    math.point.x = +np.x.toFixed(3)
    math.point.y = +np.y.toFixed(3)
    const scale = (matrix.xx + matrix.yy) / 2
    math.elements.forEach(e =>
    {
      e.fontSize = +(e.fontSize * scale).toFixed(3)
    })

    const corners = math.elements.map(e => new Box(e.bounds).corners).flat()
    const scaledCorners = corners.map(p => matrix.applyToPoint(p))
    math.bounds = Box.createFromPoints(scaledCorners)

    return math
  }

  scaleElement(id: string, sx: number, sy: number): void
  {
    this.logger.info("scaleElement", { id, sx, sy })
    this.editor.renderer.setAttribute(id, "transform", `scale(${ sx },${ sy })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.logger.info("start", { target })
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    this.keepRatio = this.model.symbolsSelected.some(s =>
      isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))
    )

    this.transformOrigin = origin
    this.boundingBox = Box.createFromPoints(this.model.symbolsSelected.flatMap(s => s.vertices))
    this.setTransformOrigin(this.interactElementsGroup!.id, this.transformOrigin.x, this.transformOrigin.y)
    this.model.symbolsSelected.forEach(s =>
    {
      this.setTransformOrigin(s.id, this.transformOrigin.x, this.transformOrigin.y)
    })
    this.clearGhostStrokesForSelectedMath()
  }

  continue(point: TPoint): { scaleX: number, scaleY: number }
  {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't resize, you must call start before")
    }
    const localPoint = point
    const horizontalResize = [
      ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast,
      ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest
    ].includes(this.direction)
    const verticalResize = [
      ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest,
      ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest
    ].includes(this.direction)
    const { x, y } = this.editor.snaps.snapResize(point, horizontalResize, verticalResize)
    localPoint.x = x
    localPoint.y = y

    let deltaX = 0, deltaY = 0
    if (isEasternResize(this.direction)) {
      deltaX = localPoint.x - this.boundingBox.xMax
    }
    else if (isWesternResize(this.direction)) {
      deltaX = this.boundingBox.xMin - localPoint.x
    }
    if (isNorthernResize(this.direction)) {
      deltaY = this.boundingBox.yMin - localPoint.y
    }
    else if (isSouthernResize(this.direction)) {
      deltaY = localPoint.y - this.boundingBox.yMax
    }

    let scaleX = this.boundingBox.width ? 1 + (deltaX / this.boundingBox.width) : 1
    let scaleY = this.boundingBox.height ? 1 + (deltaY / this.boundingBox.height) : 1

    if (this.keepRatio) {
      if ([ResizeDirection.North, ResizeDirection.South].includes(this.direction)) {
        scaleX = scaleY
      }
      else if ([ResizeDirection.East, ResizeDirection.West].includes(this.direction)) {
        scaleY = scaleX
      }
      else {
        scaleX = Math.max(scaleX, scaleY)
        scaleY = scaleX
      }
    }
    this.scaleElement(this.interactElementsGroup.id, scaleX, scaleY)
    this.model.symbolsSelected.forEach(s =>
    {
      this.scaleElement(s.id, scaleX, scaleY)
    })
    return { scaleX, scaleY }
  }

  async end(point: TPoint): Promise<void>
  {
    this.logger.info("end", { point })
    const { scaleX, scaleY } = this.continue(point)
    this.editor.snaps.clearSnapToElementLines()
    const oldSymbols = this.model.symbolsSelected.map(s => s.clone())
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
    this.applyAndDraw(this.model.symbolsSelected, matrix)
    const strokesFromSymbols = this.editor.extractStrokesFromSymbols(this.model.symbolsSelected)
    this.editor.recognizer.transformScale(strokesFromSymbols.map(s => s.id), scaleX, scaleY, this.transformOrigin.x, this.transformOrigin.y)
    this.editor.history.push(this.model, { scale: [{ symbols: oldSymbols, origin: {...this.transformOrigin}, scaleX, scaleY }] })
    this.finalizeTransform()
  }
}
