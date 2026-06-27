import type { TPartialDeep } from "@/utils"
import { SymbolType, type TSymbol } from "@/symbol/Symbol"
import { StrokeOps, type TStroke } from "@/symbol/stroke/Stroke"
import { TextOps, type TText } from "@/symbol/text/Text"
import { MathOps, type TMath } from "@/symbol/math/Math"
import { ShapeOps, type TShape } from "@/symbol/shape/Shape"
import { EdgeOps, type TEdge } from "@/symbol/edge/Edge"
import { symbolRegistry } from "./SymbolRegistry"

/** @group SymbolUtils */
export function createShapeFromPartial(partial: TPartialDeep<TShape>): TShape
{
  return ShapeOps.createShapeFromPartial(partial)
}

/** @group SymbolUtils */
export function createEdgeFromPartial(partial: TPartialDeep<TEdge>): TEdge
{
  return EdgeOps.createEdgeFromPartial(partial)
}

/**
 * @group SymbolUtils
 * @summary Create any TSymbol from partial data — dispatches by type using the registry for custom types.
 */
export function createSymbolFromPartial(partial: TPartialDeep<TSymbol>): TSymbol
{
  switch (partial.type) {
    case SymbolType.Stroke:
      return StrokeOps.createFromPartial(partial as TPartialDeep<TStroke>)
    case SymbolType.Shape:
      return ShapeOps.createShapeFromPartial(partial as TPartialDeep<TShape>)
    case SymbolType.Edge:
      return EdgeOps.createEdgeFromPartial(partial as TPartialDeep<TEdge>)
    case SymbolType.Text:
      return TextOps.createFromPartial(partial as TPartialDeep<TText>)
    case SymbolType.Math:
      return MathOps.createFromPartial(partial as TPartialDeep<TMath>)
    default: {
      const util = symbolRegistry.getUtil(partial.type as string)
      if (util) return util.create(partial) as TSymbol
      throw new Error(`Unable to create symbol, type: "${ partial.type }" is unknown`)
    }
  }
}

/**
 * @group SymbolUtils
 * @summary Create multiple TSymbols from partial data — accumulates errors.
 */
export function createSymbolsFromPartial(partials: TPartialDeep<TSymbol>[]): TSymbol[]
{
  const errors: string[] = []
  const symbols: TSymbol[] = []
  partials.forEach((partial, index) =>
  {
    try {
      symbols.push(createSymbolFromPartial(partial))
    } catch (error) {
      errors.push(`Symbol ${ index }: ${ (error as Error).message || error }`)
    }
  })
  if (errors.length) {
    throw new Error(`Failed to create ${ errors.length } symbol(s):\n${ errors.join("\n") }`)
  }
  return symbols
}
