import type { TBox } from "@/core/geometry"
import type { TPoint, TSegment } from "@/core/geometry"
import { MatrixTransform, OBBOps, type TOBB } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import type { TStyle } from "@/style"
import { mergeSymbolStyle } from "@/style"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
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
    const mergedStyle = mergeSymbolStyle(style)
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
      transform: MatrixTransform.identity(),
    }
    if (bounds) {
      DecoratorOps.setBounds(decorator, OBBOps.fromBox(bounds))
    }
    return decorator
  },

  /** The two endpoints of the horizontal line a decorator's own geometry is: the middle of its bounds. */
  computeVertices(bounds: TOBB): TPoint[] {
    const yMid = bounds.center.y
    const hw = bounds.width / 2
    return [
      { x: bounds.center.x - hw, y: yMid },
      { x: bounds.center.x + hw, y: yMid },
    ]
  },

  setBounds(decorator: TDecorator, bounds: TOBB): void {
    decorator.bounds = bounds
    decorator.hasBounds = true
    const vertices = DecoratorOps.computeVertices(bounds)
    decorator.vertices = vertices
    decorator.snapPoints = vertices
    decorator.edges = [{ p1: vertices[0], p2: vertices[1] }]
  },

  overlaps(decorator: TDecorator, box: TBox): boolean {
    return decorator.hasBounds ? OBBOps.overlapsBox(decorator.bounds, box) : false
  },
}
