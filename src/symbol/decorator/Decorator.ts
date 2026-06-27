import type { TPartialDeep } from "@/utils"
import { createUUID } from "@/utils"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import { SymbolType } from "@/symbol/Symbol"
import type { TBaseSymbol } from "@/symbol/Symbol"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxHelper } from "@/symbol/primitives/Box"

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
 * When embedded (in TText.decorators[]): targetIds is empty and hasBounds is false
 * (the parent symbol's bounds are used at render time).
 * @group Symbol
 */
export type TDecorator = TBaseSymbol & {
  type: SymbolType.Decorator
  isClosed: false
  style: TStyle
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

/**
 * @group Symbol
 * @group Utilities
 */
export const DecoratorHelper = {
  create(kind: DecoratorKind, style: TPartialDeep<TStyle>, targetIds: string[] = [], bounds?: TBox): TDecorator
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const decorator: TDecorator = {
      id: `${ kind }-${ createUUID() }`,
      type: SymbolType.Decorator,
      isClosed: false,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      kind,
      targetIds,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      hasBounds: false,
      vertices: [],
      snapPoints: [],
      edges: [],
    }
    if (bounds) DecoratorHelper.setBounds(decorator, bounds)
    return decorator
  },

  setBounds(decorator: TDecorator, bounds: TBox): void
  {
    decorator.bounds = bounds
    decorator.hasBounds = true
    const yMid = bounds.y + bounds.height / 2
    const vertices: TPoint[] = [
      { x: bounds.x, y: yMid },
      { x: bounds.x + bounds.width, y: yMid },
    ]
    decorator.vertices = vertices
    decorator.snapPoints = vertices
    decorator.edges = [{ p1: vertices[0], p2: vertices[1] }]
  },

  overlaps(decorator: TDecorator, box: TBox): boolean
  {
    return decorator.hasBounds ? BoxHelper.overlaps(decorator.bounds, box) : false
  },
}
