import { applyMatrixToPoint, applyMatrixToPoints, type MatrixTransform, type TBox, type TPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { TResizePoint } from "@/symbol/Symbol"

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
  updateDerivedFields(symbol: T): void
  overlaps(symbol: T, box: TBox): boolean
  getSVGPath(symbol: T): string
  /** Moves this kind's own geometry. The family util derives afterwards, once, for every kind. */
  translate(symbol: T, matrix: MatrixTransform): void
  /**
   * Rotates this kind's own geometry. Five of the nine kinds point this at the same function as
   * `translate`: a matrix applied to their points is the whole of it, whichever gesture produced
   * the matrix. Only the ellipse and the arc carry an angle of their own to adjust.
   */
  rotate(symbol: T, matrix: MatrixTransform): void
  /**
   * Scales this kind's own geometry about `origin`.
   *
   * Takes the origin because two kinds need it: the ellipse and the arc scale their centre about it
   * by hand rather than pushing points through the matrix.
   */
  resize(symbol: T, matrix: MatrixTransform, origin: TPoint): void
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

/**
 * Looks a kind up, or fails saying which kind and which family. Used by the methods that cannot
 * carry on without a definition; the ones that can (`updateDerivedFields`, `overlaps`) index the
 * table directly and keep their old tolerant behaviour.
 */
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

/**
 * Applies a matrix to a symbol that stores a single centre — circle, ellipse and arc.
 *
 * Named for what it does rather than which operation calls it, because more than one does: five of
 * the nine kinds move identically under translate and rotate, which is most of the nine duplicated
 * cells the epic measured across the twenty-seven.
 */
export function moveByCentre(symbol: { center: TPoint }, matrix: MatrixTransform): void {
  symbol.center = applyMatrixToPoint(symbol.center, matrix)
}

/** Applies a matrix to a symbol that stores a vertex list — polygon and polyedge. */
export function moveByPoints(symbol: { points: TPoint[] }, matrix: MatrixTransform): void {
  applyMatrixToPoints(symbol.points, matrix)
}

/** Applies a matrix to a symbol that stores two endpoints — the line edge. */
export function moveEndpoints(symbol: { start: TPoint; end: TPoint }, matrix: MatrixTransform): void {
  symbol.start = applyMatrixToPoint(symbol.start, matrix)
  symbol.end = applyMatrixToPoint(symbol.end, matrix)
}

/**
 * Scales a symbol's centre about a fixed origin, along its own axes.
 *
 * The ellipse and the arc share this to the character; what they do *not* share is how they scale
 * their radii — the ellipse uses `scaleX·cos − scaleY·sin` with the absolute value taken over the
 * whole product, the arc uses `scaleX·cos + scaleY·sin` with it taken over the factor alone. Those
 * two are left where they are: the arc's angle convention runs opposite to the ellipse's, so the
 * difference is plausibly deliberate, and unifying it would be a behaviour change rather than a
 * move.
 */
export function scaleCentreAboutOrigin(
  symbol: { center: TPoint },
  matrix: MatrixTransform,
  origin: TPoint,
  angle: number
): void {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const scaleX = matrix.xx
  const scaleY = matrix.yy
  symbol.center.x = +(
    symbol.center.x +
    ((scaleX - 1) * cos + (scaleY - 1) * sin) * (symbol.center.x - origin.x)
  ).toFixed(3)
  symbol.center.y = +(
    symbol.center.y +
    ((scaleX - 1) * -sin + (scaleY - 1) * cos) * (symbol.center.y - origin.y)
  ).toFixed(3)
}
