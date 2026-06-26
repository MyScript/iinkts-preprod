import type { TPartialDeep} from "@/utils";
import { createUUID, findIntersectionBetween2Segment, isPointInsidePolygon, convertDegreeToRadian, computeRotatedPoint } from "@/utils"
import type { TStyle } from "@/style";
import { DefaultStyle } from "@/style"
import type { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import type { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { computeTypesetVertices, computeTypesetSnapPoints, computeClosedEdges } from "./_typesetDerivedFields"
import type { TRotation } from "@/symbol/interactive/IITypeset"
import { IIDecoratorHelper } from "./IIDecoratorHelper"
import type { TSymbolChar, TText } from "@/symbol/interactive/IIText"
import { isValidPoint } from "@/symbol/base/Point"

/**
 * @group Symbol
 */
export const IITextHelper = {
  create(chars: TSymbolChar[], point: TPoint, bounds: TBox, style?: TPartialDeep<TStyle>): TText
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const vertices = computeTypesetVertices(bounds)
    const snapPoints = computeTypesetSnapPoints(bounds, point)
    const edges = computeClosedEdges(vertices)
    return {
      type: SymbolType.Text,
      id: `${ SymbolType.Text }-${ createUUID() }`,
      isClosed: true,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      point,
      chars,
      decorators: [],
      bounds,
      rotation: undefined,
      vertices,
      snapPoints,
      edges,
    }
  },

  createFromPartial(partial: TPartialDeep<TText>): TText
  {
    if (!isValidPoint(partial?.point)) throw new Error(`Unable to create a IIText, point are invalid`)
    if (!partial.chars?.length) throw new Error(`Unable to create a IIText, no chars`)
    if (!partial.bounds) throw new Error(`Unable to create a IIText, no boundingBox`)
    const text = IITextHelper.create(partial.chars as TSymbolChar[], partial.point as TPoint, partial.bounds as TBox, partial.style)
    if (partial.id) text.id = partial.id
    if (partial.rotation) text.rotation = partial.rotation as TRotation
    if (partial.decorators?.length) {
      partial.decorators.forEach(d => {
        if (d?.kind) {
          text.decorators.push(IIDecoratorHelper.create(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    IITextHelper.updateDerivedFields(text)
    return text
  },

  updateDerivedFields(text: TText): void
  {
    text.vertices = computeTypesetVertices(text.bounds, text.rotation)
    text.snapPoints = computeTypesetSnapPoints(text.bounds, text.point, text.rotation)
    text.edges = computeClosedEdges(text.vertices)
  },

  overlaps(text: TText, box: TBox): boolean
  {
    return text.vertices.some(p => BoxHelper.containsPoint(box, p)) ||
      text.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },

  getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[]
  {
    return text.chars.filter(c =>
    {
      let corners: TPoint[]
      if (text.rotation) {
        const rad = convertDegreeToRadian(-text.rotation.degree)
        corners = BoxHelper.getCorners(c.bounds).map(p => computeRotatedPoint(p, text.rotation!.center, rad))
      }
      else {
        corners = BoxHelper.getCorners(c.bounds)
      }
      return points.some(p => isPointInsidePolygon(p, corners))
    })
  },

  updateChildrenStyle(text: TText): void
  {
    text.chars.forEach(c =>
    {
      if (text.style.color) {
        c.color = text.style.color
      }
    })
    text.modificationDate = Date.now()
  },

  updateChildrenFont(text: TText, { fontSize, fontWeight }: { fontSize?: number, fontWeight?: "normal" | "bold" }): void
  {
    text.chars.forEach(c =>
    {
      if (fontSize) c.fontSize = fontSize
      if (fontWeight) c.fontWeight = fontWeight
    })
    text.modificationDate = Date.now()
  },

  getLabel(text: TText): string
  {
    return text.chars.map(c => c.label).join("")
  },

  toJSON(text: TText): TPartialDeep<TText>
  {
    return {
      id: text.id,
      type: text.type,
      point: text.point,
      chars: text.chars,
      style: text.style,
      rotation: text.rotation,
      bounds: text.bounds,
      decorators: text.decorators.length ? text.decorators : undefined
    }
  },
}

/**
 * @internal Keep backward-compat alias used in a few menus/decorators that
 * reference the type as `IIText`. Downstream code that only uses the type
 * (not `new IIText(…)`) continues to compile transparently.
 * @deprecated Use `TText` instead.
 */
