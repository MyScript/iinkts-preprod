import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { MatrixTransform, OBBOps } from "@/core/geometry"
import { convertRadianToDegree, TWO_PI } from "@/core/math"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { ShapeCircleOps, type TShapeCircle } from "@/symbol/shape/Circle"
import { ShapeEllipseOps, type TShapeEllipse } from "@/symbol/shape/Ellipse"
import { ShapePolygonOps, type TShapePolygon } from "@/symbol/shape/Polygon"
import type { TShape } from "@/symbol/shape/Shape"
import { ShapeKind } from "@/symbol/shape/Shape-enum"
import { SymbolType } from "@/symbol/Symbol"

import {
  defineKind,
  moveByCentre,
  moveByPoints,
  resolveKind,
  scaleCentreAboutOrigin,
  type TKindDefinition,
} from "../KindDefinition"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
import type { TResizeContext, TRotateContext, TTranslateContext } from "../TransformContext"
import type { TSymbolGeometry } from "../TSymbolGeometry"

/**
 * The shape kinds this util can build, and how.
 *
 * Adding a kind is adding an entry: there is no `switch` to find and extend in four places, and the
 * type makes it impossible to supply `create` and forget `overlaps`.
 *
 * `ShapeKind.Table` is absent on purpose — it is declared in the enum with no implementation behind
 * it, so it resolves like any unknown kind rather than like a shape that half works.
 */
const SHAPE_KINDS: Partial<Record<ShapeKind, TKindDefinition<TShape>>> = {
  [ShapeKind.Circle]: defineKind<TShape, TShapeCircle>({
    create: (partial) => ShapeCircleOps.createFromPartial(partial),
    updateDerivedFields: (shape) => ShapeCircleOps.updateDerivedFields(shape),
    computeGeometry: (shape) => {
      const vertices = ShapeCircleOps.computeVertices(shape)
      const bounds = ShapeCircleOps.computeBounds(shape)
      return {
        bounds,
        vertices,
        snapPoints: OBBOps.getSnapPoints(bounds),
        edges: ShapeCircleOps.computeEdges(vertices),
        length: 0,
      }
    },
    overlaps: (shape, box) => ShapeCircleOps.overlaps(shape, box),
    getSVGPath: (shape) => ShapeCircleOps.getSVGPath(shape),
    // A circle has no orientation of its own, so turning it is moving its centre.
    translate: moveByCentre,
    keepsAspectRatio: true,
    rotate: moveByCentre,
    // A circle scales to a circle: one radius, from the mean of the two scale factors.
    resize: (shape, matrix) => {
      shape.radius = +((shape.radius * (matrix.xx + matrix.yy)) / 2).toFixed(3)
      moveByCentre(shape, matrix)
    },
  }),
  [ShapeKind.Ellipse]: defineKind<TShape, TShapeEllipse>({
    create: (partial) => ShapeEllipseOps.createFromPartial(partial),
    updateDerivedFields: (shape) => ShapeEllipseOps.updateDerivedFields(shape),
    computeGeometry: (shape) => {
      const vertices = ShapeEllipseOps.computeVertices(shape)
      const bounds = OBBOps.createFromPoints(vertices)
      return {
        bounds,
        vertices,
        snapPoints: OBBOps.getSnapPoints(bounds),
        edges: ShapeEllipseOps.computeEdges(vertices),
        length: 0,
      }
    },
    overlaps: (shape, box) => ShapeEllipseOps.overlaps(shape, box),
    getSVGPath: (shape) => ShapeEllipseOps.getSVGPath(shape),
    translate: moveByCentre,
    // One of the four cells in the whole matrix that genuinely differ by operation: an ellipse
    // carries an orientation, so turning it is not the same as moving it.
    rotate: (shape, matrix) => {
      moveByCentre(shape, matrix)
      shape.orientation = (shape.orientation + MatrixTransform.rotation(matrix)) % TWO_PI
    },
    // The second of the two trigonometric cells: an oriented ellipse scales along its own axes, so
    // its centre moves about the origin rather than through the matrix.
    resize: (shape, matrix, origin) => {
      const cos = Math.cos(shape.orientation)
      const sin = Math.sin(shape.orientation)
      scaleCentreAboutOrigin(shape, matrix, origin, shape.orientation)
      shape.radiusX = +Math.abs(shape.radiusX * (matrix.xx * cos - matrix.yy * sin)).toFixed(3)
      shape.radiusY = +Math.abs(shape.radiusY * (matrix.xx * sin + matrix.yy * cos)).toFixed(3)
    },
    // The ellipse is the only kind whose path needs orienting, and this is where that used to live
    // as an `if (shape.kind === ShapeKind.Ellipse)` inside the shared `getSVGElement`.
    extraPathAttributes: (shape) => ({
      transform: `rotate(${convertRadianToDegree(shape.orientation)}, ${shape.center.x}, ${shape.center.y})`,
    }),
  }),
  [ShapeKind.Polygon]: defineKind<TShape, TShapePolygon>({
    create: (partial) => ShapePolygonOps.createFromPartial(partial),
    updateDerivedFields: (shape) => ShapePolygonOps.updateDerivedFields(shape),
    computeGeometry: (shape) => {
      const bounds = OBBOps.createFromPoints(shape.points)
      return {
        bounds,
        vertices: shape.points,
        snapPoints: OBBOps.getSnapPoints(bounds),
        edges: ShapePolygonOps.computeEdges(shape.points),
        length: 0,
      }
    },
    overlaps: (shape, box) => ShapePolygonOps.overlaps(shape, box),
    getSVGPath: (shape) => ShapePolygonOps.getSVGPath(shape),
    translate: moveByPoints,
    rotate: moveByPoints,
    resize: moveByPoints,
  }),
}

