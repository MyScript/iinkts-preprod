import { PartialDeep } from "@/utils"
import { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { IIDecorator } from "./IIDecorator"
import { IITypeset, TIITypesetChild } from "./IITypeset"

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
export type TIIMathElement = TIITypesetChild & {
  fontFamily: string
  position?: "superscript" | "subscript" | "normal"
}

/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
export class IIMath extends IITypeset<SymbolType.Math, TIIMathElement>
{
  elements: TIIMathElement[]

  constructor(
    elements: TIIMathElement[],
    point: TPoint,
    bounds: TBox,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Math, point, bounds, style)
    this.elements = elements
  }

  get children(): TIIMathElement[]
  {
    return this.elements
  }

  override updateChildrenFont({ fontSize, fontWeight, fontFamily }: { fontSize?: number, fontWeight?: "normal" | "bold", fontFamily?: string }): void
  {
    super.updateChildrenFont({ fontSize, fontWeight })
    if (fontFamily) {
      this.elements.forEach(e => e.fontFamily = fontFamily)
    }
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
    if (!partial.elements?.length) throw new Error(`IIMath requires elements`)
    if (!partial.point) throw new Error(`IIMath requires point`)
    if (!partial.bounds) throw new Error(`IIMath requires bounds`)

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

    if (partial.id) math.id = partial.id
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
