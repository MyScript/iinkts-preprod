import type { TOBB, TPoint, TSegment } from "@/core/geometry"
import type { TBaseSymbol } from "@/symbol/Symbol"

import { symbolRegistry } from "./SymbolRegistry"
import type { TSymbolGeometry } from "./TSymbolGeometry"

/**
 * Derived geometry, keyed on the symbol object itself.
 *
 * No invalidation, and none is needed: `SymbolStore` deep-freezes what it commits and hands back a
 * `structuredClone` from `draft()`, so a symbol whose geometry changed is a different object and
 * cannot collide with its own stale entry. An unfrozen object is a draft mid-edit — computed every
 * time, never stored, which is the one case where identity would lie.
 */
const cache = new WeakMap<TBaseSymbol, TSymbolGeometry>()

function compute(symbol: TBaseSymbol): TSymbolGeometry {
  return symbolRegistry.getUtilFor(symbol).computeGeometry(symbol)
}

/**
 * Freezes `value` and everything reachable from it, skipping whatever is already frozen.
 *
 * A util's `computeGeometry` result is only as immutable as whichever util built it: some hand back
 * a store-frozen symbol's own nested data as-is, others build fresh, unfrozen arrays. Without this,
 * a single stray write on one of the latter — `SymbolGeometry.boundsOf(s).width = 999` — would
 * poison every later read of `s`, for good, since the cache never recomputes for a frozen symbol.
 * The `isFrozen` early-out keeps this from doing redundant work on data a store-committed symbol
 * already froze.
 */
function deepFreeze<TValue>(value: TValue): TValue {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value
  }
  Object.freeze(value)
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

function of(symbol: TBaseSymbol): TSymbolGeometry {
  if (!Object.isFrozen(symbol)) {
    return compute(symbol)
  }
  const cached = cache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = deepFreeze(compute(symbol))
  cache.set(symbol, geometry)
  return geometry
}

/**
 * @group SymbolUtils
 * @summary Reads a symbol's derived geometry — bounds, vertices, snap points, edges, length.
 *
 * These used to be fields on every symbol type, written by `updateDerivedFields` after each change.
 * Storing them meant every mutation path had to remember to refresh them, and a forgotten call left
 * a symbol that looked right and hit-tested wrong.
 *
 * Every accessor below calls the module-level {@link of} directly rather than `this.of` — so
 * `const { boundsOf } = SymbolGeometry` and `symbols.map(SymbolGeometry.boundsOf)` both work. A
 * `this`-bound accessor throws the moment it is detached from the object, which is exactly the
 * shape a read-site migration across the codebase produces.
 */
export const SymbolGeometry = {
  of,

  boundsOf(symbol: TBaseSymbol): TOBB {
    return of(symbol).bounds
  },

  verticesOf(symbol: TBaseSymbol): TPoint[] {
    return of(symbol).vertices
  },

  snapPointsOf(symbol: TBaseSymbol): TPoint[] {
    return of(symbol).snapPoints
  },

  edgesOf(symbol: TBaseSymbol): TSegment[] {
    return of(symbol).edges
  },

  lengthOf(symbol: TBaseSymbol): number {
    return of(symbol).length
  },
}
