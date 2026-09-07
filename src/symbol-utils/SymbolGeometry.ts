import type { TMatrixTransform, TOBB, TPoint, TSegment } from "@/core/geometry"
import { applyMatrixToPoint, isIdentityMatrix, MatrixTransform, OBBOps } from "@/core/geometry"
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

/**
 * The pre-matrix geometry, cached separately from the transformed result `cache` above holds.
 *
 * A moved symbol's raw geometry does not depend on its matrix, so it would be wasteful to recompute
 * it from the util every time something needs the untransformed shape — `DecoratorUtil` is exactly
 * such a caller, reading a decorator's or its host's raw bounds to draw geometry the `transform`
 * attribute alone repositions.
 */
const rawCache = new WeakMap<TBaseSymbol, TSymbolGeometry>()

/**
 * The raw geometry seen through the symbol's matrix.
 *
 * Bounds go through the four corners of the raw box rather than through every point: O(1) per
 * symbol, and exact for any similarity. A non-uniform scale of an already-turned symbol maps the box
 * to a parallelogram, and what comes back is the enclosing OBB — still better than the field this
 * replaces, which zeroed the angle outright (`TypesetUtil.resize`).
 */
function applyMatrix(geometry: TSymbolGeometry, matrix: TMatrixTransform): TSymbolGeometry {
  const corners = OBBOps.toCorners(geometry.bounds).map((c) => applyMatrixToPoint(c, matrix))
  return {
    // Both terms are radians: `geometry.bounds.angle` (per TOBB's own convention, which every
    // OBBOps function including `fromCorners` honours) and `MatrixTransform.rotation` (built from
    // `acos`, never converted). Do not wrap either side in convertRadianToDegree/convertDegreeToRadian
    // — that mixed a radians field with a degrees term and corrupted width/height along with the
    // angle, for every symbol type, under any rotation. Caught in review: IIC task-9.
    bounds: OBBOps.fromCorners(corners, geometry.bounds.angle + MatrixTransform.rotation(matrix)),
    vertices: geometry.vertices.map((v) => applyMatrixToPoint(v, matrix)),
    snapPoints: geometry.snapPoints.map((p) => applyMatrixToPoint(p, matrix)),
    edges: geometry.edges.map((e) => ({
      p1: applyMatrixToPoint(e.p1, matrix),
      p2: applyMatrixToPoint(e.p2, matrix),
    })),
    length: geometry.length * Math.hypot(matrix.xx, matrix.yx),
  }
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

/**
 * A symbol's geometry straight from its util, before its matrix is applied — cached the same way
 * `of` below caches the transformed result, so a frozen symbol's `computeGeometry` still runs at
 * most once no matter how many times the raw and the transformed geometry are each read.
 */
function rawOf(symbol: TBaseSymbol): TSymbolGeometry {
  const raw = () => symbolRegistry.getUtilFor(symbol).computeGeometry(symbol)
  if (!Object.isFrozen(symbol)) {
    return raw()
  }
  const cached = rawCache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = deepFreeze(raw())
  rawCache.set(symbol, geometry)
  return geometry
}

/**
 * A symbol's geometry, raw or seen through its matrix.
 *
 * The matrix is applied here, inside `compute`, and not around `of` below: `of` is what puts the
 * result in the cache, so branching here is what makes the *transformed* geometry the cached value,
 * not the raw one. Caching the raw form and transforming on every read would put `applyMatrix` back
 * on the hot path the cache exists to avoid — two symbols never share a cache entry regardless, so
 * there is nothing to gain by sharing the untransformed computation between them.
 */
function compute(symbol: TBaseSymbol): TSymbolGeometry {
  const raw = rawOf(symbol)
  return isIdentityMatrix(symbol.transform) ? raw : applyMatrix(raw, symbol.transform)
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
  rawOf,

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
