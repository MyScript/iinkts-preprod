import type { TEdgeArc, TEdgeLine, TEdgePolyLine, TEdge } from "@/symbol";
import { EdgeDecoration, EdgeKind } from "@/symbol"
import { DefaultStyle } from "@/style"
import { SVGRendererConst } from "./utils/SVGRendererConst"
import { SVGBuilder } from "./utils/SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererEdgeUtil
{
  static getLinePath(line: TEdgeLine): string
  {
    return `M ${ line.start.x } ${ line.start.y } L ${ line.end.x } ${ line.end.y }`
  }

  static getPolyLinePath(line: TEdgePolyLine): string
  {
    let path = `M ${ line.vertices[0].x } ${ line.vertices[0].y }`
    for (let i = 0; i < line.vertices.length; i++) {
      path += ` L ${ line.vertices[i].x } ${ line.vertices[i].y }`
    }
    return path
  }

  static getArcPath(arc: TEdgeArc): string
  {
    let path = `M ${ arc.vertices[0].x } ${ arc.vertices[0].y } Q`
    for (let i = 0; i < arc.vertices.length; i++) {
      path += ` ${ arc.vertices[i].x } ${ arc.vertices[i].y }`
    }
    return path
  }

  static getSVGPath(edge: TEdge): string
  {
    switch (edge.kind) {
      case EdgeKind.Line:
        return SVGRendererEdgeUtil.getLinePath(edge as TEdgeLine)
      case EdgeKind.PolyEdge:
        return SVGRendererEdgeUtil.getPolyLinePath(edge as TEdgePolyLine)
      case EdgeKind.Arc:
        return SVGRendererEdgeUtil.getArcPath(edge as TEdgeArc)
      default:
        throw new Error(`Can't getSVGPath for edge cause kind is unknown: "${ JSON.stringify(edge) }"`)
    }
  }

  static getSVGElement(edge: TEdge): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": edge.id,
      "type": edge.type,
      "kind": edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }

    if (edge.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }
    const group = SVGBuilder.createGroup(attrs)

    if (edge.selected) {
      const outlineAttrs: { [key: string]: string } = {
        "fill": "transparent",
        "stroke": "#3e68ff",
        "stroke-width": ((edge.style.width || DefaultStyle.width) + 3).toString(),
        "d": SVGRendererEdgeUtil.getSVGPath(edge),
        "vector-effect": "non-scaling-stroke",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }
      group.appendChild(SVGBuilder.createPath(outlineAttrs))
    }

    const pathAttrs: { [key: string]: string } = {
      "fill": "transparent",
      "stroke": edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      "d": SVGRendererEdgeUtil.getSVGPath(edge),
    }
    if (edge.style.opacity) {
      pathAttrs["opacity"] = edge.style.opacity.toString()
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-start"] = `url(#${ SVGRendererConst.arrowHeadStartMarker })`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      pathAttrs["marker-end"] = `url(#${ SVGRendererConst.arrowHeadEndMaker })`
    }
    group.appendChild(SVGBuilder.createPath(pathAttrs))
    return group
  }
}
