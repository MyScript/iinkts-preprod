import type { TPartialDeep } from "@/core/std"
/**
 * @group Styles
 * @property {String} color=#000000 Color (supported formats rgb() rgba() hsl() hsla() #rgb #rgba #rrggbb #rrggbbaa)
 * @property {String} width in px

 */
export type TStyle = {
  [key: string]: string | number | undefined
  width: number
  color: string
  opacity?: number
  fill?: string
}

/**
 * @group Styles
 * @source
 */
export const DefaultStyle: TStyle = {
  width: 2,
  color: "#000000",
  //   opacity: 1,
  //   fill: "transparent",
} as const

/**
 * Merges a partial style onto {@link DefaultStyle} and coerces `width`/`opacity` to numbers —
 * every symbol type's `create()` did this identically before extraction.
 * @group Styles
 */
export function mergeSymbolStyle(style?: TPartialDeep<TStyle>): TStyle {
  const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
  if (mergedStyle.opacity) {
    mergedStyle.opacity = +mergedStyle.opacity
  }
  mergedStyle.width = +mergedStyle.width
  return mergedStyle
}
