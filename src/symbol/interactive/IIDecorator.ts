import { createUUID, PartialDeep } from "@/utils"
import { DefaultStyle, TStyle } from "@/style"
import { Box, TBox } from "@/symbol/base/Box"
import { TPoint } from "@/symbol/base/Point"
import { SymbolType } from "@/symbol/base/Symbol"
import { IISymbolBase } from "./IISymbolBase"

/**
 * @group Symbol
 */
export enum DecoratorKind
{
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * Standalone decorator symbol that references the strokes or text it decorates.
 * When standalone (in model.symbols): targetIds contains the referenced stroke IDs
 * and bounds is the word-level bounding box.
 * When embedded (in IIText.decorators[]): targetIds is empty and bounds is unset
 * (the parent symbol's bounds are used at render time).
 * @group Symbol
 */
export class IIDecorator extends IISymbolBase<SymbolType.Decorator>
{
  readonly isClosed = false

  kind: DecoratorKind
  targetIds: string[]
  baseline?: number
  xHeight?: number

  #bounds?: Box
  #hasExplicitBounds = false

  constructor(kind: DecoratorKind, style: PartialDeep<TStyle>, targetIds: string[] = [], bounds?: Box)
  {
    super(SymbolType.Decorator, style)
    this.kind = kind
    this.targetIds = targetIds
    this.id = `${ kind }-${ createUUID() }`
    if (bounds) this.bounds = bounds
  }

  get bounds(): Box
  {
    return this.#bounds || new Box({ x: 0, y: 0, width: 0, height: 0 })
  }

  set bounds(b: Box)
  {
    this.#bounds = b
    this.#hasExplicitBounds = true
  }

  get hasBounds(): boolean
  {
    return this.#hasExplicitBounds
  }

  get vertices(): TPoint[]
  {
    if (!this.#bounds) return []
    const b = this.#bounds
    return [
      { x: b.xMin, y: b.yMid },
      { x: b.xMax, y: b.yMid }
    ]
  }

  get snapPoints(): TPoint[]
  {
    return this.vertices
  }

  overlaps(box: TBox): boolean
  {
    return this.#bounds ? Box.overlaps(this.#bounds, box) : false
  }

  clone(): IIDecorator
  {
    const c = new IIDecorator(
      this.kind,
      structuredClone(this.style),
      [...this.targetIds],
      this.#bounds ? new Box(this.#bounds) : undefined
    )
    c.id = this.id
    c.creationTime = this.creationTime
    c.modificationDate = this.modificationDate
    c.selected = this.selected
    c.deleting = this.deleting
    c.baseline = this.baseline
    c.xHeight = this.xHeight
    return c
  }

  toJSON(): PartialDeep<IIDecorator>
  {
    return {
      id: this.id,
      kind: this.kind,
      style: this.style,
      targetIds: this.targetIds.length ? this.targetIds : undefined,
      baseline: this.baseline,
      xHeight: this.xHeight,
      bounds: this.#hasExplicitBounds
        ? { x: this.#bounds!.x, y: this.#bounds!.y, width: this.#bounds!.width, height: this.#bounds!.height }
        : undefined
    } as PartialDeep<IIDecorator>
  }

  static create(partial: PartialDeep<IIDecorator>): IIDecorator
  {
    if (!partial.kind) throw new Error("IIDecorator.create: missing kind")
    const dec = new IIDecorator(
      partial.kind,
      partial.style || DefaultStyle,
      (partial.targetIds || []).filter((id): id is string => !!id),
      partial.bounds ? new Box(partial.bounds as TBox) : undefined
    )
    if (partial.id) dec.id = partial.id
    if (partial.baseline !== undefined) dec.baseline = partial.baseline
    if (partial.xHeight !== undefined) dec.xHeight = partial.xHeight
    return dec
  }
}
