import { TStyle } from "@/style"
import { PartialDeep } from "@/utils"
import { IIRecognizedBase, RecognizedKind } from "./IIRecognizedBase"
import { IIStroke } from "@/symbol/interactive/IIStroke"
import { TJIIXMathExpression } from "@/model"

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

  /** Stored variable values set by user */
  variableValues?: { [name: string]: number }

  /** IDs of solver output strokes added by numerical computation */
  solverOutputStrokeIds?: string[]

  /** Computed numerical result from solver */
  computedResult?: number

  /** Map of variable sources: variableName -> source blockId */
  variableSources?: { [variableName: string]: string }

  /** List of blockIds that depend on this block's variables */
  dependentBlocks?: string[]

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
    clone.variableValues = this.variableValues ? structuredClone(this.variableValues) : undefined
    clone.solverOutputStrokeIds = this.solverOutputStrokeIds ? structuredClone(this.solverOutputStrokeIds) : undefined
    clone.computedResult = this.computedResult
    clone.variableSources = this.variableSources ? structuredClone(this.variableSources) : undefined
    clone.dependentBlocks = this.dependentBlocks ? structuredClone(this.dependentBlocks) : undefined
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
      variableValues: this.variableValues,
      solverOutputStrokeIds: this.solverOutputStrokeIds,
      computedResult: this.computedResult,
      variableSources: this.variableSources,
      dependentBlocks: this.dependentBlocks,
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
    if (partial.variableValues) {
      math.variableValues = partial.variableValues as { [name: string]: number }
    }
    if (partial.solverOutputStrokeIds) {
      math.solverOutputStrokeIds = partial.solverOutputStrokeIds as string[]
    }
    if (partial.computedResult !== undefined) {
      math.computedResult = partial.computedResult as number
    }
    if (partial.variableSources) {
      math.variableSources = partial.variableSources as { [variableName: string]: string }
    }
    if (partial.dependentBlocks) {
      math.dependentBlocks = partial.dependentBlocks as string[]
    }
    return math
  }
}
