import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { IMenuCheckbox } from "../items/CheckboxMenuItem"
import debugIcon from "../../assets/svg/wolf.svg"

/**
 * @group Menu
 * @remarks Menu action Debug - Affichage des éléments de debug
 */
export class DebugMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const items: IMenuCheckbox[] = [
      {
        type: "checkbox",
        id: `${idPrefix}-debug-bounding-box`,
        label: "Show bounding box",
        getValue: (editor: InteractiveInkEditor) => editor.svgDebugger.boundingBoxVisibility,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.svgDebugger.boundingBoxVisibility = value
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-debug-recognition-box`,
        label: "Show recognition box",
        getValue: (editor: InteractiveInkEditor) => editor.svgDebugger.recognitionBoxVisibility,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.svgDebugger.recognitionBoxVisibility = value
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-debug-bounding-item-box`,
        label: "Show recognition item box",
        getValue: (editor: InteractiveInkEditor) => editor.svgDebugger.recognitionItemBoxVisibility,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.svgDebugger.recognitionItemBoxVisibility = value
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-debug-snap-points`,
        label: "Show snap points",
        getValue: (editor: InteractiveInkEditor) => editor.svgDebugger.snapPointsVisibility,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.svgDebugger.snapPointsVisibility = value
        }
      },
      {
        type: "checkbox",
        id: `${idPrefix}-debug-vertices`,
        label: "Show vertices",
        getValue: (editor: InteractiveInkEditor) => editor.svgDebugger.verticesVisibility,
        setValue: (editor: InteractiveInkEditor, value: boolean) => {
          editor.svgDebugger.verticesVisibility = value
        }
      }
    ]

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-debug`,
      label: "Debug",
      menuTitle: "Debug",
      icon: debugIcon,
      position: "right-top",
      items: items
    }

    super(config, editor)
  }
}
