import type { TStyle } from "@/style"
import type { TPartialDeep } from "@/utils"

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
