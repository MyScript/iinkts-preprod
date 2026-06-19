
import { DEFAULT_MENU_COLORS, DEFAULT_THICKNESS_LIST, DEFAULT_FONT_SIZE_LIST, DEFAULT_FONT_WEIGHT_LIST } from "./MenuConstants"
import type { IIMenuStyleConfig } from "./IIMenuStyle"
import type { IIMenuToolConfig } from "./IIMenuTool"
import type { IIMenuActionConfig } from "./IIMenuAction"
import type { IIMenuContextConfig } from "./IIMenuContext"

/**
 * @group Menu
 */
export type TMenuConfiguration = {
  enable: boolean,
  style: IIMenuStyleConfig & { enable: boolean }
  tool: IIMenuToolConfig & { enable: boolean }
  action: IIMenuActionConfig & { enable: boolean }
  context: IIMenuContextConfig & { enable: boolean }
}

/**
 * @group Menu
 * @source
 */
export const DefaultMenuConfiguration: TMenuConfiguration = {
  enable: true,
  style: {
    enable: true,
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
  },
  tool: {
    enable: true,
    write: true,
    move: true,
    select: true,
    erase: true,
    shape: true,
    edge: true
  },
  action: {
    enable: true,
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
    import: true,
    minimap: true
  },
  context: {
    enable: true,
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
  },
}
