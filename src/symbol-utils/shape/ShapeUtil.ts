import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import { isIdentityMatrix, MatrixTransform, OBBOps } from "@/core/geometry"
import { convertRadianToDegree } from "@/core/math"
import type { TPartialDeep } from "@/core/std"
import { DefaultStyle } from "@/style"
import { ShapeCircleOps, type TShapeCircle } from "@/symbol/shape/Circle"
import { ShapeEllipseOps, type TShapeEllipse } from "@/symbol/shape/Ellipse"
import { ShapePolygonOps, type TShapePolygon } from "@/symbol/shape/Polygon"
import type { TShape } from "@/symbol/shape/Shape"
import { ShapeKind } from "@/symbol/shape/Shape-enum"
import { SymbolType } from "@/symbol/Symbol"

import { defineKind, resolveKind, type TKindDefinition } from "../KindDefinition"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"
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
    keepsAspectRatio: true,
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
    return this.overlapsQuery(shape, box, (b) => SHAPE_KINDS[shape.kind]?.overlaps(shape, b) ?? false)
  }

  getSnapPoints(shape: TShape): TPoint[] {
    return this.mapPointsForward(shape, this.computeGeometry(shape).snapPoints)
  }

  keepsAspectRatio(shape: TShape): boolean {
    return SHAPE_KINDS[shape.kind]?.keepsAspectRatio ?? false
  }

  static getSVGPath(shape: TShape): string {
    return resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGPath for").getSVGPath(shape)
  }

  getSVGElement(shape: TShape): SVGGraphicsElement {
    const definition = resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGElement for")

    const attrs: { [key: string]: string } = {
      id: shape.id,
      type: shape.type,
      kind: shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (!isIdentityMatrix(shape.transform)) {
      attrs.transform = MatrixTransform.toCssString(shape.transform)
    }

    const group = SVGBuilder.createGroup(attrs)

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
