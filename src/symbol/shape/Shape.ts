import type { TPartialDeep } from "@/utils/types"
import { SymbolType, type TBaseSymbol } from "../Symbol"
import { ShapeCircleOps, type TShapeCircle } from "./Circle"
import { ShapeEllipseOps, type TShapeEllipse } from "./Ellipse"
import { ShapePolygonOps, type TShapePolygon } from "./Polygon"
import { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShape = TShapeCircle | TShapeEllipse | TShapePolygon

/**
 * @group Symbol
 */
export const ShapeOps = {
  /**
   * @group Symbol
   * @summary Check if symbol is a shape (circle, ellipse, polygon)
   * @param symbol - Symbol to check
   * @returns True if symbol is a shape
   */
  isShape(symbol: TBaseSymbol): symbol is TShape
  {
    return symbol.type === SymbolType.Shape
  },

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is a circle
   * @param shape - The shape to check
   * @returns True if the shape is a circle
   */
  isCircleShape(shape: TBaseSymbol): shape is TShapeCircle
  {
    return ShapeOps.isShape(shape) && shape.kind === ShapeKind.Circle
  },

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is an ellipse
   * @param shape - The shape to check
   * @returns True if the shape is an ellipse
   */
  isEllipseShape(shape: TBaseSymbol): shape is TShapeEllipse
  {
    return ShapeOps.isShape(shape) && shape.kind === ShapeKind.Ellipse
  },

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is a polygon
   * @param shape - The shape to check
   * @returns True if the shape is a polygon
   */
  isPolygonShape(shape: TBaseSymbol): shape is TShapePolygon
  {
    return ShapeOps.isShape(shape) && shape.kind === ShapeKind.Polygon
  },

  /**
   * @group Symbol
   * @summary Update derived fields (bounds, vertices, snapPoints, edges) for any TShape.
   */
  updateShapeDerivedFields(shape: TShape): void
  {
    if (ShapeOps.isCircleShape(shape)) ShapeCircleOps.updateDerivedFields(shape)
    else if (ShapeOps.isEllipseShape(shape)) ShapeEllipseOps.updateDerivedFields(shape)
    else if (ShapeOps.isPolygonShape(shape)) ShapePolygonOps.updateDerivedFields(shape)
  },

  /**
   * @group Symbol
   * @summary Create a TShape from partial data — dispatches by kind.
   */
  createShapeFromPartial(partial: TPartialDeep<TShape>): TShape
  {
    switch (partial.kind) {
      case ShapeKind.Circle:
        return ShapeCircleOps.createFromPartial(partial as TPartialDeep<TShapeCircle>)
      case ShapeKind.Ellipse:
        return ShapeEllipseOps.createFromPartial(partial as TPartialDeep<TShapeEllipse>)
      case ShapeKind.Polygon:
        return ShapePolygonOps.createFromPartial(partial as TPartialDeep<TShapePolygon>)
      default:
        throw new Error(`Unable to create shape, kind: "${ partial.kind }" is unknown`)
    }
  },
}
