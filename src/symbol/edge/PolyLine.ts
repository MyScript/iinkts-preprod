import { type TPoint } from "@/core/geometry"
import type { TStyle } from "@/style"
import type { SymbolType } from "@/symbol/Symbol"
import { type TBaseSymbol } from "@/symbol/Symbol"

import type { TAnchor } from "./Anchor"
import type { EdgeDecoration } from "./Edge-enum"
import type { EdgeKind } from "./Edge-enum"
/**
 * @group Symbol
 */
export type TEdgePolyLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.PolyEdge
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  points: TPoint[]
}

/**
 * @group Symbol
 */
