import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { EdgeDecoration, EdgeKind, OIEdgeBase } from "./IIEdge"
import { TPoint, isValidPoint } from "../Point"

/**
 * @group Symbol
 */
export class IIEdgeLine extends OIEdgeBase<EdgeKind.Line>
{
  start: TPoint
  end: TPoint

  constructor(
    start: TPoint,
    end: TPoint,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: PartialDeep<TStyle>
  )
  {
    super(EdgeKind.Line, startDecoration, endDecoration, style)
    this.start = start
    this.end = end
  }

  get vertices(): TPoint[]
  {
    return [
      this.start,
      this.end
    ]
  }

  clone(): IIEdgeLine
  {
    const clone = new IIEdgeLine(structuredClone(this.start), structuredClone(this.end), this.startDecoration, this.endDecoration, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIEdgeLine>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      start: this.start,
      end: this.end,
      style: this.style,
      startDecoration: this.startDecoration,
      endDecoration: this.endDecoration,
    }
  }

  static create(partial: PartialDeep<IIEdgeLine>): IIEdgeLine
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a arc, start point is invalid`)
    if (!isValidPoint(partial?.end)) throw new Error(`Unable to create a arc, end point is invalid`)
    const line = new IIEdgeLine(partial?.start as TPoint, partial?.end as TPoint, partial.startDecoration, partial.endDecoration, partial.style)
    if (partial.id) {
      line.id = partial.id
    }
    return line
  }
}
