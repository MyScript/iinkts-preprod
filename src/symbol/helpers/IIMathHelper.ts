import { PartialDeep, createUUID, findIntersectionBetween2Segment, isPointInsidePolygon, convertDegreeToRadian, computeRotatedPoint } from "@/utils"
import { DefaultStyle, TStyle } from "@/style"
import { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import { computeTypesetVertices, computeTypesetSnapPoints, computeClosedEdges } from "./_typesetDerivedFields"
import { TRotation } from "@/symbol/interactive/IITypeset"
import { IIDecoratorHelper } from "./IIDecoratorHelper"
import { TMath, TMathElement } from "@/symbol/interactive/IIMath"

/**
 * @group Symbol
 */
export const IIMathHelper = {
  create(elements: TMathElement[], point: TPoint, bounds: TBox, style?: PartialDeep<TStyle>): TMath
  {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) mergedStyle.opacity = +mergedStyle.opacity
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const vertices = computeTypesetVertices(bounds)
    const snapPoints = computeTypesetSnapPoints(bounds, point)
    const edges = computeClosedEdges(vertices)
    return {
      type: SymbolType.Math,
      id: `${ SymbolType.Math }-${ createUUID() }`,
      isClosed: true,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      selected: false,
      deleting: false,
      point,
      elements,
      decorators: [],
      bounds,
      rotation: undefined,
      vertices,
      snapPoints,
      edges,
    }
  },

  createFromPartial(partial: PartialDeep<TMath>): TMath
  {
    if (!partial.elements?.length) throw new Error(`IIMath requires elements`)
    if (!partial.point) throw new Error(`IIMath requires point`)
    if (!partial.bounds) throw new Error(`IIMath requires bounds`)

    const elements: TMathElement[] = partial.elements.map(e => ({
      id: e!.id!,
      label: e!.label!,
      fontSize: e!.fontSize!,
      fontWeight: e!.fontWeight! as "normal" | "bold",
      fontFamily: e!.fontFamily!,
      color: e!.color!,
      bounds: {
        x: e!.bounds!.x!,
        y: e!.bounds!.y!,
        width: e!.bounds!.width!,
        height: e!.bounds!.height!
      }
    }))

    const math = IIMathHelper.create(elements, partial.point as TPoint, partial.bounds as TBox, partial.style)
    if (partial.id) math.id = partial.id
    if (partial.rotation) math.rotation = partial.rotation as TRotation
    if (partial.decorators) {
      math.decorators = partial.decorators
        .filter(d => d?.kind && d?.style)
        .map(d => IIDecoratorHelper.create(d!.kind!, d!.style!))
    }
    IIMathHelper.updateDerivedFields(math)
    return math
  },

  updateDerivedFields(math: TMath): void
  {
    math.vertices = computeTypesetVertices(math.bounds, math.rotation)
    math.snapPoints = computeTypesetSnapPoints(math.bounds, math.point, math.rotation)
    math.edges = computeClosedEdges(math.vertices)
  },

  overlaps(math: TMath, box: TBox): boolean
  {
    return math.vertices.some(p => BoxHelper.containsPoint(box, p)) ||
      math.edges.some(e1 => BoxHelper.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  },

  getChildrenOverlaps(math: TMath, points: TPoint[]): TMathElement[]
  {
    return math.elements.filter(e =>
    {
      let corners: TPoint[]
      if (math.rotation) {
        const rad = convertDegreeToRadian(-math.rotation.degree)
        corners = BoxHelper.getCorners(e.bounds).map(p => computeRotatedPoint(p, math.rotation!.center, rad))
      }
      else {
        corners = BoxHelper.getCorners(e.bounds)
      }
      return points.some(p => isPointInsidePolygon(p, corners))
    })
  },

  updateChildrenStyle(math: TMath): void
  {
    math.elements.forEach(e =>
    {
      if (math.style.color) {
        e.color = math.style.color
      }
    })
    math.modificationDate = Date.now()
  },

  updateChildrenFont(math: TMath, { fontSize, fontWeight, fontFamily }: { fontSize?: number, fontWeight?: "normal" | "bold", fontFamily?: string }): void
  {
    math.elements.forEach(e =>
    {
      if (fontSize) e.fontSize = fontSize
      if (fontWeight) e.fontWeight = fontWeight
      if (fontFamily) e.fontFamily = fontFamily
    })
    math.modificationDate = Date.now()
  },

  getLabel(math: TMath): string
  {
    return math.elements.map(e => e.label).join("")
  },

  toJSON(math: TMath): PartialDeep<TMath>
  {
    return {
      id: math.id,
      type: math.type,
      point: math.point,
      elements: math.elements,
      decorators: math.decorators,
      bounds: math.bounds,
      rotation: math.rotation,
      style: math.style
    }
  },
}

/**
 * @internal Keep backward-compat alias.
 * @deprecated Use `TMath` instead.
 */
export type IIMath = TMath
