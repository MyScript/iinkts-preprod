import type { TBox } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { TResizePoint } from "@/symbol/Symbol"

import type { TSymbolGeometry } from "./TSymbolGeometry"

/**
 * Everything a family util needs to know about one kind within its family.
 *
 * A family util (`ShapeUtil`, `EdgeUtil`) owns a type; the kinds inside it used to be resolved by a
 * `switch` per method, which let a new kind be added to `create` and forgotten in `overlaps`. One
 * table of these instead makes a kind a single entry, and a missing method a compile error.
 *
 * Deliberately not exported through `src/symbol-utils/index.ts`: this is how the built-in families
 * are written, not yet a contract integrators may implement against.
 */
export type TKindDefinition<T> = {
  create(partial: TPartialDeep<T>): T
  computeGeometry(symbol: T): TSymbolGeometry
  overlaps(symbol: T, box: TBox): boolean
  getSVGPath(symbol: T): string
  /**
   * Extra attributes for the rendered path. Only a kind that needs them supplies this — it is what
   * replaces an `if (symbol.kind === …)` sitting inside a family's shared `getSVGElement`.
   */
  extraPathAttributes?(symbol: T): Record<string, string>
  /**
   * Handles for vertex-level resizing. Optional in the same way: edge kinds offer them, shape kinds
   * do not, and a family util reports an empty list for a kind that leaves this out.
   */
  getResizePoints?(symbol: T): TResizePoint[]
  /**
   * Whether this kind must be resized with its ratio locked. A property of the kind rather than of
   * an instance, so it is a flag: only the circle sets it, because one radius cannot describe two
   * different scales.
   */
  keepsAspectRatio?: boolean
}

/**
 * Narrows a definition written against one concrete kind to the union its table is keyed on.
 *
 * The switches these tables replaced carried a cast per branch per method — twelve in `ShapeUtil`,
 * twelve in `EdgeUtil`. Writing each entry against its own type collapses all of them into the one
 * cast below, which is the only place a kind's type is asserted rather than checked.
 */
export function defineKind<TFamily, TKind extends TFamily>(
  definition: TKindDefinition<TKind>
): TKindDefinition<TFamily> {
  return definition as TKindDefinition<TFamily>
}

export function resolveKind<T>(
  table: Partial<Record<string, TKindDefinition<T>>>,
  kind: string | undefined,
  family: string,
  operation: string
): TKindDefinition<T> {
  const definition = kind === undefined ? undefined : table[kind]
  if (!definition) {
    throw new Error(`Unable to ${operation} ${family}, kind: "${kind}" is unknown`)
  }
  return definition
}
