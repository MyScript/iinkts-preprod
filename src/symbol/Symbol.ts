import type { TStyle } from "@/style"
import type { TPartialDeep } from "@/utils"
import type { TEdge } from "./edge/Edge"
import type { TShape } from "./shape/Shape"
import type { TStroke } from "./stroke/Stroke"
import type { TText } from "./text/Text"
import type { TMath } from "./math/Math"
import type { TDecorator } from "./decorator/Decorator"

/**
 * @group Symbol
 */
export enum SymbolType
{
  Stroke = "stroke",
  Group = "group",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Math = "math",
  Eraser = "eraser",
  Decorator = "decorator"
}

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
