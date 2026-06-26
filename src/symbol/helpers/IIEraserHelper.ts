import { createUUID } from "@/utils"
import { DefaultStyle } from "@/style"
import { SymbolType } from "@/symbol/base/Symbol"
import { TBox } from "@/symbol/base/Box"
import { BoxHelper } from "./BoxHelper"
import type { TEraser } from "@/symbol/interactive/IIEraser"

export const IIEraserHelper = {
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
