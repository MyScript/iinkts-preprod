import type { TSymbol } from "./Symbol"

/**
 * @group Symbol
 * @summary Clone any TSymbol — all types are now plain objects, use structuredClone.
 */
export function cloneSymbol(symbol: TSymbol): TSymbol
{
  return structuredClone(symbol)
}
