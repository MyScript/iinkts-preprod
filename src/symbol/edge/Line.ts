import type { EdgeDecoration } from "@/Constants"
import { type TPoint } from "@/core/geometry"
import type { TStyle } from "@/style"
import type { SymbolType } from "@/symbol/Symbol"
import { type TBaseSymbol } from "@/symbol/Symbol"

import type { TAnchor } from "./Anchor"
import type { EdgeKind } from "./Edge-enum"

/**
 * @group Symbol
 */
export type TEdgeLine = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.Line
  style: TStyle
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  start: TPoint
  end: TPoint
}

/**
 * @group Symbol
 */
