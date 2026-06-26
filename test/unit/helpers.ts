import
{
  DefaultPenStyle,
  DefaultStyle,
  TBox,
  TStyle,
  Stroke,
  TStroke,
  IIStrokeHelper,
  TDecorator,
  TShapeCircle,
  TEdgeLine,
  TText,
  TSymbolChar,
  TPoint,
  DecoratorKind,
  TEraser,
  IIEraserHelper,
  TMath,
  TMathElement,
  PartialDeep,
} from "../../src/iink"
import { IIDecoratorHelper } from "../../src/symbol/helpers/IIDecoratorHelper"
import { IITextHelper } from "../../src/symbol/helpers/IITextHelper"
import { IIMathHelper } from "../../src/symbol/helpers/IIMathHelper"
import { IIShapeCircleHelper } from "../../src/symbol/helpers/IIShapeCircleHelper"
import { IIEdgeLineHelper } from "../../src/symbol/helpers/IIEdgeLineHelper"

export const delay = (delayInms: number) =>
{
  return new Promise(resolve => setTimeout(resolve, delayInms))
}

export function round(n: number, digit = 2)
{
  return Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)
}

export function randomIntFromInterval(min: number, max: number): number
{
  return Math.floor(Math.random() * (max - min) + min)
}

const defaultBox: TBox = { height: 10, width: 10, x: 1, y: 1 }

export function buildStroke({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5, pointerType = "pen" } = {}): Stroke
{
  const stroke = new Stroke(style, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      t: Date.now() + i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}

export function buildStrokeV2({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5, pointerType = "pen" } = {}): TStroke
{
  const stroke = IIStrokeHelper.create(style, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      t: Date.now() + i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}

export function buildIIStroke({ box = defaultBox, style = DefaultStyle, nbPoint = 5, pointerType = "pen" } = {}): TStroke
{
  const stroke = IIStrokeHelper.create(style, pointerType)
  const stepX = box.width / (nbPoint - 1)
  const stepY = box.height / (nbPoint - 1)
  for (let i = 0; i < nbPoint; i++) {
    IIStrokeHelper.addPointer(stroke, {
      p: Math.random(),
      t: Date.now() + i,
      x: box.x + stepX * i,
      y: box.y + stepY * i,
    })
  }
  return stroke
}

export function buildIIEraser({ box = defaultBox, nbPoint = 5 } = {}): TEraser
{
  const eraser = IIEraserHelper.create()
  const stepX = box.width / (nbPoint - 1)
  const stepY = box.height / (nbPoint - 1)
  for (let i = 0; i < nbPoint; i++) {
    eraser.pointers.push({
      p: Math.random(),
      t: Date.now() + i,
      x: box.x + stepX * i,
      y: box.y + stepY * i,
    })
  }
  return eraser
}

export function buildIIDecorator(kind: DecoratorKind, style: PartialDeep<TStyle> = DefaultStyle): TDecorator
{
  return IIDecoratorHelper.create(kind, style)
}

export function buildIICircle({ center = { x: 0, y: 0 }, radius = 5, style = DefaultStyle }: { center?: TPoint, radius?: number, style?: PartialDeep<TStyle> } = {}): TShapeCircle
{
  return IIShapeCircleHelper.create(center, radius, style)
}

export function buildIILine({ start = { x: 0, y: 0 }, end = { x: 5, y: 5 }, style = DefaultStyle }: { start?: TPoint, end?: TPoint, style?: PartialDeep<TStyle> } = {}): TEdgeLine
{
  return IIEdgeLineHelper.create(start, end, undefined, undefined, style)
}

export function buildIIText(
  { chars = [], point = { x: 0, y: 0 }, boundingBox = { x: 0, y: 10, width: 20, height: 30 }, style = DefaultStyle }:
    { chars?: TSymbolChar[], point?: TPoint, boundingBox?: TBox, style?: PartialDeep<TStyle> } = {}
): TText
{
  return IITextHelper.create(chars, point, boundingBox, style)
}

export function buildIIMath(
  label: string = "y=3x+2",
  { point = { x: 0, y: 0 }, boundingBox = { x: 0, y: 10, width: 50, height: 30 }, style = DefaultStyle }:
    { point?: TPoint, boundingBox?: TBox, style?: PartialDeep<TStyle> } = {}
): TMath
{
  const elements: TMathElement[] = [{
    id: "math-elem-1",
    label,
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: boundingBox
  }]
  return IIMathHelper.create(elements, point, boundingBox, style)
}
