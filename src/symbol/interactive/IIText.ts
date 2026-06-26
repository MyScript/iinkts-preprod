import type { TStyle } from "@/style"
import type { TPoint, TSegment } from "@/symbol/base/Point"
import type { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import type { TDecorator } from "./IIDecorator"
import type { TTypesetChild, TRotation } from "./IITypeset"

/**
 * @group Symbol
 */
export type TSymbolChar = TTypesetChild

/**
 * @group Symbol
 */
export type TText = {
  id: string
  type: SymbolType.Text
  isClosed: true
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  point: TPoint
  chars: TSymbolChar[]
  decorators: TDecorator[]
  bounds: TBox
  rotation?: TRotation
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
}
