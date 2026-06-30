import type { TPenStyle } from "./PenStyle"

/**
 * @group Styles
 */
export type TThemeMath = {
  "font-family": string
}

/**
 * @group Styles
 */
export type TThemeMathSolved = {
  "font-family": string
  color: string
}

/**
 * @group Styles
 */
export type TThemeText = {
  "font-family": string
  "font-size": number
}

/**
 * @group Styles
 */
export type TTheme = {
  ink: TPenStyle
  ".math": TThemeMath
  ".math-solved": TThemeMathSolved
  ".text": TThemeText
  [key: string]: unknown
}

/**
 * @group Styles
 * @source
 */
export const DefaultTheme: TTheme = {
  ink: {
    color: "#000000",
    width: 1,
    "-myscript-pen-width": 1,
    "-myscript-pen-fill-style": "none",
    "-myscript-pen-fill-color": "#FFFFFF00",
  },
  ".math": {
    "font-family": "STIXGeneral",
  },
  ".math-solved": {
    "font-family": "STIXGeneral",
    color: "#A8A8A8FF",
  },
  ".text": {
    "font-family": "MyScriptInter",
    "font-size": 10,
  },
}
