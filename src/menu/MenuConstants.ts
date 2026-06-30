/**
 * @group Menu
 * @remarks Constants shared across menu components
 */

/**
 * @group Menu
 * @remarks Default color palette available in menus
 */
export const DEFAULT_MENU_COLORS = [
  "#000000",
  "#808080",
  "#ffffff",
  "transparent",
  "#ff0000",
  "#ff6400",
  "#ffc800",
  "#ffff00",
  "#0000ff",
  "#0064ff",
  "#00c8ff",
  "#00ffff",
  "#008000",
  "#00af00",
  "#00e100",
  "#00ff00",
]

/**
 * @group Menu
 * @remarks Default thickness values for stroke styling
 */
export const DEFAULT_THICKNESS_LIST = [
  { label: "S", value: 1 },
  { label: "M", value: 2 },
  { label: "L", value: 4 },
  { label: "XL", value: 8 },
]

/**
 * @group Menu
 * @remarks Default eraser size values (diameter in px)
 */
export const DEFAULT_ERASER_SIZE_LIST = [
  { label: "S", value: 5 },
  { label: "M", value: 10 },
  { label: "L", value: 20 },
  { label: "XL", value: 40 },
]

/**
 * @group Menu
 * @remarks Default font size values
 */
export const DEFAULT_FONT_SIZE_LIST: {
  label: string
  value: "auto" | number
}[] = [
  { label: "Auto", value: "auto" },
  { label: "S", value: 0.5 },
  { label: "M", value: 0.75 },
  { label: "L", value: 1 },
]

/**
 * @group Menu
 * @remarks Default font weight values
 */
export const DEFAULT_FONT_WEIGHT_LIST: {
  label: string
  value: "auto" | "normal" | "bold"
}[] = [
  { label: "Auto", value: "auto" },
  { label: "Normal", value: "normal" },
  { label: "Bold", value: "bold" },
]
