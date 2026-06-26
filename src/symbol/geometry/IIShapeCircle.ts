import { SymbolType } from "@/symbol/base/Symbol"
import { TPoint, TSegment } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { ShapeKind } from "./IIShape"

/**
 * @group Symbol
 */
export type TShapeCircle = {
  id: string
  type: SymbolType.Shape
  kind: ShapeKind.Circle
  isClosed: true
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  center: TPoint
  radius: number
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}
