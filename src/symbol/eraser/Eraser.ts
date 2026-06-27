import { createUUID } from "@/utils"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import { SymbolType } from "@/symbol/Symbol"
import type { TPointer } from "@/symbol/primitives/Point"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxHelper } from "@/symbol/primitives/Box"

/**
 * @group Symbol
 */
export type TEraser = {
  id: string
  type: SymbolType.Eraser
  style: TStyle
  pointers: TPointer[]
}

/**
 * @group Symbol
 * @group Utilities
 */
export const EraserHelper = {
  create(width = 5): TEraser
  {
    const style = Object.assign({}, DefaultStyle, { color: "grey", fill: "none", opacity: 0.2, width })
    style.opacity = +style.opacity
    style.width = +style.width
    return {
      type: SymbolType.Eraser,
      id: `${ SymbolType.Eraser }-${ createUUID() }`,
      style,
      pointers: [],
    }
  },

  getBounds(eraser: TEraser): TBox
  {
    return BoxHelper.createFromPoints(eraser.pointers)
  },
}
