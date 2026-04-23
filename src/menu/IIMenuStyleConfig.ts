import { DEFAULT_MENU_COLORS, DEFAULT_THICKNESS_LIST, DEFAULT_FONT_SIZE_LIST, DEFAULT_FONT_WEIGHT_LIST } from "./MenuConstants"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each style element individually
 */
export interface IIMenuStyleConfig {
  /** Enable/disable stroke color picker */
  strokeColor?: boolean
  /** Enable/disable fill color picker */
  fillColor?: boolean
  /** Enable/disable stroke thickness picker */
  thickness?: boolean
  /** Enable/disable font size picker */
  fontSize?: boolean
  /** Enable/disable font weight picker */
  fontWeight?: boolean
  /** Enable/disable opacity picker */
  opacity?: boolean
  /** Custom color palette */
  colors?: string[]
  /** Custom thickness list */
  thicknessList?: { label: string, value: number }[]
  /** Custom font size list */
  fontSizeList?: { label: string, value: "auto" | number }[]
  /** Custom font weight list */
  fontWeightList?: { label: string, value: "auto" | "normal" | "bold" }[]
}

/**
 * @group Menu
 * @remarks Default configuration with all styles enabled
 */
export const defaultMenuStyleConfig: Required<IIMenuStyleConfig> = {
  strokeColor: true,
  fillColor: true,
  thickness: true,
  fontSize: true,
  fontWeight: true,
  opacity: true,
  colors: DEFAULT_MENU_COLORS,
  thicknessList: DEFAULT_THICKNESS_LIST,
  fontSizeList: DEFAULT_FONT_SIZE_LIST,
  fontWeightList: DEFAULT_FONT_WEIGHT_LIST
}
