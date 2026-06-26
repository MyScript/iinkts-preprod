import { TStyle } from "@/style"
import { PartialDeep, convertDegreeToRadian, findIntersectionBetween2Segment, isPointInsidePolygon, computeRotatedPoint } from "@/utils"
import { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { Box, TBox } from "@/symbol/base/Box"
import { IIDecorator } from "./IIDecorator"
import { IISymbolBase } from "./IISymbolBase"

/**
 * @group Symbol
 */
export type TIITypesetChild = {
  id: string
  label: string
  color: string
  bounds: TBox
  fontSize: number
  fontWeight: "normal" | "bold"
}

/**
 * @group Symbol
 */
export abstract class IITypeset<ST extends SymbolType, TChild extends TIITypesetChild>
  extends IISymbolBase<ST>
{
  readonly isClosed = true

  point: TPoint
  decorators: IIDecorator[]
  bounds: Box
  rotation?: {
    degree: number,
    center: TPoint
  }

  abstract get children(): TChild[]

  constructor(type: ST, point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>)
  {
    super(type, style)
    this.point = point
    this.bounds = new Box(bounds)
    this.decorators = []
  }

  get label(): string
  {
    return this.children.map(c => c.label).join("")
  }

  get vertices(): TPoint[]
  {
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return this.bounds.corners.map(p => computeRotatedPoint(p, center, rad))
    }
    return this.bounds.corners
  }

  get snapPoints(): TPoint[]
  {
    const offsetY = this.bounds.yMax - this.point.y
    const points = [
      { x: this.bounds.x, y: this.bounds.yMin + offsetY },
      { x: this.bounds.xMax, y: this.bounds.yMin + offsetY },
      { x: this.bounds.xMax, y: this.bounds.yMax - offsetY },
      { x: this.bounds.x, y: this.bounds.yMax - offsetY },
      this.bounds.center
    ]
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return points.map(p => computeRotatedPoint(p, center, rad))
    }
    return points
  }

  overlaps(box: TBox): boolean
  {
    return this.vertices.some(p => Box.containsPoint(box, p)) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  protected getChildCorners(child: TChild): TPoint[]
  {
    const box = new Box(child.bounds)
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return box.corners.map(p => computeRotatedPoint(p, center, rad))
    }
    return box.corners
  }

  getChildrenOverlaps(points: TPoint[]): TChild[]
  {
    return this.children.filter(c =>
    {
      const corners = this.getChildCorners(c)
      return points.some(p => isPointInsidePolygon(p, corners))
    })
  }

  updateChildrenStyle(): void
  {
    this.children.forEach(c =>
    {
      if (this.style.color) {
        c.color = this.style.color
      }
    })
    this.modificationDate = Date.now()
  }

  updateChildrenFont({ fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" }): void
  {
    this.children.forEach(c =>
    {
      if (fontSize) {
        c.fontSize = fontSize
      }
      if (fontWeight) {
        c.fontWeight = fontWeight
      }
    })
    this.modificationDate = Date.now()
  }
}
