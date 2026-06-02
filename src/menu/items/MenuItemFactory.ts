import { InteractiveInkEditor } from "@/editor"
import { BaseMenuItem, TGenericMenuItem } from "./BaseMenuItem"
import { ButtonMenuItem } from "./ButtonMenuItem"
import { CheckboxMenuItem } from "./CheckboxMenuItem"
import { SelectMenuItem } from "./SelectMenuItem"
import { ButtonListMenuItem } from "./ButtonListMenuItem"
import { SubMenuItem, IMenuSubMenu, TSubMenuItems } from "./SubMenuItem"
import { ColorListMenuItem, IMenuColorList } from "./ColorListMenuItem"
import { RangeMenuItem, IMenuRange } from "./RangeMenuItem"
import { FileInputMenuItem, IMenuFileInput } from "./FileInputMenuItem"

/**
 * @group Menu
 * @remarks Type union enriched with all menu item types
 */
export type TAllMenuItems = TSubMenuItems | IMenuSubMenu | IMenuColorList | IMenuRange | IMenuFileInput

/**
 * @group Menu
 * @remarks Factory function to create an instance of the appropriate menu item class
 */
export function createMenuItemInstance(config: TAllMenuItems, editor: InteractiveInkEditor): BaseMenuItem {
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
