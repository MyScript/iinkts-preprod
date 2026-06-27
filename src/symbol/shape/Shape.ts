import type { TShapeCircle } from "./Circle"
import type { TShapeEllipse } from "./Ellipse"
import type { TShapePolygon } from "./Polygon"

/**
 * @group Symbol
 */
export enum ShapeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Polygon = "polygon",
  Table = "table"
}

/**
 * @group Symbol
 */
export type TShape = TShapeCircle | TShapeEllipse | TShapePolygon
