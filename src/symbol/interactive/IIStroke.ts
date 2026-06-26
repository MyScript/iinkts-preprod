import { PartialDeep } from "@/utils"
import { TStyle } from "@/style"
import { TLegacyStroke } from "@/symbol/base/Stroke"
import { TPoint, TPointer, TSegment } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { SymbolType, TBaseSymbol } from "@/symbol/base/Symbol"
import { DecoratorKind } from "./IIDecorator"
import { IIStrokeHelper } from "@/symbol/helpers/IIStrokeHelper"

/**
 * @group Symbol
 */
export type TStroke = TBaseSymbol & {
  readonly type: SymbolType.Stroke
  readonly isClosed: false
  style: TStyle
  selected: boolean
  deleting: boolean
  pointerType: string
  length: number
  pointers: TPointer[]
  bounds: TBox
  snapPoints: TPoint[]
  vertices: TPointer[]
  edges: TSegment[]

  // JIIX Block metadata
  jiixBlockId?: string
  jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator"

  // Computation metadata
  isSolverOutput?: boolean

  // Decorator metadata
  decoratorKind?: DecoratorKind
}

/**
 * @group Symbol
 * @group Utilities
 */
export function convertPartialStrokesToIIStrokes(json: PartialDeep<TLegacyStroke>[]): TStroke[]
{
  const errors: string[] = []
  const strokes: TStroke[] = []
  json.forEach((j, i) =>
  {
    try {
      strokes.push(IIStrokeHelper.createFromPartial(j as PartialDeep<TStroke>))
    } catch (e) {
      errors.push(`stroke ${ i + 1 } has ${ (e as Error).message }`)
    }
  })

  if (errors.length) {
    throw new Error(errors.join("\n"))
  }

  return strokes
}
