import { TPointer } from "@/symbol/base/Point"
import { TStyle } from "@/style"
import { SymbolType } from "@/symbol/base/Symbol"

/**
 * @group Symbol
 */
export type TEraser = {
  id: string
  type: SymbolType.Eraser
  style: TStyle
  pointers: TPointer[]
}
