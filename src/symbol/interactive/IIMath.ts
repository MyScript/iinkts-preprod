import type { TStyle } from "@/style"
import type { TPoint, TSegment } from "@/symbol/base/Point"
import type { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import type { TDecorator } from "./IIDecorator"
import type { TTypesetChild, TRotation } from "./IITypeset"

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
export type TMathElement = TTypesetChild & {
  fontFamily: string
  position?: "superscript" | "subscript" | "normal"
}

/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
export type TMath = {
  id: string
  type: SymbolType.Math
  isClosed: true
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  point: TPoint
  elements: TMathElement[]
  decorators: TDecorator[]
  bounds: TBox
  rotation?: TRotation
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
}
