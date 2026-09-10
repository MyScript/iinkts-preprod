import type { TBox, TPoint } from "@/core/geometry"
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
 * When standalone (in model.symbols): `targetIds` holds the referenced stroke ids and
 * `targetBounds` the box to draw across. When embedded (in `TText.decorators[]`): `targetIds` is
 * empty and `targetBounds` unset — the parent symbol's bounds are used at render time.
 * @group Symbol
 */
export type TDecorator = TBaseSymbol & {
  type: SymbolType.Decorator
  style: TStyle
  kind: DecoratorKind
  targetIds: string[]
  /**
   * The box this decorator is drawn across — an **input**, not a derived value, which is why it
   * survived the removal of every computable field and why it is named for where it comes from.
   *
   * A decorator holds no coordinates of its own: it is placed over other symbols. Its box arrives
   * from outside, either as the recognizer's own word box (JIIX, which is not the union of the
   * strokes' boxes and cannot be recomputed from them) or as that union when JIIX has not answered
   * yet. `computeGeometry` therefore reads this field rather than deriving anything, and whoever
   * moves or re-targets the decorator has to write it again — see
   * `IIAbstractTransformManager.updateDecoratorsForTargets`.
   *
   * Unset is the "no box of its own" case, and it is the only flag: the `hasBounds` boolean that
   * used to shadow a zero-size box is gone, so presence cannot disagree with itself.
   */
  targetBounds?: TOBB
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
  create(kind: DecoratorKind, style: TPartialDeep<TStyle>, targetIds: string[] = [], targetBounds?: TBox): TDecorator {
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
      transform: MatrixTransform.identity(),
    }
    if (targetBounds) {
      DecoratorOps.setTargetBounds(decorator, OBBOps.fromBox(targetBounds))
    }
    return decorator
  },

  setTargetBounds(decorator: TDecorator, targetBounds: TOBB): void {
    decorator.targetBounds = targetBounds
  },

  overlaps(decorator: TDecorator, box: TBox): boolean {
    return decorator.targetBounds ? OBBOps.overlapsBox(decorator.targetBounds, box) : false
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
}
