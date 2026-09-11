import type { TMatrixTransform, TOBB, TPoint, TSegment } from "@/core/geometry"
import { applyMatrixToPoint, Geometry2d, isIdentityMatrix, MatrixTransform, OBBOps } from "@/core/geometry"
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
const cache = new WeakMap<TBaseSymbol, Geometry2d>()

/**
 * The pre-matrix geometry, cached separately from the transformed result `cache` above holds.
 *
 * A moved symbol's raw geometry does not depend on its matrix, so it would be wasteful to recompute
 * it from the util every time something needs the untransformed shape — `DecoratorUtil` is exactly
 * such a caller, reading a decorator's or its host's raw bounds to draw geometry the `transform`
 * attribute alone repositions.
 */
const rawCache = new WeakMap<TBaseSymbol, Geometry2d>()

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
 * A {@link Geometry2d} wrapping the record a util that has not been converted yet hands back.
 *
 * Transitional, and deliberately dumb: every derived value is the one the util already computed, and
 * `transform` is the same `applyMatrix` the facade used before, so a type still on `computeGeometry`
 * behaves to the last decimal as it did. It goes when the last util implements `getGeometry`.
 *
 * `isClosed`/`isFilled` are false because a record never said: nothing reads them on this path —
 * overlap still goes through the util's own `overlaps`, not through the geometry — and guessing
 * "filled" here would change hit-testing for every unconverted type at once.
 */
class RecordGeometry2d extends Geometry2d {
  readonly #record: TSymbolGeometry

  constructor(record: TSymbolGeometry) {
    // The record's box already carries whatever angle it was built with; keeping it means this
    // reports the same frame as the record it stands in for.
    super({ isClosed: false, isFilled: false, frameAngle: record.bounds.angle })
    this.#record = record
  }

  /** The record's own snap points, which a `Geometry2d` does not carry — see {@link snapPointsOf}. */
  get snapPoints(): TPoint[] {
    return this.#record.snapPoints
  }

  protected computeVertices(): TPoint[] {
    return this.#record.vertices
  }

  override get bounds(): TOBB {
    return this.#record.bounds
  }

  override get edges(): TSegment[] {
    return this.#record.edges
  }

  override get length(): number {
    return this.#record.length
  }

  override transform(matrix: TMatrixTransform): RecordGeometry2d {
    return new RecordGeometry2d(applyMatrix(this.#record, matrix))
  }
}

/**
 * The shape a util describes, however it describes it.
 *
 * A util that implements `getGeometry` is asked for it; one that still only has `computeGeometry`
 * has its record wrapped. Both come back as a `Geometry2d`, so nothing downstream has to know which
 * kind of util it is talking to — which is what lets the types move over one at a time.
 */
function fromUtil(symbol: TBaseSymbol): Geometry2d {
  const util = symbolRegistry.getUtilFor(symbol)
  return util.getGeometry ? util.getGeometry(symbol) : new RecordGeometry2d(util.computeGeometry(symbol))
}

/**
 * Freezes a geometry and the values it derives.
 *
 * `deepFreeze` alone is not enough for an object: `vertices`, `bounds` and `edges` are getters on the
 * prototype and hold their results in private fields, neither of which `Object.getOwnPropertyNames`
 * reaches. Freezing the instance would therefore protect nothing at all — so each derived value is
 * read out and frozen on its own, which also settles the lazy fields while the symbol is known to be
 * frozen. That is no more eager than the record this replaces, which was fully built by
 * `computeGeometry` before it ever reached the cache.
 *
 * Only ever called for a frozen symbol, and that restriction is load-bearing rather than an
 * optimisation: a converted util hands back the symbol's own arrays — `PointSet2d`'s vertices *are*
 * `stroke.pointers` — so freezing a draft's geometry would freeze the draft, and the next
 * `addPointer` would throw.
 */
function freezeGeometry(geometry: Geometry2d): Geometry2d {
  deepFreeze(geometry.bounds)
  deepFreeze(geometry.vertices)
  deepFreeze(geometry.edges)
  // Frozen, then the original reference returned: `Object.freeze`'s return type is `Readonly<T>`,
  // which drops the protected members and so no longer satisfies `Geometry2d`.
  Object.freeze(geometry)
  return geometry
}

/**
 * A symbol's geometry straight from its util, before its matrix is applied — cached the same way
 * `of` below caches the transformed result, so a frozen symbol's geometry is still built at most
 * once no matter how many times the raw and the transformed geometry are each read.
 */
function rawOf(symbol: TBaseSymbol): Geometry2d {
  if (!Object.isFrozen(symbol)) {
    return fromUtil(symbol)
  }
  const cached = rawCache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = freezeGeometry(fromUtil(symbol))
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
function compute(symbol: TBaseSymbol): Geometry2d {
  const raw = rawOf(symbol)
  // A symbol can reach here without a matrix: `mergeSymbolTransform` backfills one on the wire, but
  // a raw or malformed object — a kind no table owns, tolerated rather than thrown on — never went
  // through it. Treated as identity, which is what every untransformed symbol means anyway; reading
  // `undefined` here would throw where the code this replaced returned an answer.
  const transform = symbol.transform
  return !transform || isIdentityMatrix(transform) ? raw : raw.transform(transform)
}

function of(symbol: TBaseSymbol): Geometry2d {
  if (!Object.isFrozen(symbol)) {
    return compute(symbol)
  }
  const cached = cache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = freezeGeometry(compute(symbol))
  cache.set(symbol, geometry)
  return geometry
}

/**
 * @group SymbolUtils
 * @summary Reads a symbol's derived geometry — bounds, vertices, snap points, edges, length.
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

  /**
   * Snap points come from the util, not from the geometry.
   *
   * A `Geometry2d` describes a shape; where that shape offers to snap is a decision about the symbol,
   * not about its outline — a text snaps on its box, never on its glyphs. Every util already answered
   * this, with the same one line six times over (`mapPointsForward(symbol, computeGeometry(symbol)
   * .snapPoints)`), which is exactly what this used to recompute for itself.
   */
  snapPointsOf(symbol: TBaseSymbol): TPoint[] {
    return symbolRegistry.getUtilFor(symbol).getSnapPoints(symbol)
  },

  edgesOf(symbol: TBaseSymbol): TSegment[] {
    return of(symbol).edges
  },

  lengthOf(symbol: TBaseSymbol): number {
    return of(symbol).length
  },
}
