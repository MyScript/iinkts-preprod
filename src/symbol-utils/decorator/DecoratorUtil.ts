import type { TPartialDeep } from "@/utils"
import { DefaultStyle } from "@/style"
import type { TBox } from "@/symbol/primitives/Box"
import type { TPoint } from "@/symbol/primitives/Point"
import { SymbolType } from "@/symbol/Symbol"
import { DecoratorOps, DecoratorKind, type TDecorator } from "@/symbol/decorator/Decorator"
import { SymbolUtil } from "../SymbolUtil"
import { SVGBuilder } from "../SVGBuilder"

/**
 * @group SymbolUtils
 */
export class DecoratorUtil extends SymbolUtil<TDecorator>
{
  readonly type = SymbolType.Decorator

  create(partial: TPartialDeep<TDecorator>): TDecorator
  {
    if (!partial.kind) throw new Error("TDecorator requires kind")
    const targetIds = (partial.targetIds ?? []).filter((id): id is string => id !== undefined)
    const bounds = partial.bounds as TBox | undefined
    return DecoratorOps.create(partial.kind, partial.style ?? {}, targetIds, bounds)
  }

  updateDerivedFields(decorator: TDecorator): void
  {
    if (decorator.hasBounds) {
      DecoratorOps.setBounds(decorator, decorator.bounds)
    }
  }

  overlaps(decorator: TDecorator, box: TBox): boolean
  {
    return DecoratorOps.overlaps(decorator, box)
  }

  getSnapPoints(decorator: TDecorator): TPoint[]
  {
    return decorator.snapPoints
  }

  canResize(_decorator: TDecorator): boolean
  {
    return false
  }

  canRotate(_decorator: TDecorator): boolean
  {
    return false
  }

  getSVGElement(decorator: TDecorator): SVGGeometryElement | undefined
  {
    return DecoratorUtil.renderFromBounds(
      decorator,
      decorator.bounds,
      decorator.baseline,
      decorator.xHeight,
      { width: decorator.style.width, color: decorator.style.color }
    )
  }

  static renderForSymbol(decorator: TDecorator, symbol: { bounds: TBox; style: { width?: number; color?: string } }): SVGGeometryElement | undefined
  {
    const bounds = decorator.hasBounds ? decorator.bounds : symbol.bounds
    return DecoratorUtil.renderFromBounds(
      decorator,
      bounds,
      undefined,
      undefined,
      { width: symbol.style.width, color: symbol.style.color }
    )
  }

  static renderFromBounds(decorator: TDecorator, bounds: TBox, baseline?: number, xHeight?: number, symbolStyle?: { width?: number; color?: string }): SVGGeometryElement | undefined
  {
    const attrs: { [key: string]: string } = {
      "id": decorator.id,
      "type": "decorator",
      "kind": decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (decorator.style.opacity) {
      attrs["opacity"] = decorator.style.opacity.toString()
    }

    const strokeWidth = symbolStyle?.width || DefaultStyle.width

    switch (decorator.kind) {
      case DecoratorKind.Highlight: {
        attrs["opacity"] = "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        const boundingBox: TBox = {
          x: bounds.x - +strokeWidth,
          y: bounds.y - +strokeWidth,
          height: bounds.height + +strokeWidth * 2,
          width: bounds.width + +strokeWidth * 2,
        }
        return SVGBuilder.createRect(boundingBox, attrs)
      }
      case DecoratorKind.Surround: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const boundingBox: TBox = {
          x: bounds.x - +strokeWidth,
          y: bounds.y - +strokeWidth,
          height: bounds.height + +strokeWidth * 2,
          width: bounds.width + +strokeWidth * 2,
        }
        return SVGBuilder.createRect(boundingBox, attrs)
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = { x: bounds.x, y: bounds.y + bounds.height / 2 }
        const p2 = { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }
        if (baseline !== undefined && xHeight !== undefined) {
          p1.y = baseline - xHeight
          p2.y = baseline - xHeight
        }
        return SVGBuilder.createLine(p1, p2, attrs)
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = { x: bounds.x, y: bounds.y + bounds.height + +strokeWidth }
        const p2 = { x: bounds.x + bounds.width, y: bounds.y + bounds.height + +strokeWidth }
        if (baseline !== undefined && xHeight !== undefined) {
          p1.y = baseline + xHeight
          p2.y = baseline + xHeight
        }
        return SVGBuilder.createLine(p1, p2, attrs)
      }
      default:
        return undefined
    }
  }
}
