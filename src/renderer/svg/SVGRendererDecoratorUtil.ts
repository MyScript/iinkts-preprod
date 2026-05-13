import { Box, DecoratorKind, IIDecorator, isRecognizedTextSymbol, TBox, TIISymbol } from "../../symbol"
import { DefaultStyle } from "../../style"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererDecoratorUtil
{
  static getSVGElementFromBounds(decorator: IIDecorator, bounds: Box, baseline?: number, xHeight?: number, symbolStyle?: { width?: number, color?: string }, deleting: boolean = false): SVGGeometryElement | undefined
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
    if (deleting) {
      attrs["opacity"] = ((decorator.style.opacity || 1) * 0.5).toString()
    }

    let element: SVGGeometryElement | undefined

    const strokeWidth = symbolStyle?.width || DefaultStyle.width

    switch (decorator.kind) {
      case DecoratorKind.Highlight: {
        attrs["opacity"] = deleting ? "0.25" : "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        const boundingBox: TBox = {
          x: bounds.x - +strokeWidth,
          y: bounds.y - +strokeWidth,
          height: bounds.height + +strokeWidth * 2,
          width: bounds.width + +strokeWidth * 2,
        }
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
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
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = {
          x: bounds.xMin,
          y: bounds.yMid
        }
        const p2 = {
          x: bounds.xMax,
          y: bounds.yMid
        }
        if (baseline !== undefined && xHeight !== undefined) {
          // Strikethrough should go through the middle of the text
          p1.y = baseline + xHeight
          p2.y = baseline + xHeight
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = {
          x: bounds.xMin,
          y: bounds.yMax + +strokeWidth
        }
        const p2 = {
          x: bounds.xMax,
          y: bounds.yMax + +strokeWidth
        }
        if (baseline !== undefined && xHeight !== undefined) {
          // Underline should be below the baseline
          p1.y = baseline + 2 * xHeight
          p2.y = baseline + 2 * xHeight
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
    }

    return element
  }

  static getSVGElement(decorator: IIDecorator, symbol: TIISymbol): SVGGeometryElement | undefined
  {
    const baseline = isRecognizedTextSymbol(symbol) ? symbol.baseline : undefined
    const xHeight = isRecognizedTextSymbol(symbol) ? symbol.xHeight : undefined

    return this.getSVGElementFromBounds(
      decorator,
      symbol.bounds,
      baseline,
      xHeight,
      { width: symbol.style.width, color: symbol.style.color },
      symbol.deleting
    )
  }
}
