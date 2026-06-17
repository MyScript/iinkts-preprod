import { InteractiveInkEditor } from "@/editor"
import { SubMenuItem, IMenuSubMenu } from "@/menu/items/SubMenuItem"
import { IMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import { IMenuRange } from "@/menu/items/RangeMenuItem"
import rectangleIcon from "@/assets/svg/rectangle.svg"

/**
 * @group Menu
 * @remarks Menu action for overlay configuration (block overlays badge/border)
 */
export class OverlayMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const items: (IMenuCheckbox | IMenuRange)[] = [
      {
        type: "checkbox",
        id: `${idPrefix}-overlay-show-block-overlays`,
        label: "Show block overlays",
        getValue: (editor: InteractiveInkEditor) => editor.overlays.getConfig().showBlockOverlays,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.overlays.updateConfig({ showBlockOverlays: value })
        }
      },
      {
        type: "range",
        id: `${idPrefix}-overlay-badge-size`,
        label: "Badge size",
        min: 10,
        max: 40,
        step: 2,
        initValue: editor.overlays.getConfig().badgeSize,
        unit: "px",
        onChange: (value: number, editor: InteractiveInkEditor) => {
          editor.overlays.updateConfig({ badgeSize: value })
        }
      },
      {
        type: "range",
        id: `${idPrefix}-overlay-border-width`,
        label: "Border width",
        min: 1,
        max: 8,
        step: 1,
        initValue: editor.overlays.getConfig().borderWidth,
        unit: "px",
        onChange: (value: number, editor: InteractiveInkEditor) => {
          editor.overlays.updateConfig({ borderWidth: value })
        }
      },
      {
        type: "range",
        id: `${idPrefix}-overlay-label-max-chars`,
        label: "Label max chars",
        min: 5,
        max: 40,
        step: 1,
        initValue: editor.overlays.getConfig().labelMaxChars,
        unit: "chars",
        onChange: (value: number, editor: InteractiveInkEditor) => {
          editor.overlays.updateConfig({ labelMaxChars: value })
        }
      },
      {
        type: "range",
        id: `${idPrefix}-overlay-label-font-size`,
        label: "Label font size",
        min: 8,
        max: 20,
        step: 1,
        initValue: editor.overlays.getConfig().labelFontSize,
        unit: "px",
        onChange: (value: number, editor: InteractiveInkEditor) => {
          editor.overlays.updateConfig({ labelFontSize: value })
        }
      }
    ]

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-overlay`,
      label: "Overlay",
      menuTitle: "Overlay",
      icon: rectangleIcon,
      position: "right-top",
      items
    }

    super(config, editor)
  }
}
