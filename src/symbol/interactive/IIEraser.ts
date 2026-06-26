import type { TPointer } from "@/symbol/base/Point"
import type { TStyle } from "@/style"
import type { SymbolType } from "@/symbol/base/Symbol"

/**
 * @group Symbol
 */
export type TEraser = {
  id: string
  type: SymbolType.Eraser
  style: TStyle
  pointers: TPointer[]
}
