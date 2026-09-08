import type { TBox } from "@/core/geometry"
import type { TPoint, TSegment } from "@/core/geometry"
import { MatrixTransform, mergeSymbolTransform, OBBOps, type TOBB } from "@/core/geometry"
import { isValidPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import type { TStyle } from "@/style"
import { mergeSymbolStyle } from "@/style"
import type { TDecorator } from "@/symbol/decorator/Decorator"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TTypesetChild } from "@/symbol/typeset/Typeset"
import {
  computeChildrenOverlaps,
  computeClosedEdges,
  computeTypesetSnapPoints,
  computeTypesetVertices,
  typesetOverlapsBox,
} from "@/symbol/typeset/Typeset"
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
    const mergedStyle = mergeSymbolStyle(style)
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
      vertices,
      snapPoints,
      edges,
      transform: MatrixTransform.identity(),
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
    text.transform = mergeSymbolTransform(partial.transform)
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
    // Unrotated, not `toBox`: turning a text symbol is composing its matrix now, so its own bounds
    // stay axis-aligned and `SymbolGeometry` applies the angle on top.
    const boundsBox = OBBOps.toUnrotatedBox(text.bounds)
    text.vertices = computeTypesetVertices(boundsBox)
    text.snapPoints = computeTypesetSnapPoints(boundsBox, text.point)
    text.edges = computeClosedEdges(text.vertices)
  },

  overlaps(text: TText, box: TBox): boolean {
    return typesetOverlapsBox(text.vertices, text.edges, box)
  },

  getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[] {
    return computeChildrenOverlaps(text.chars, points)
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
      bounds: OBBOps.toBox(text.bounds),
      decorators: text.decorators.length ? text.decorators : undefined,
    }
  },
}
