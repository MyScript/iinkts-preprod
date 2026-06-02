import { TStyle } from "@/style"
import { PartialDeep, convertDegreeToRadian, findIntersectionBetween2Segment, isPointInsidePolygon, computeRotatedPoint } from "@/utils"
import { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { Box, TBox } from "@/symbol/base/Box"
import { IIDecorator } from "./IIDecorator"
import { IISymbolBase } from "./IISymbolBase"

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
export type TIIMathElement = {
  id: string
  label: string
  fontSize: number
  fontWeight: "normal" | "bold"
  fontFamily: string
  color: string
  bounds: TBox
  position?: "superscript" | "subscript" | "normal"
}

/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
export class IIMath extends IISymbolBase<SymbolType.Math>
{
  readonly isClosed = true

  point: TPoint
  elements: TIIMathElement[]
  decorators: IIDecorator[]
  bounds: Box
  rotation?: {
    degree: number,
    center: TPoint
  }

  constructor(
    elements: TIIMathElement[],
    point: TPoint,
    bounds: TBox,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Math, style)
    this.point = point
    this.bounds = new Box(bounds)
    this.elements = elements
    this.decorators = []
  }

  get label(): string
  {
    return this.elements.map(e => e.label).join("")
  }

  get vertices(): TPoint[]
  {
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return this.bounds.corners
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    else {
      return this.bounds.corners
    }
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
      return points
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return points
  }

  protected getElementCorners(element: TIIMathElement): TPoint[]
  {
    const boxBox = new Box(element.bounds)
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return boxBox.corners
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return boxBox.corners
  }

  updateChildrenStyle(): void
  {
    this.elements.forEach(e => {
      if (this.style.color) {
        e.color = this.style.color
      }
    })
    this.modificationDate = Date.now()
  }

  updateChildrenFont({ fontSize, fontWeight, fontFamily }: { fontSize?: number, fontWeight?: "normal" | "bold", fontFamily?: string }): void
  {
    this.elements.forEach(e => {
      if (fontSize) {
        e.fontSize = fontSize
      }
      if (fontWeight) {
        e.fontWeight = fontWeight
      }
      if (fontFamily) {
        e.fontFamily = fontFamily
      }
    })
    this.modificationDate = Date.now()
  }

  getElementsOverlaps(points: TPoint[]): TIIMathElement[]
  {
    return this.elements.filter(e =>
    {
      const elementCorners = this.getElementCorners(e)
      return points.some(p => isPointInsidePolygon(p, elementCorners))
    })
  }

  overlaps(box: TBox): boolean
  {
    return this.vertices.some(p => Box.containsPoint(box, p)) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  clone(): IIMath
  {
    const clone = new IIMath(structuredClone(this.elements), structuredClone(this.point), this.bounds, structuredClone(this.style))
    clone.id = this.id
    clone.decorators = this.decorators.map(d => d.clone())
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    if (this.rotation) {
      clone.rotation = structuredClone(this.rotation)
    }
    return clone
  }

  toJSON(): PartialDeep<IIMath>
  {
    return {
      id: this.id,
      type: this.type,
      point: this.point,
      elements: this.elements,
      decorators: this.decorators,
      bounds: this.bounds,
      rotation: this.rotation,
      style: this.style
    }
  }

  static create(partial: PartialDeep<IIMath>): IIMath
  {
    if (!partial.elements?.length) {
      throw new Error(`IIMath requires elements`)
    }
    if (!partial.point) {
      throw new Error(`IIMath requires point`)
    }
    if (!partial.bounds) {
      throw new Error(`IIMath requires bounds`)
    }

    const elements: TIIMathElement[] = partial.elements.map(e => ({
      id: e!.id!,
      label: e!.label!,
      fontSize: e!.fontSize!,
      fontWeight: e!.fontWeight! as "normal" | "bold",
      fontFamily: e!.fontFamily!,
      color: e!.color!,
      bounds: {
        x: e!.bounds!.x!,
        y: e!.bounds!.y!,
        width: e!.bounds!.width!,
        height: e!.bounds!.height!
      }
    }))

    const math = new IIMath(elements, partial.point as TPoint, partial.bounds as TBox, partial.style)

    if (partial.id) {
      math.id = partial.id
    }
    if (partial.decorators) {
      math.decorators = partial.decorators
        .filter(d => d?.kind && d?.style)
        .map(d => new IIDecorator(d!.kind!, d!.style!))
    }
    if (partial.rotation) {
      math.rotation = partial.rotation as { degree: number, center: TPoint }
    }
    return math
  }
}
