import { BoxOps, type TBox } from "../Box"
import { applyMatrixToPoint, type TMatrixTransform } from "../Matrix"
import type { TPoint } from "../Point"
import { Geometry2d } from "./Geometry2d"

/**
 * @group Core/Geometry
 * @summary An ordered run of sampled points, caught by the samples themselves.
 *
 * The shape a stroke has. Its path, its length and its bounds all come from the same run of points,
 * so everything {@link Geometry2d} derives is already right here — only the overlap test differs,
 * and it differs on purpose.
 *
 * **Why the test is the points and not the path.** Everything else in this module answers "does the
 * query touch the shape I draw". A stroke answers a different question: "did the query catch a
 * sample". The two part company when a query slips between two consecutive samples — a box crossing
 * the segment without containing either end. Treating that as a hit is right for a drawn line and
 * wrong for a stroke, whose selection has always meant the points it captured. Preserving that is
 * not conservatism: a stroke samples sparsely where the pen moved fast, so an edge-crossing test
 * would make a quick flick selectable from far more places than a slow one drawn identically.
 *
 * `isClosed` is false — the last sample does not join back to the first, and inventing that edge
 * would add a phantom segment straight across the stroke, lengthening it and giving hit-testing
 * something to catch that was never drawn. `isFilled` is false for the same reason a line has no
 * inside.
 */
export class PointSet2d extends Geometry2d {
  readonly #points: TPoint[]

  constructor(points: TPoint[]) {
    super({ isClosed: false, isFilled: false })
    this.#points = points
  }

  protected computeVertices(): TPoint[] {
    return this.#points
  }

  /**
   * Whether any sample falls inside the query, bounds included.
   *
   * Inclusive on every side, so a sample exactly on the query's edge counts — a selection dragged
   * to land precisely on a point is a selection of it.
   */
  override overlapsBox(box: TBox): boolean {
    return this.#points.some((point) => BoxOps.containsPoint(box, point))
  }

  override transform(matrix: TMatrixTransform): PointSet2d {
    return new PointSet2d(this.#points.map((point) => applyMatrixToPoint(point, matrix)))
  }
}
