/**
 * @group Menu
 * @remarks Configuration to enable/disable each tool individually
 */
export interface IIMenuToolConfig {
  /** Enable/disable Write tool (Pencil) */
  write?: boolean
  /** Enable/disable Move tool (Hand) */
  move?: boolean
  /** Enable/disable Select tool (Cursor) */
  select?: boolean
  /** Enable/disable Erase tool */
  erase?: boolean
  /** Enable/disable Shape submenu (Rectangle, Circle, etc.) */
  shape?: boolean
  /** Enable/disable Edge submenu (Line, Arrow, etc.) */
  edge?: boolean
}

/**
 * @group Menu
 * @remarks Default configuration with all tools enabled
 */
export const defaultMenuToolConfig: Required<IIMenuToolConfig> = {
  write: true,
  move: true,
  select: true,
  erase: true,
  shape: true,
  edge: true
}
