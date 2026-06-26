import { PartialDeep } from "@/utils"
import { TPoint, isValidPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { IIDecorator } from "./IIDecorator"
import { IITypeset, TIITypesetChild } from "./IITypeset"

/**
 * @group Symbol
 */
export type TIISymbolChar = TIITypesetChild

/**
 * @group Symbol
 */
export class IIText extends IITypeset<SymbolType.Text, TIISymbolChar>
{
  chars: TIISymbolChar[]

  constructor(
    chars: TIISymbolChar[],
    point: TPoint,
    bounds: TBox,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Text, point, bounds, style)
    this.chars = chars
  }

  get children(): TIISymbolChar[]
  {
    return this.chars
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
        if (d?.kind) {
          text.decorators.push(new IIDecorator(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    return text
  }
}
