import type { SymbolType } from "@/symbol/base/Symbol"
import type { TPoint, TSegment } from "@/symbol/base/Point"
import type { TBox } from "@/symbol/base/Box"
import type { TStyle } from "@/style"
import type { EdgeKind, EdgeDecoration } from "./IIEdge"

/**
 * @group Symbol
 */
export type TEdgeLine = {
  id: string
  type: SymbolType.Edge
  kind: EdgeKind.Line
  isClosed: false
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  start: TPoint
  end: TPoint
  vertices: TPoint[]
  bounds: TBox
  snapPoints: TPoint[]
  edges: TSegment[]
}
