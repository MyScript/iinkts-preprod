import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
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
    overlaps: (shape, box) => ShapeCircleOps.overlaps(shape, box),
    getSVGPath: (shape) => ShapeCircleOps.getSVGPath(shape),
  }),
  [ShapeKind.Ellipse]: defineKind<TShape, TShapeEllipse>({
    create: (partial) => ShapeEllipseOps.createFromPartial(partial),
    updateDerivedFields: (shape) => ShapeEllipseOps.updateDerivedFields(shape),
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

  updateDerivedFields(shape: TShape): void {
    SHAPE_KINDS[shape.kind]?.updateDerivedFields(shape)
  }

  overlaps(shape: TShape, box: TBox): boolean {
    return SHAPE_KINDS[shape.kind]?.overlaps(shape, box) ?? false
  }

  getSnapPoints(shape: TShape): TPoint[] {
    return shape.snapPoints
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
