import { TPoint, TSegment } from "@/symbol/base/Point"
import { TBox } from "@/symbol/base/Box"
import { TStyle } from "@/style"
import { SymbolType } from "@/symbol/base/Symbol"

/**
 * @group Symbol
 */
export enum DecoratorKind
{
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * Standalone decorator symbol that references the strokes or text it decorates.
 * When standalone (in model.symbols): targetIds contains the referenced stroke IDs
 * and hasBounds is true with word-level bounding box.
 * When embedded (in IIText.decorators[]): targetIds is empty and hasBounds is false
 * (the parent symbol's bounds are used at render time).
 * @group Symbol
 */
export type TDecorator = {
  id: string
  type: SymbolType.Decorator
  isClosed: false
  style: TStyle
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  kind: DecoratorKind
  targetIds: string[]
  bounds: TBox
  hasBounds: boolean
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
  baseline?: number
  xHeight?: number
}
