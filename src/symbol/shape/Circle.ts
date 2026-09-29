import { type TPoint } from "@/core/geometry"
import { type TStyle } from "@/style"
import type { SymbolType } from "@/symbol/Symbol"
import { type TBaseSymbol } from "@/symbol/Symbol"

import type { ShapeKind } from "./Shape-enum"

/**
 * @group Symbol
 */
export type TShapeCircle = TBaseSymbol & {
  type: SymbolType.Shape
  kind: ShapeKind.Circle
  style: TStyle
  center: TPoint
  radius: number
}

/**
 * @group Symbol
 */
