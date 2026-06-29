import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TDecorator } from "@/symbol/decorator/Decorator"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import { isValidPoint } from "@/symbol/primitives/Point"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TRotation } from "@/symbol/typeset/Typeset"
import type { TTypesetChild } from "@/symbol/typeset/Typeset"
import { computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/symbol/typeset/Typeset"
import type { TPartialDeep } from "@/utils"
import {
  computeRotatedPoint,
  convertDegreeToRadian,
  createUUID,
  findIntersectionBetween2Segment,
  isPointInsidePolygon,
} from "@/utils"

/**
 * @group Symbol
 */
export type TSymbolChar = TTypesetChild

/**
 * @group Symbol
 */
export type TText = TBaseSymbol & {
  type: SymbolType.Text
  style: TStyle
  point: TPoint
  chars: TSymbolChar[]
  decorators: TDecorator[]
  bounds: TOBB
  rotation?: TRotation
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 * @summary Check if symbol is text
 * @param symbol - Symbol to check
 * @returns True if symbol is text
 */
export function isText(symbol: TBaseSymbol): symbol is TText {
  return symbol.type === SymbolType.Text
}

/**
 * @group Symbol
 */
export const TextOps = {
  create(chars: TSymbolChar[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TText {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const vertices = computeTypesetVertices(boundsBox)
    const snapPoints = computeTypesetSnapPoints(boundsBox, point)
    const edges = computeClosedEdges(vertices)
    return {
      type: SymbolType.Text,
      id: `${SymbolType.Text}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      point,
      chars,
      decorators: [],
      bounds: OBBOps.fromBox(boundsBox),
      rotation: undefined,
      vertices,
      snapPoints,
      edges,
    }
  },

  createFromPartial(partial: TPartialDeep<TText>): TText {
    if (!isValidPoint(partial?.point)) {
      throw new Error(`Unable to create TText, point are invalid`)
    }
    if (!partial.chars?.length) {
      throw new Error(`Unable to create TText, no chars`)
    }
    if (!partial.bounds) {
      throw new Error(`Unable to create TText, no boundingBox`)
    }
    const rawBounds = partial.bounds as unknown
    const boundsBox: TBox =
      rawBounds && typeof rawBounds === "object" && "center" in rawBounds
        ? OBBOps.toBox(rawBounds as TOBB)
        : (rawBounds as TBox)
    const text = TextOps.create(partial.chars as TSymbolChar[], partial.point as TPoint, boundsBox, partial.style)
    if (partial.id) {
      text.id = partial.id
    }
    if (partial.rotation) {
      text.rotation = partial.rotation as TRotation
    }
    if (partial.decorators?.length) {
      partial.decorators.forEach((d) => {
        if (d?.kind) {
          text.decorators.push(DecoratorOps.create(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    TextOps.updateDerivedFields(text)
    return text
  },

  updateDerivedFields(text: TText): void {
    const boundsBox = OBBOps.toBox(text.bounds)
    text.vertices = computeTypesetVertices(boundsBox, text.rotation)
    text.snapPoints = computeTypesetSnapPoints(boundsBox, text.point, text.rotation)
    text.edges = computeClosedEdges(text.vertices)
  },

  overlaps(text: TText, box: TBox): boolean {
    return (
      text.vertices.some((p) => BoxOps.containsPoint(box, p)) ||
      text.edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
    )
  },

  getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[] {
    return text.chars.filter((c) => {
      let corners: TPoint[]
      if (text.rotation) {
        const rad = convertDegreeToRadian(-text.rotation.degree)
        corners = BoxOps.getCorners(c.bounds).map((p) => computeRotatedPoint(p, text.rotation!.center, rad))
      } else {
        corners = BoxOps.getCorners(c.bounds)
      }
      return points.some((p) => isPointInsidePolygon(p, corners))
    })
  },

  updateChildrenStyle(text: TText): void {
    text.chars.forEach((c) => {
      if (text.style.color) {
        c.color = text.style.color
      }
    })
    text.modificationDate = Date.now()
  },

  updateChildrenFont(
    text: TText,
    {
      fontSize,
      fontWeight,
    }: {
      fontSize?: number
      fontWeight?: "normal" | "bold"
    }
  ): void {
    text.chars.forEach((c) => {
      if (fontSize) {
        c.fontSize = fontSize
      }
      if (fontWeight) {
        c.fontWeight = fontWeight
      }
    })
    text.modificationDate = Date.now()
  },

  getLabel(text: TText): string {
    return text.chars.map((c) => c.label).join("")
  },

  toJSON(text: TText): TPartialDeep<TText> {
    return {
      id: text.id,
      type: text.type,
      point: text.point,
      chars: text.chars,
      style: text.style,
      rotation: text.rotation,
      bounds: OBBOps.toBox(text.bounds),
      decorators: text.decorators.length ? text.decorators : undefined,
    }
  },
}
