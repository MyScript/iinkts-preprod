import type { TBox } from "@/core/geometry"
import type { TPoint } from "@/core/geometry"
import {
  Circle2d,
  Ellipse2d,
  type Geometry2d,
  isIdentityMatrix,
  MatrixTransform,
  OBBOps,
  Polygon2d,
} from "@/core/geometry"
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
import { SymbolGeometry } from "../SymbolGeometry"
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
/**
 * Whether a shape's style paints its inside, and so whether a query landing wholly within it — and
 * touching no edge — selects it.
 *
 * Unpainted is the default everywhere: `getSVGElement` writes `shape.style.fill || "transparent"`,
 * and the theme's own default is `#FFFFFF00`. Both are "no fill" spelled differently, so both have
 * to be read as one.
 */
function isFilledStyle(shape: TShape): boolean {
  const fill = shape.style.fill?.trim().toLowerCase()
  return !!fill && fill !== "transparent" && fill !== "none" && !/^#[0-9a-f]{6}00$/.test(fill)
}

const SHAPE_KINDS: Partial<Record<ShapeKind, TKindDefinition<TShape>>> = {
  [ShapeKind.Circle]: defineKind<TShape, TShapeCircle>({
    create: (partial) => ShapeCircleOps.createFromPartial(partial),
    getGeometry: (shape) => new Circle2d(shape.center, shape.radius, isFilledStyle(shape)),
    getSVGPath: (shape) => ShapeCircleOps.getSVGPath(shape),
    keepsAspectRatio: true,
  }),
  [ShapeKind.Ellipse]: defineKind<TShape, TShapeEllipse>({
    create: (partial) => ShapeEllipseOps.createFromPartial(partial),
    getGeometry: (shape) =>
      Ellipse2d.fromRadii(shape.center, shape.radiusX, shape.radiusY, shape.orientation, isFilledStyle(shape)),
    getSVGPath: (shape) => ShapeEllipseOps.getSVGPath(shape),
    // The ellipse is the only kind whose path needs orienting, and this is where that used to live
    // as an `if (shape.kind === ShapeKind.Ellipse)` inside the shared `getSVGElement`.
    extraPathAttributes: (shape) => ({
      transform: `rotate(${convertRadianToDegree(shape.orientation)}, ${shape.center.x}, ${shape.center.y})`,
    }),
  }),
  [ShapeKind.Polygon]: defineKind<TShape, TShapePolygon>({
    create: (partial) => ShapePolygonOps.createFromPartial(partial),
    getGeometry: (shape) => new Polygon2d(shape.points, isFilledStyle(shape)),
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
   * An unregistered kind gets an empty polygon: no vertices, no edges, an empty box at the origin,
   * and so no overlap with anything. Same answer the record fallback gave, said once instead of
   * field by field.
   */
  getGeometry(shape: TShape): Geometry2d {
    return SHAPE_KINDS[shape.kind]?.getGeometry(shape) ?? new Polygon2d([])
  }

  overlaps(shape: TShape, box: TBox): boolean {
    return SymbolGeometry.of(shape).overlapsBox(box)
  }

  /**
   * A shape snaps on its box — corners, mid-sides and centre — whatever its outline looks like.
   *
   * None at all for a kind the table does not own: its box is an empty one at the origin, and
   * offering nine snap points there would pull anything nearby to the corner of the page.
   */
  getSnapPoints(shape: TShape): TPoint[] {
    return SHAPE_KINDS[shape.kind] ? OBBOps.getSnapPoints(SymbolGeometry.of(shape).bounds) : []
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
