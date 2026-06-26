import type { TPartialDeep } from "@/utils";
import { createUUID } from "@/utils"
import type { TStyle } from "@/style";
import { DefaultStyle } from "@/style"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TPoint } from "@/symbol/base/Point"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import type { DecoratorKind, TDecorator } from "@/symbol/interactive/IIDecorator"

export const IIDecoratorHelper = {
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
    if (bounds) IIDecoratorHelper.setBounds(decorator, bounds)
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
