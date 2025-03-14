import { TStyle } from "../style"
import { PartialDeep, convertDegreeToRadian, findIntersectionBetween2Segment, isPointInsidePolygon, computeRotatedPoint } from "../utils"
import { TPoint, isValidPoint } from "./Point"
import { SymbolType } from "./Symbol"
import { Box, TBox } from "./Box"
import { IIDecorator } from "./IIDecorator"
import { IISymbolBase } from "./IISymbolBase"

/**
 * @group Symbol
 */
export type TIISymbolChar = {
  id: string
  label: string
  fontSize: number
  fontWeight: "normal" | "bold"
  color: string
  bounds: TBox
}

/**
 * @group Symbol
 */
export class IIText extends IISymbolBase<SymbolType.Text>
{
  readonly isClosed = true

  point: TPoint
  chars: TIISymbolChar[]
  decorators: IIDecorator[]
  bounds: Box
  rotation?: {
    degree: number,
    center: TPoint
  }

  constructor(
    chars: TIISymbolChar[],
    point: TPoint,
    bounds: TBox,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Text, style)
    this.point = point
    this.bounds = new Box(bounds)
    this.chars = chars
    this.decorators = []
  }

  get label(): string
  {
    return this.chars.map(c => c.label).join("")
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

  protected getCharCorners(char: TIISymbolChar): TPoint[]
  {
    const boxBox = new Box(char.bounds)
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
    this.chars.forEach(c => {
      if (this.style.color) {
        c.color = this.style.color
      }
    })
    this.modificationDate = Date.now()
  }

  updateChildrenFont( { fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" }): void
  {
    this.chars.forEach(c => {
      if (fontSize) {
        c.fontSize = fontSize
      }
      if (fontWeight) {
        c.fontWeight = fontWeight
      }
    })
    this.modificationDate = Date.now()
  }

  getCharsOverlaps(points: TPoint[]): TIISymbolChar[]
  {
    return this.chars.filter(c =>
    {
      const charCorners = this.getCharCorners(c)
      return points.some(p => isPointInsidePolygon(p, charCorners))
    })
  }

  overlaps(box: TBox): boolean
  {
    return this.vertices.some(p => Box.containsPoint(box, p)) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  clone(): IIText
  {
    const clone = new IIText(structuredClone(this.chars), structuredClone(this.point), this.bounds, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    clone.rotation = this.rotation ? structuredClone(this.rotation) : undefined
    return clone
  }

  toJSON(): PartialDeep<IIText>
  {
    return {
      id: this.id,
      type: this.type,
      point: this.point,
      chars: this.chars,
      style: this.style,
      rotation: this.rotation,
      bounds: this.bounds,
      decorators: this.decorators.length ? this.decorators : undefined
    }
  }

  static create(partial: PartialDeep<IIText>): IIText
  {
    if (!isValidPoint(partial?.point)) throw new Error(`Unable to create a IIText, point are invalid`)
    if (!partial.chars?.length) throw new Error(`Unable to create a IIText, no chars`)
    if (!partial.bounds) throw new Error(`Unable to create a IIText, no boundingBox`)
    const text = new IIText(partial.chars as TIISymbolChar[], partial.point as TPoint, partial.bounds as TBox, partial.style)
    if (partial.id) text.id = partial.id
    if (partial.decorators?.length) {
      partial.decorators.forEach(d => {
        if(d?.kind) {
          text.decorators.push(new IIDecorator(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    return text
  }
}
