import { TStyle } from "@/style"
import { PartialDeep } from "@/utils"
import { IIDecorator } from "@/symbol/interactive/IIDecorator"
import { IIRecognizedBase, RecognizedKind } from "./IIRecognizedBase"
import { IIStroke } from "@/symbol/interactive/IIStroke"
import { Box, TBox } from "@/symbol/base/Box"

/**
 * @group Symbol
 */
export type TIIRecognizedWord = {
  label: string
  firstChar?: number
  lastChar?: number
  bounds?: Box
  decorators?: IIDecorator[]
}

/**
 * @group Symbol
 */
export type TIIRecognizedChar = {
  label: string
  word: number  // index du mot auquel appartient ce char
  bounds?: Box
  decorators?: IIDecorator[]
}

/**
 * @group Symbol
 */
export class IIRecognizedText extends IIRecognizedBase<RecognizedKind.Text>
{
  readonly isClosed = false

  decorators: IIDecorator[]

  baseline: number
  xHeight: number
  label?: string

  /** IDs of child elements (e.g., Math elements embedded in text) */
  children?: string[]

  /** Positions where children are inserted in the text */
  childrenPos?: number[]

  /** Words in the text with their decorators */
  words?: TIIRecognizedWord[]

  /** Characters in the text with their decorators */
  chars?: TIIRecognizedChar[]

  constructor(
    strokes: IIStroke[],
    lines: { baseline: number, xHeight: number },
    style?: PartialDeep<TStyle>
  )
  {
    super(RecognizedKind.Text, strokes, style)
    this.baseline = lines.baseline
    this.xHeight = lines.xHeight
    this.decorators = []
  }

  clone(): IIRecognizedText
  {
    const clone = new IIRecognizedText(this.strokes.map(s => s.clone()), { baseline: this.baseline, xHeight: this.xHeight }, structuredClone({ ...this.style }))
    clone.id = this.id
    clone.label = this.label
    clone.jiixId = this.jiixId
    clone.children = this.children ? [...this.children] : undefined
    clone.childrenPos = this.childrenPos ? [...this.childrenPos] : undefined
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    clone.words = this.words ? this.words.map(w => ({
      ...w,
      bounds: w.bounds ? new Box(w.bounds) : undefined,
      decorators: w.decorators?.map(d => d.clone())
    })) : undefined
    clone.chars = this.chars ? this.chars.map(c => ({
      ...c,
      bounds: c.bounds ? new Box(c.bounds) : undefined,
      decorators: c.decorators?.map(d => d.clone())
    })) : undefined
    return clone
  }

  toJSON(): PartialDeep<IIRecognizedText>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      label: this.label,
      jiixId: this.jiixId,
      baseline: this.baseline,
      xHeight: this.xHeight,
      children: this.children,
      childrenPos: this.childrenPos,
      strokes: structuredClone(this.strokes),
      decorators: this.decorators.length ? structuredClone(this.decorators) : undefined,
      words: this.words?.length ? structuredClone(this.words) : undefined,
      chars: this.chars?.length ? structuredClone(this.chars) : undefined
    }
  }

  static create(partial: PartialDeep<IIRecognizedText>): IIRecognizedText
  {
    if (!partial.strokes?.length) {
      throw new Error(`no strokes`)
    }
    const strokes = partial.strokes.map(s => IIStroke.create(s!))
    const line = {
      baseline: partial.baseline || 0,
      xHeight: partial.xHeight || 0
    }
    const ws = new IIRecognizedText(strokes, line, partial.style)

    if (partial.decorators?.length) {
      partial.decorators.forEach(d =>
      {
        if (d?.kind) {
          ws.decorators.push(new IIDecorator(d.kind, Object.assign({}, ws.style, d.style)))
        }
      })
    }
    if (partial.id) {
      ws.id = partial.id
    }
    if (partial.label) {
      ws.label = partial.label
    }
    if (partial.jiixId) {
      ws.jiixId = partial.jiixId
    }
    if (partial.children) {
      ws.children = partial.children.filter((c): c is string => c !== undefined)
    }
    if (partial.childrenPos) {
      ws.childrenPos = partial.childrenPos.filter((c): c is number => c !== undefined)
    }
    if (partial.words?.length) {
      ws.words = partial.words.map(w => ({
        label: w!.label!,
        firstChar: w!.firstChar,
        lastChar: w!.lastChar,
        bounds: w!.bounds ? (w!.bounds instanceof Box ? w!.bounds : new Box(w!.bounds as TBox)) : undefined,
        decorators: w!.decorators?.map(d => new IIDecorator(d!.kind!, d!.style!))
      }))
    }
    if (partial.chars?.length) {
      ws.chars = partial.chars.map(c => ({
        label: c!.label!,
        word: c!.word!,
        bounds: c!.bounds ? (c!.bounds instanceof Box ? c!.bounds : new Box(c!.bounds as TBox)) : undefined,
        decorators: c!.decorators?.map(d => new IIDecorator(d!.kind!, d!.style!))
      }))
    }
    return ws
  }
}
