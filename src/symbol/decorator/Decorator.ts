import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TPartialDeep } from "@/utils"
import { createUUID } from "@/utils"

/**
 * @group Symbol
 */
export enum DecoratorKind {
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
  style: TStyle
  kind: DecoratorKind
  targetIds: string[]
  bounds: TOBB
  hasBounds: boolean
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
  baseline?: number
  xHeight?: number
}

/**
 * @group Symbol
 * @summary Check if symbol is a standalone decorator
 */
export function isDecorator(symbol: TBaseSymbol): symbol is TDecorator {
  return symbol.type === SymbolType.Decorator
}

/**
 * @group Symbol
 */
export const DecoratorOps = {
  create(kind: DecoratorKind, style: TPartialDeep<TStyle>, targetIds: string[] = [], bounds?: TBox): TDecorator {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const decorator: TDecorator = {
      id: `${kind}-${createUUID()}`,
      type: SymbolType.Decorator,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      kind,
      targetIds,
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      hasBounds: false,
      vertices: [],
      snapPoints: [],
      edges: [],
    }
    if (bounds) {
      DecoratorOps.setBounds(decorator, OBBOps.fromBox(bounds))
    }
    return decorator
  },

  setBounds(decorator: TDecorator, bounds: TOBB): void {
    decorator.bounds = bounds
    decorator.hasBounds = true
    const yMid = bounds.center.y
    const hw = bounds.width / 2
    const vertices: TPoint[] = [
      { x: bounds.center.x - hw, y: yMid },
      { x: bounds.center.x + hw, y: yMid },
    ]
    decorator.vertices = vertices
    decorator.snapPoints = vertices
    decorator.edges = [{ p1: vertices[0], p2: vertices[1] }]
  },

  overlaps(decorator: TDecorator, box: TBox): boolean {
    return decorator.hasBounds ? OBBOps.overlapsBox(decorator.bounds, box) : false
  },
}
