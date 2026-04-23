// Colors are now passed through the config, not defined in the menu class
export const customMenuStyleConfig = {
  enable: true,
  strokeColor: true,
  fillColor: true,
  thickness: true,
  fontSize: false, // Disable font size control
  fontWeight: false, // Disable font weight control
  opacity: true,
  // Custom color palette - replaces default colors
  colors: ["#000000", "#ff0000", "#0000ff", "#00af00"],
  // Custom thickness values
  thicknessList: [
    { label: "M", value: 5 },
    { label: "L", value: 10 },
  ]
}

export const customMenuToolConfig = {
  enable: true,
  write: true,
  move: true,
  erase: true,
  select: true,
  shape: false, // Disable shape recognition tool
  edge: false // Disable edge tool
}

export const customMenuActionConfig = {
  enable: true,
  clear: true,
  convert: false, // Disable convert action
  undoRedo: true, // Undo and Redo are controlled together
  zoom: true,
  export: true,
  import: false, // Disable import
  language: false, // Disable language selector
  gesture: true,
  guide: true,
  snap: true,
  debug: false // Disable debug menu
}

/**
 * Usage example:
 *
 * const editor = new InteractiveInkEditor(element, {
 *   menu: {
 *     style: customMenuStyleConfig,
 *     tool: customMenuToolConfig,
 *     action: customMenuActionConfig
 *   }
 * })
 */
