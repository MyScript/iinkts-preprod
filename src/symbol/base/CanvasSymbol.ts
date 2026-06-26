import type { TPoint } from "./Point"
import type { TBaseSymbol } from "./Symbol"

/**
 * @group Symbol
 */
export type TCanvasShapeEllipseSymbol = TBaseSymbol & {
  centerPoint: TPoint
  maxRadius: number
  minRadius: number
  orientation: number
  startAngle: number
  sweepAngle: number
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

/**
 * @group Symbol
 */
export type TCanvasShapeLineSymbol = TBaseSymbol & {
  firstPoint: TPoint
  lastPoint: TPoint
  beginDecoration?: string
  endDecoration?: string
  beginTangentAngle: number
  endTangentAngle: number
}

/**
 * @group Symbol
 */
export type TCanvasShapeTableLineSymbol = {
  p1: TPoint
  p2: TPoint
}

/**
 * @group Symbol
 */
export type TCanvasShapeTableSymbol = TBaseSymbol & {
  lines: TCanvasShapeTableLineSymbol[]
}

/**
 * @group Symbol
 */
export type TCanvasUnderLineSymbol = TBaseSymbol & {
  data: {
    firstCharacter: number
    lastCharacter: number
  }
}

/**
 * @group Symbol
 */
export type TCanvasTextSymbol = TBaseSymbol & {
  label: string,
  data: {
    topLeftPoint: TPoint
    height: number
    width: number
    textHeight: number
    justificationType: string
  }
}

/**
 * @group Symbol
 */
export type TCanvasTextUnderlineSymbol = TCanvasTextSymbol & {
  underlineList: TCanvasUnderLineSymbol[]
}
