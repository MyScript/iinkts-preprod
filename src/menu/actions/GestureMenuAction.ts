import { InteractiveInkEditor } from "../../editor"
import { SubMenuItem, IMenuSubMenu } from "../items/SubMenuItem"
import { EditorTool, EditorWriteTool } from "../../Constants"
import { InsertAction, StrikeThroughAction, SurroundAction } from "../../manager"
import gestureIcon from "../../assets/svg/spock-hand-gesture.svg"

/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
export class GestureMenuAction extends SubMenuItem
{
  constructor(editor: InteractiveInkEditor, idPrefix = "ms-menu-action")
  {
    const surroundActionValues: { label: string, value: string }[] = []
    for (const key in SurroundAction) {
      const value = SurroundAction[key as keyof typeof SurroundAction]
      surroundActionValues.push({ label: key, value })
    }

    const strikeThroughActionValues: { label: string, value: string }[] = []
    for (const key in StrikeThroughAction) {
      const value = StrikeThroughAction[key as keyof typeof StrikeThroughAction]
      strikeThroughActionValues.push({ label: key, value })
    }

    const splitActionValues: { label: string, value: string }[] = []
    for (const key in InsertAction) {
      const value = InsertAction[key as keyof typeof InsertAction]
      splitActionValues.push({ label: key, value })
    }

    const config: IMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-gesture`,
      label: "Gesture",
      icon: gestureIcon,
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-gesture-detect`,
          label: "Detect gesture",
          getValue: (editor) => editor.writer.detectGesture,
          setValue: (editor, value) => {
            editor.writer.detectGesture = value
            editor.tool = EditorTool.Write
            editor.writer.tool = EditorWriteTool.Pencil
          }
        },
        {
          type: "select",
          id: `${idPrefix}-gesture-surround`,
          label: "On surround",
          options: surroundActionValues,
          getValue: (editor) => editor.gesture.surroundAction,
          setValue: (editor, value) => {
            editor.gesture.surroundAction = value as SurroundAction
            editor.tool = EditorTool.Write
            editor.writer.tool = EditorWriteTool.Pencil
          }
        },
        {
          type: "select",
          id: `${idPrefix}-gesture-strikethrough`,
          label: "On strikethrough",
          options: strikeThroughActionValues,
          getValue: (editor) => editor.gesture.strikeThroughAction,
          setValue: (editor, value) => {
            editor.gesture.strikeThroughAction = value as StrikeThroughAction
            editor.tool = EditorTool.Write
            editor.writer.tool = EditorWriteTool.Pencil
          }
        },
        {
          type: "select",
          id: `${idPrefix}-gesture-insert`,
          label: "On insert",
          options: splitActionValues,
          getValue: (editor) => editor.gesture.insertAction,
          setValue: (editor, value) => {
            editor.gesture.insertAction = value as InsertAction
            editor.tool = EditorTool.Write
            editor.writer.tool = EditorWriteTool.Pencil
          }
        }
      ]
    }

    super(config, editor)
  }
}
