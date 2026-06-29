import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"

import type { BaseMenuItem, TGenericMenuItem } from "./BaseMenuItem"
import { ButtonListMenuItem } from "./ButtonListMenuItem"
import { ButtonMenuItem } from "./ButtonMenuItem"
import { CheckboxMenuItem } from "./CheckboxMenuItem"
import type { TMenuColorList } from "./ColorListMenuItem"
import { ColorListMenuItem } from "./ColorListMenuItem"
import type { TMenuFileInput } from "./FileInputMenuItem"
import { FileInputMenuItem } from "./FileInputMenuItem"
import type { TMenuRange } from "./RangeMenuItem"
import { RangeMenuItem } from "./RangeMenuItem"
import { SelectMenuItem } from "./SelectMenuItem"
import type { TMenuSubMenu, TSubMenuItems } from "./SubMenuItem"
import { SubMenuItem } from "./SubMenuItem"

/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
export type TAllMenuItems = TSubMenuItems | TMenuSubMenu | TMenuColorList | TMenuRange | TMenuFileInput

/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
export function createMenuItemInstance(config: TAllMenuItems, editor: TInteractiveInkEditor): BaseMenuItem {
  switch (config.type) {
    case "button":
      return new ButtonMenuItem(config, editor)
    case "checkbox":
      return new CheckboxMenuItem(config, editor)
    case "select":
      return new SelectMenuItem(config, editor)
    case "buttonlist":
      return new ButtonListMenuItem(config, editor)
    case "submenu":
      return new SubMenuItem(config, editor)
    case "colorlist":
      return new ColorListMenuItem(config, editor)
    case "range":
      return new RangeMenuItem(config, editor)
    case "fileinput":
      return new FileInputMenuItem(config, editor)
    default:
      throw new Error(`Unknown menu item type: ${(config as TGenericMenuItem).type}`)
  }
}
