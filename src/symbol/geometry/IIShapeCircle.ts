import type { SymbolType } from "@/symbol/base/Symbol"
import type { TPoint, TSegment } from "@/symbol/base/Point"
import type { TBox } from "@/symbol/base/Box"
import type { TStyle } from "@/style"
import type { ShapeKind } from "./IIShape"

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
