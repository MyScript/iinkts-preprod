import type { TMatrixTransform, TPartialDeep, TPoint } from "@/core"
import type { TStyle } from "@/style"

import type { TDecorator } from "./decorator/Decorator"
import type { TEdge } from "./edge/Edge"
import type { TImage } from "./image/Image"
import type { TShape } from "./shape/Shape"
import type { TStroke } from "./stroke/Stroke"
import type { TMath } from "./typeset/Math"
import type { TText } from "./typeset/Text"

/**
 * @group Symbol
 */
export enum SymbolType {
  Stroke = "stroke",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Math = "math",
  Eraser = "eraser",
  Decorator = "decorator",
  Image = "image",
}

/**
 * A handle a symbol offers for vertex-level resizing, and which of its vertices the handle moves.
 *
 * The shape was written out inline in four places before IIC-2009.
 *
 * @group Symbol
 */
export type TResizePoint = { point: TPoint; vertexIndex: number }

/**
 * @group Symbol
 */
export type TBaseSymbol = {
  id: string
  creationTime: number
  modificationDate: number
  type: string
  style: TPartialDeep<TStyle>
  /**
   * Where this symbol sits, relative to the coordinates it stores.
   *
   * A transform writes here and nowhere else: the raw coordinates are what the symbol was created
   * with and never move again. That is what lets the renderer apply a change by rewriting one
   * attribute instead of rebuilding the element, and what keeps undo exact — re-applying an inverse
   * matrix restores the value bit for bit, where re-transforming coordinates accumulated rounding.
   */
  transform: TMatrixTransform
  /**
   * A locked symbol can be selected, copied and exported, but nothing changes it: no move, resize,
   * rotation, erase, conversion or restyle, whether the user or the API asks. `clear()` keeps it.
   * Set it with `lockSymbols` / `unlockSymbols`. Absent means unlocked.
   */
  locked?: boolean
}

/**
 * @group Symbol
 */
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator | TImage

/**
 * What a symbol type guard narrows `T` to: the members of `T` carrying the variant's discriminants.
 *
 * Matching on the discriminants alone, not on the whole variant, is what keeps a read-only symbol
 * read-only once narrowed: a `TReadonlyDeep<TStroke>` is not assignable to `TStroke` (its arrays are
 * read-only), so extracting on `TStroke` would find nothing. When `T` holds no such member (a
 * `TBaseSymbol`, whose `type` is a plain string), the guard narrows to `T & TVariant`.
 * @group Symbol
 */
export type TSymbolOfKind<T, TVariant extends TSymbolTagged, TTag = Pick<TVariant, "type">> = [
  Extract<T, TTag>,
] extends [never]
  ? T & TVariant
  : Extract<T, TTag>

/**
 * The least a value needs for a symbol type guard to accept it, read-only symbols included.
 * @group Symbol
 */
export type TSymbolTagged = { readonly type: string }
