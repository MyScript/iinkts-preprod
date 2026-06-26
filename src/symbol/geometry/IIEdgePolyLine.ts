import { SymbolType } from "@/symbol/base/Symbol"
import { TPoint, TSegment } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { EdgeKind, EdgeDecoration } from "./IIEdge"

/**
 * @group Symbol
 */
export type TEdgePolyLine = {
  id: string
  type: SymbolType.Edge
  kind: EdgeKind.PolyEdge
  isClosed: false
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  points: TPoint[]
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}
