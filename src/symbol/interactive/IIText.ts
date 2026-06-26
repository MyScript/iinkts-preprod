import { TStyle } from "@/style"
import { TPoint, TSegment } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { TDecorator } from "./IIDecorator"
import { TTypesetChild, TRotation } from "./IITypeset"

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
