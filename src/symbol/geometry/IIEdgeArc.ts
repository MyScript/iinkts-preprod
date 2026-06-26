import { SymbolType } from "@/symbol/base/Symbol"
import { TPoint, TSegment } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { EdgeKind, EdgeDecoration } from "./IIEdge"

/**
 * @group Symbol
 */
export type TEdgeArc = {
  id: string
  type: SymbolType.Edge
  kind: EdgeKind.Arc
  isClosed: false
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  center: TPoint
  startAngle: number
  sweepAngle: number
  radiusX: number
  radiusY: number
  phi: number
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}
