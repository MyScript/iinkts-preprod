import type { TPoint } from "@/core"

import type { TBaseSymbol, TSymbolOfKind, TSymbolTagged } from "../Symbol"
import { SymbolType } from "../Symbol"

/**
 * A picture placed on the canvas: shown, moved, resized, rotated and drawn over, never sent to the
 * recognizer.
 *
 * The bytes travel with the symbol, as a `data:` URL, so undo, copy, session files and exports need
 * nothing else to bring the picture back — and a later image recognition reads them from here.
 * @group Symbol
 */
export type TImage = TBaseSymbol & {
  readonly type: SymbolType.Image
  /** The picture, as a `data:image/png` or `data:image/jpeg` URL */
  src: string
  /** Top-left corner of the picture, before `transform` */
  point: TPoint
  width: number
  height: number
}

/**
 * @group Symbol
 * @summary Check if symbol is an image
 */
export function isImage<T extends TSymbolTagged>(symbol: T): symbol is TSymbolOfKind<T, TImage> {
  return symbol.type === SymbolType.Image
}
