import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { IIRecognizedBase, RecognizedKind } from "./IIRecognizedBase"
import { IIStroke } from "../interactive/IIStroke"
import { TJIIXMathExpression } from "../../model"

/**
 * @group Symbol
 * @remarks Represents a recognized mathematical expression block
 */
export class IIRecognizedMath extends IIRecognizedBase<RecognizedKind.Math>
{
  readonly isClosed = false

  /** Label of the math expression (e.g., "3x+2") */
  label?: string

  /** Parent element JIIX ID if this math is embedded in text */
  parent?: string

  /** Parsed JIIX expressions tree */
  expressions?: TJIIXMathExpression[]

  constructor(
    strokes: IIStroke[],
    style?: PartialDeep<TStyle>
  )
  {
    super(RecognizedKind.Math, strokes, style)
  }

  clone(): IIRecognizedMath
  {
    const clone = new IIRecognizedMath(this.strokes.map(s => s.clone()), structuredClone({ ...this.style }))
    clone.id = this.id
    clone.label = this.label
    clone.jiixId = this.jiixId
    clone.parent = this.parent
    clone.expressions = this.expressions ? structuredClone(this.expressions) : undefined
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIRecognizedMath>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      label: this.label,
      jiixId: this.jiixId,
      parent: this.parent,
      expressions: this.expressions,
      strokes: structuredClone(this.strokes)
    }
  }

  static create(partial: PartialDeep<IIRecognizedMath>): IIRecognizedMath
  {
    if (!partial.strokes?.length) {
      throw new Error(`IIRecognizedMath: no strokes provided`)
    }
    const strokes = partial.strokes.map(s => IIStroke.create(s!))
    const math = new IIRecognizedMath(strokes, partial.style)

    if (partial.id) {
      math.id = partial.id
    }
    if (partial.label) {
      math.label = partial.label
    }
    if (partial.jiixId) {
      math.jiixId = partial.jiixId
    }
    if (partial.parent) {
      math.parent = partial.parent
    }
    if (partial.expressions) {
      math.expressions = partial.expressions.filter(e => e !== undefined) as TJIIXMathExpression[]
    }
    return math
  }
}
