/**
 * @group Menu
 * @remarks Configuration to enable/disable each action menu individually
 */
export interface IIMenuActionConfig {
  /** Enable/disable Clear menu */
  clear?: boolean
  /** Enable/disable Language menu */
  language?: boolean
  /** Enable/disable Undo/Redo menus */
  undoRedo?: boolean
  /** Enable/disable Zoom menus */
  zoom?: boolean
  /** Enable/disable Convert menu */
  convert?: boolean
  /** Enable/disable Gesture submenu */
  gesture?: boolean
  /** Enable/disable Guide submenu */
  guide?: boolean
  /** Enable/disable Snap submenu */
  snap?: boolean
  /** Enable/disable Math Dependencies submenu */
  math?: boolean
  /** Enable/disable Overlay configuration submenu */
  overlay?: boolean
  /** Enable/disable Selection submenu */
  selection?: boolean
  /** Enable/disable Export submenu */
  export?: boolean
  /** Enable/disable Import submenu */
  import?: boolean
}

/**
 * Default configuration with all menus enabled
 * @group Menu
 */
export const defaultMenuActionConfig: Required<IIMenuActionConfig> = {
  clear: true,
  language: true,
  undoRedo: true,
  zoom: true,
  convert: true,
  gesture: true,
  guide: true,
  snap: true,
  math: true,
  overlay: true,
  selection: true,
  export: true,
  import: true
}
