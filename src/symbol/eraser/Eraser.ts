import { createUUID } from "@/utils"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import { SymbolType } from "@/symbol/Symbol"
import type { TPointer } from "@/symbol/primitives/Point"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"

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
 */
export const EraserOps = {
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
    return BoxOps.createFromPoints(eraser.pointers)
  },
}
