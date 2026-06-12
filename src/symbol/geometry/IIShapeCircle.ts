import { SELECTION_MARGIN } from "@/Constants"
import { TStyle } from "@/style"
import { PartialDeep, findIntersectBetweenSegmentAndCircle, isValidNumber, computeRotatedPoint, computeDistance, TWO_PI } from "@/utils"
import { TPoint, isValidPoint } from "@/symbol/base/Point"
import { IIShapeBase, ShapeKind } from "./IIShape"
import { Box, TBox } from "@/symbol/base/Box"

/**
 * @group Symbol
 */
export class IIShapeCircle extends IIShapeBase<ShapeKind.Circle>
{
  center: TPoint
  radius: number
  protected _cachedVerticesKey?: string
  protected _cachedVertices?: TPoint[]
  protected _cachedBoundsKey?: string
  protected _cachedBounds?: Box

  constructor(
    center: TPoint,
    radius: number,
    style?: PartialDeep<TStyle>
  )
  {
    super(ShapeKind.Circle, style)
    this.center = center
    this.radius = radius
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
    const perimeter = TWO_PI * this.radius
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const points: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const rad = TWO_PI * (i / nbPoint)
      points.push(computeRotatedPoint(firstPoint, this.center, rad))
    }
    return points
  }

  protected computedBoundingBox(): Box
  {
    const boundingBox: TBox = {
      x: this.center.x - this.radius,
      y: this.center.y - this.radius,
      height: this.radius * 2,
      width: this.radius * 2
    }
    return new Box(boundingBox)
  }

  get bounds(): Box
  {
    const key = this.verticesId
    if (this._cachedBoundsKey !== key) {
      this._cachedBoundsKey = key
      this._cachedBounds = this.computedBoundingBox()
    }
    return this._cachedBounds!
  }

  get vertices(): TPoint[]
  {
    const key = this.verticesId
    if (this._cachedVerticesKey !== key) {
      this._cachedVerticesKey = key
      this._cachedVertices = this.computedVertices()
    }
    return this._cachedVertices!
  }

  overlaps(box: TBox): boolean
  {
    return this.bounds.isContained(box) ||
      Box.getSides(box).some(seg => findIntersectBetweenSegmentAndCircle(seg, this.center, this.radius).length)
  }

  clone(): IIShapeCircle
  {
    const clone = new IIShapeCircle(structuredClone(this.center), this.radius, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIShapeCircle>
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

  static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapeCircle
  {
    const circle = new IIShapeCircle(origin, 0, style)
    circle.radius = computeDistance(circle.center, target)
    return circle
  }

  static updateBetweenPoints(circle: IIShapeCircle, _origin: TPoint, target: TPoint): IIShapeCircle
  {
    circle.radius = computeDistance(circle.center, target)
    return circle
  }

  static create(partial: PartialDeep<IIShapeCircle>): IIShapeCircle
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create circle, center is invalid`)
    if (!isValidNumber(partial.radius)) throw new Error(`Unable to create circle, radius is undefined`)
    const circle = new IIShapeCircle(partial.center as TPoint, partial.radius!, partial.style)
    if (partial.id) {
      circle.id = partial.id
    }
    return circle
  }
}