/**
 * @group SymbolUtils
 */
export class ShapeUtil extends SymbolUtil<TShape> {
  readonly type = SymbolType.Shape

  create(partial: TPartialDeep<TShape>): TShape {
    return resolveKind(SHAPE_KINDS, partial.kind, "shape", "create").create(partial)
  }

  /**
   * Tolerant like `updateDerivedFields`: a kind arriving as data the table does not own leaves the
   * shape's current fields as its answer, rather than throwing over a whole model.
   */
  computeGeometry(shape: TShape): TSymbolGeometry {
    return (
      SHAPE_KINDS[shape.kind]?.computeGeometry(shape) ?? {
        bounds: shape.bounds,
        vertices: shape.vertices,
        snapPoints: shape.snapPoints,
        edges: shape.edges,
        length: 0,
      }
    )
  }

  /**
   * A kind the table does not own performs no write at all, exactly like the dispatch this
   * replaced (`SHAPE_KINDS[shape.kind]?.updateDerivedFields(shape)`, a no-op for an unowned kind) —
   * `computeGeometry`'s tolerant fallback must not be turned into a write here, or this throws on a
   * frozen record for a kind it was never going to touch. `length` is also left out of the write:
   * only `TStroke` declares it.
   */
  updateDerivedFields(shape: TShape): void {
    const definition = SHAPE_KINDS[shape.kind]
    if (!definition) {
      return
    }
    const { bounds, vertices, snapPoints, edges } = definition.computeGeometry(shape)
    Object.assign(shape, { bounds, vertices, snapPoints, edges })
  }

  overlaps(shape: TShape, box: TBox): boolean {
    return SHAPE_KINDS[shape.kind]?.overlaps(shape, box) ?? false
  }

  getSnapPoints(shape: TShape): TPoint[] {
    return this.computeGeometry(shape).snapPoints
  }

  keepsAspectRatio(shape: TShape): boolean {
    return SHAPE_KINDS[shape.kind]?.keepsAspectRatio ?? false
  }

  translate(shape: TShape, { matrix }: TTranslateContext): void {
    resolveKind(SHAPE_KINDS, shape.kind, "shape", "translate").translate(shape, matrix)
    this.updateDerivedFields(shape)
  }

  rotate(shape: TShape, { matrix }: TRotateContext): void {
    resolveKind(SHAPE_KINDS, shape.kind, "shape", "rotate").rotate(shape, matrix)
    this.updateDerivedFields(shape)
  }

  resize(shape: TShape, { matrix, origin }: TResizeContext): void {
    resolveKind(SHAPE_KINDS, shape.kind, "shape", "resize").resize(shape, matrix, origin)
    this.updateDerivedFields(shape)
  }

  static getSVGPath(shape: TShape): string {
    return resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGPath for").getSVGPath(shape)
  }

  getSVGElement(shape: TShape): SVGGraphicsElement {
    const attrs: { [key: string]: string } = {
      id: shape.id,
      type: shape.type,
      kind: shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    const group = SVGBuilder.createGroup(attrs)
    const definition = resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGElement for")

    const pathAttrs: { [key: string]: string } = {
      fill: shape.style.fill || "transparent",
      stroke: shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width).toString(),
      d: definition.getSVGPath(shape),
      ...definition.extraPathAttributes?.(shape),
    }
    if (shape.style.opacity) {
      pathAttrs["opacity"] = shape.style.opacity.toString()
    }

    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }
}
