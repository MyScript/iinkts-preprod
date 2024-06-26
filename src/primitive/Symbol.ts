import { TStyle } from "../style"

/**
 * @group Primitive
 */
export enum SymbolType
{
  Stroke = "stroke",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Eraser = "eraser",
}

/**
 * @group Primitive
 */
export interface TSymbol {
  id: string
  creationTime: number
  modificationDate: number
  type: SymbolType | string
  style: TStyle
}
