import type { TInteractiveInkCanvas } from "@/canvas"
import {
  CanvasTool,
  CanvasWriteTool,
  InsertAction,
  StrikeThroughAction,
  SurroundAction,
  UnderlineAction,
} from "@/manager"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TGestureActionItemsConfig = {
  detect?: boolean
  surround?: boolean
  strikethrough?: boolean
  underline?: boolean
  insert?: boolean
}
/** @group Menu */
export type TGestureActionConfig = boolean | TGestureActionItemsConfig

type TGestureType = "surround" | "underline" | "insert" | "scratch-out" | "join" | "strike-through"

type TGestureSubMenuOptions = {
  key: Exclude<keyof TGestureActionItemsConfig, "detect">
  gestureType: TGestureType
  label: string
  actions: Record<string, string>
  getAction: (canvas: TInteractiveInkCanvas) => string
  setAction: (canvas: TInteractiveInkCanvas, value: string) => void
}

/**
 * @group Menu
 * @remarks Menu action Gesture - Détection et actions de gestes
 */
export class GestureMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TGestureActionItemsConfig) {
    const enabled = (key: keyof TGestureActionItemsConfig) => itemsConfig?.[key] !== false
    const isGestureEnabled = (canvas: TInteractiveInkCanvas, gestureType: TGestureType) =>
      canvas.configuration.recognition["raw-content"]?.gestures?.includes(gestureType) ?? false
    const resetToPencil = (canvas: TInteractiveInkCanvas) => {
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Pencil
    }

    const setGestureEnabled = (canvas: TInteractiveInkCanvas, gestureType: TGestureType, value: boolean) => {
      const conf = structuredClone(canvas.configuration.recognition)
      const gestures = (conf["raw-content"].gestures ?? []).filter((g) => g !== gestureType)
      conf["raw-content"].gestures = value ? [...gestures, gestureType] : gestures
      canvas.updateRecognitionConfiguration(conf)
    }

    const buildGestureSubMenu = (options: TGestureSubMenuOptions): TMenuSubMenu => ({
      type: "submenu",
      id: `${idPrefix}-gesture-${options.key}-menu`,
      label: options.label,
      menuTitle: options.label,
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-gesture-${options.key}-enable`,
          label: "Enable",
          getValue: (canvas) => isGestureEnabled(canvas, options.gestureType),
          setValue: (canvas, value) => setGestureEnabled(canvas, options.gestureType, value),
        },
        {
          type: "select",
          id: `${idPrefix}-gesture-${options.key}`,
          label: "Action on detection",
          options: Object.entries(options.actions).map(([label, value]) => ({ label, value })),
          getValue: options.getAction,
          setValue: (canvas, value) => {
            options.setAction(canvas, value)
            resetToPencil(canvas)
          },
          disabled: (canvas) => !isGestureEnabled(canvas, options.gestureType),
        },
      ],
    })

    const gestureSubMenus: TGestureSubMenuOptions[] = [
      {
        key: "surround",
        gestureType: "surround",
        label: "Surround",
        actions: SurroundAction,
        getAction: (canvas) => canvas.gesture.surroundAction,
        setAction: (canvas, value) => (canvas.gesture.surroundAction = value as SurroundAction),
      },
      {
        key: "strikethrough",
        gestureType: "strike-through",
        label: "Strikethrough",
        actions: StrikeThroughAction,
        getAction: (canvas) => canvas.gesture.strikeThroughAction,
        setAction: (canvas, value) => (canvas.gesture.strikeThroughAction = value as StrikeThroughAction),
      },
      {
        key: "underline",
        gestureType: "underline",
        label: "Underline",
        actions: UnderlineAction,
        getAction: (canvas) => canvas.gesture.underlineAction,
        setAction: (canvas, value) => (canvas.gesture.underlineAction = value as UnderlineAction),
      },
      {
        key: "insert",
        gestureType: "insert",
        label: "Insert",
        actions: InsertAction,
        getAction: (canvas) => canvas.gesture.insertAction,
        setAction: (canvas, value) => (canvas.gesture.insertAction = value as InsertAction),
      },
    ]

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-gesture`,
      label: "Gesture",
      menuTitle: "Gesture",
      position: "right-top",
      items: [],
    }

    if (enabled("detect")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-gesture-detect`,
        label: "Detect gesture",
        getValue: (canvas) => canvas.writer.detectGesture,
        setValue: (canvas, value) => {
          canvas.writer.detectGesture = value
          resetToPencil(canvas)
        },
      })
    }

    gestureSubMenus
      .filter((options) => enabled(options.key) && isGestureEnabled(canvas, options.gestureType))
      .forEach((options) => config.items.push(buildGestureSubMenu(options)))

    super(config, canvas)
  }
}
