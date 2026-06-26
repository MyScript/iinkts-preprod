import type { TPartialDeep } from "@/utils"
import type { TStyle } from "@/style"
import type { TLegacyStroke } from "@/symbol/base/Stroke"
import type { TPoint, TPointer, TSegment } from "@/symbol/base/Point"
import type { TBox } from "@/symbol/base/Box"
import type { SymbolType, TBaseSymbol } from "@/symbol/base/Symbol"
import type { DecoratorKind } from "./IIDecorator"
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
export function convertPartialStrokesToIIStrokes(json: TPartialDeep<TLegacyStroke>[]): TStroke[]
{
  const errors: string[] = []
  const strokes: TStroke[] = []
  json.forEach((j, i) =>
  {
    try {
      strokes.push(IIStrokeHelper.createFromPartial(j as TPartialDeep<TStroke>))
    } catch (e) {
      errors.push(`stroke ${ i + 1 } has ${ (e as Error).message }`)
    }
  })

  if (errors.length) {
    throw new Error(errors.join("\n"))
  }

  return strokes
}
