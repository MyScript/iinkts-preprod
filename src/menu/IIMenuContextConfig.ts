/**
 * @group Menu
 * @remarks Configuration to enable/disable each context menu individually
 */
export interface IIMenuContextConfig {
  /** Enable/disable Edit menu */
  edit?: boolean
  /** Enable/disable Decorator menu */
  decorator?: boolean
  /** Enable/disable Reorder menu */
  reorder?: boolean
  /** Enable/disable Export menu */
  export?: boolean
  /** Enable/disable Convert menu */
  convert?: boolean
  /** Enable/disable Math menu */
  math?: boolean
  /** Enable/disable Group menu */
  group?: boolean
  /** Enable/disable Duplicate menu */
  duplicate?: boolean
  /** Enable/disable Remove menu */
  remove?: boolean
  /** Enable/disable Select All menu */
  selectAll?: boolean
}

/**
 * @group Menu
 * @remarks Default configuration with all menus enabled
 */
export const defaultMenuContextConfig: Required<IIMenuContextConfig> = {
  edit: true,
  decorator: true,
  reorder: true,
  export: true,
  convert: true,
  math: true,
  group: true,
  duplicate: true,
  remove: true,
  selectAll: true
}
