import { TStyle } from "@/style"
import { TPoint, TSegment } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { TDecorator } from "./IIDecorator"
import { TTypesetChild, TRotation } from "./IITypeset"

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
