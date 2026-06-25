import { PartialDeep } from "@/utils"
import { TPoint, TPointer } from "@/symbol/base/Point"
import { Box, TBox } from "@/symbol/base/Box"
import { SymbolType } from "@/symbol/base/Symbol"
import { IISymbolBase } from "./IISymbolBase"

/**
 * @group Symbol
 */
export class IIEraser extends IISymbolBase<SymbolType.Eraser>
{
  readonly isClosed = false
  pointers: TPointer[]

  constructor(width = 5)
  {
    super(SymbolType.Eraser, {
      color: "grey",
      fill: "none",
      opacity: 0.2,
      width
    })
    this.pointers = []
  }

  get bounds(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  get vertices(): TPoint[]
  {
    return this.pointers
  }

  get snapPoints(): TPoint[]
  {
    return []
  }

  clone(): IISymbolBase
  {
    const clone = new IIEraser(this.style.width)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.pointers = structuredClone(this.pointers)
    return clone
  }

  overlaps(box: TBox): boolean
  {
    return this.pointers.some(p =>
    {
      return p.x >= box.x && p.x <= box.x + box.width
        && p.y >= box.y && p.y <= box.y + box.height
    })
  }

  toJSON(): PartialDeep<IIEraser>
  {
    return {
      id: this.id,
      pointers: this.pointers,
      style: this.style
    }
  }
}
