import type { TPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { TStyle } from "@/style"

import type { TDecorator } from "./decorator/Decorator"
import type { TEdge } from "./edge/Edge"
import type { TShape } from "./shape/Shape"
import type { TStroke } from "./stroke/Stroke"
import type { TMath } from "./typeset/Math"
import type { TText } from "./typeset/Text"

/**
 * @group Symbol
 */
export enum SymbolType {
  Stroke = "stroke",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Math = "math",
  Eraser = "eraser",
  Decorator = "decorator",
}

/**
 * A handle a symbol offers for vertex-level resizing, and which of its vertices the handle moves.
 *
 * The shape was written out inline in four places before IIC-2009.
 *
 * @group Symbol
 */
export type TResizePoint = { point: TPoint; vertexIndex: number }

/**
 * @group Symbol
 */
export type TBaseSymbol = {
  id: string
  creationTime: number
  modificationDate: number
  type: string
  style: TPartialDeep<TStyle>
}

/**
 * @group Symbol
 */
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator
