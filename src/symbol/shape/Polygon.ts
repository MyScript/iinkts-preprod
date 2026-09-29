import type { TPoint } from "@/core/geometry"
import type { TStyle } from "@/style"
import type { TBaseSymbol } from "@/symbol/Symbol"
import type { SymbolType } from "@/symbol/Symbol"

import type { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapePolygon = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Polygon
  style: TStyle
  points: TPoint[]
}

/**
 * @group Symbol
 */
