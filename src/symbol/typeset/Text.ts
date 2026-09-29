import type { TPoint } from "@/core/geometry"
import { type TOBB } from "@/core/geometry"
import type { TStyle } from "@/style"
import type { TDecorator } from "@/symbol/decorator/Decorator"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TTypesetChild } from "@/symbol/typeset/Typeset"
/**
 * @group Symbol
 */
export type TSymbolChar = TTypesetChild

/**
 * @group Symbol
 */
export type TText = TBaseSymbol & {
  type: SymbolType.Text
  style: TStyle
  point: TPoint
  chars: TSymbolChar[]
  decorators: TDecorator[]
  bounds: TOBB
}

/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
export function isText(symbol: TBaseSymbol): symbol is TText {
  return symbol.type === SymbolType.Text
}

/**
 * @group Symbol
 */
