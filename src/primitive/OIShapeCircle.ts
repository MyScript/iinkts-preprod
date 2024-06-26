import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep, computeDistance, findIntersectBetweenSegmentAndCircle, isValidNumber, computeRotatedPoint } from "../utils"
import { TPoint, isValidPoint } from "./Point"
import { OIShape, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"

/**
 * @group Primitive
 */
export class OIShapeCircle extends OIShape
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  center: TPoint
  radius: number
  protected _vertices: Map<string, TPoint[]>

  constructor(style: TStyle, center: TPoint, radius: number)
  {
    super(ShapeKind.Circle, style)
    this.#logger.debug("constructor", { style, center, radius })
    this.center = center
    this.radius = radius
    this._vertices = new Map<string, TPoint[]>()
    this._vertices.set(this.verticesId, this.computedVertices())
  }

  protected get verticesId(): string
  {
    return `${ this.center.x }-${ this.center.y }-${ this.radius }`
  }

  protected computedVertices(): TPoint[]
  {
    const firstPoint: TPoint = {
      x: this.center.x,
      y: this.radius + this.center.y
    }
    const perimeter = 2 * Math.PI * this.radius
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const points: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const rad = 2 * Math.PI * (i / nbPoint)
      points.push(computeRotatedPoint(firstPoint, this.center, rad))
    }
    return points
  }

  get vertices(): TPoint[]
  {
    if (!this._vertices.has(this.verticesId)) {
      this._vertices.set(this.verticesId, this.computedVertices())
    }
    return this._vertices.get(this.verticesId)!
  }

  override get boundingBox(): Box
  {
    const boundingBox: TBoundingBox = {
      x: this.center.x - this.radius,
      y: this.center.y - this.radius,
      height: this.radius * 2,
      width: this.radius * 2
    }
    return new Box(boundingBox)
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return Math.abs(computeDistance(point, this.center) - this.radius) < SELECTION_MARGIN
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.boundingBox.isContained(box) ||
      Box.getSides(box).some(seg => findIntersectBetweenSegmentAndCircle(seg, this.center, this.radius).length)
  }

  clone(): OIShapeCircle
  {
    const clone = new OIShapeCircle(structuredClone(this.style), structuredClone(this.center), this.radius)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIShapeCircle>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      center: this.center,
      radius: this.radius,
      style: this.style,
    }
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeCircle
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }

    const width = Math.abs(origin.x - target.x)
    const height = Math.abs(origin.y - target.y)
    const radius = Math.min(width, height) / 2
    return new OIShapeCircle(style, center, radius)
  }

  static updateFromLine(circle: OIShapeCircle, origin: TPoint, target: TPoint): OIShapeCircle
  {
    circle.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    const width = Math.abs(origin.x - target.x)
    const height = Math.abs(origin.y - target.y)
    circle.radius = Math.min(width, height) / 2
    return circle
  }

  static create(partial: PartialDeep<OIShapeCircle>): OIShapeCircle
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create circle, center is invalid`)
    if (!isValidNumber(partial.radius)) throw new Error(`Unable to create circle, radius is undefined`)
    return new OIShapeCircle(partial.style || DefaultStyle, partial.center as TPoint, partial.radius!)
  }
}
