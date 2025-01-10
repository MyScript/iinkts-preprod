import { createUUID, mergeDeep, PartialDeep } from "../utils"
import { DefaultStyle, TStyle } from "../style"

/**
 * @group Symbol
 */
export enum DecoratorKind
{
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * @group Symbol
 */
export class OIDecorator
{
  id: string
  kind: DecoratorKind
  style: TStyle

  constructor(kind: DecoratorKind, style: PartialDeep<TStyle>)
  {
    this.id = `${ kind }-${ createUUID() }`
    this.style = structuredClone(mergeDeep({}, DefaultStyle ,style))
    this.kind = kind
  }

  clone(): OIDecorator
  {
    const clone = new OIDecorator(this.kind, structuredClone(this.style))
    clone.id = this.id
    return clone
  }

}
