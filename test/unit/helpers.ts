import
{
  DefaultPenStyle,
  DefaultStyle,
  TBox,
  TStyle,
  Stroke,
  IIStroke,
  IIDecorator,
  IIShapeCircle,
  IIEdgeLine,
  IIText,
  TIISymbolChar,
  TPoint,
  DecoratorKind,
  IIEraser,
  IIRecognizedText,
  IIRecognizedMath,
  IIMath,
  TIIMathElement,
  PartialDeep,
} from "../../src/iink"

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

export function buildStrokeV2({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5, pointerType = "pen" } = {}): IIStroke
{
  const stroke = new IIStroke(style, pointerType)
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

export function buildIIStroke({ box = defaultBox, style = DefaultStyle, nbPoint = 5, pointerType = "pen" } = {}): IIStroke
{
  const stroke = new IIStroke(style, pointerType)
  const stepX = box.width / (nbPoint - 1)
  const stepY = box.height / (nbPoint - 1)
  for (let i = 0; i < nbPoint; i++) {
    stroke.addPointer({
      p: Math.random(),
      t: Date.now() + i,
      x: box.x + stepX * i,
      y: box.y + stepY * i,
    })
  }
  return stroke
}

export function buildIIEraser({ box = defaultBox, nbPoint = 5 } = {}): IIEraser
{
  const eraser = new IIEraser()
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

export function buildIIDecorator(kind: DecoratorKind, style: PartialDeep<TStyle> = DefaultStyle): IIDecorator
{
  return new IIDecorator(kind, style)
}

export function buildIICircle({ center = { x: 0, y: 0 }, radius = 5, style = DefaultStyle }: { center?: TPoint, radius?: number, style?: PartialDeep<TStyle> } = {}): IIShapeCircle
{
  return new IIShapeCircle(center, radius, style)
}

export function buildIILine({ start = { x: 0, y: 0 }, end = { x: 5, y: 5 }, style = DefaultStyle }: { start?: TPoint, end?: TPoint, style?: PartialDeep<TStyle> } = {}): IIEdgeLine
{
  return new IIEdgeLine(start, end, undefined, undefined, style)
}

export function buildIIText(
  { chars = [], point = { x: 0, y: 0 }, boundingBox = { x: 0, y: 10, width: 20, height: 30 }, style = DefaultStyle }:
    { chars?: TIISymbolChar[], point?: TPoint, boundingBox?: TBox, style?: PartialDeep<TStyle> } = {}
): IIText
{
  return new IIText(chars, point, boundingBox, style)
}

export function buildRecognizedText(
  nbStroke: number = 1,
  { baseline, xHeight }: { baseline: number, xHeight: number } = { baseline: 10, xHeight: 10 },
  style?: PartialDeep<TStyle>
): IIRecognizedText
{
  const strokes: IIStroke[] = []
  for (let i = 0; i < nbStroke; i++) {
    strokes.push(buildIIStroke())
  }
  return new IIRecognizedText(strokes, { baseline, xHeight }, style)
}

export function buildRecognizedMath(
  nbStroke: number = 1,
  label: string = "y=3x+2",
  style?: PartialDeep<TStyle>
): IIRecognizedMath
{
  const strokes: IIStroke[] = []
  for (let i = 0; i < nbStroke; i++) {
    strokes.push(buildIIStroke())
  }
  const math = new IIRecognizedMath(strokes, style)
  math.label = label
  return math
}

export function buildIIMath(
  label: string = "y=3x+2",
  { point = { x: 0, y: 0 }, boundingBox = { x: 0, y: 10, width: 50, height: 30 }, style = DefaultStyle }:
    { point?: TPoint, boundingBox?: TBox, style?: PartialDeep<TStyle> } = {}
): IIMath
{
  const elements: TIIMathElement[] = [{
    id: "math-elem-1",
    label,
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: boundingBox
  }]
  return new IIMath(elements, point, boundingBox, style)
}
