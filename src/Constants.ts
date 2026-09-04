/**
 * @group Canvas
 * @summary
 * List the possibilities of interactions
 */
export enum CanvasTool {
  Write = "write",
  Erase = "erase",
  /**
   * @remarks only usable in the case of interactive ink canvas
   */
  Select = "select",
  /**
   * @remarks only usable in the case of interactive ink canvas
   */
  Move = "move",
}

/**
 * @group Canvas
 * @summary
 * List all the shapes that can be drawn
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export enum CanvasWriteTool {
  Pencil = "pencil",
  Rectangle = "rectangle",
  Rhombus = "rhombus",
  Circle = "circle",
  Ellipse = "ellipse",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Line = "line",
  Arrow = "arrow",
  DoubleArrow = "double-arrow",
}

/**
 * @group Renderer
 * @summary
 * List all svg elements roles
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export enum SvgElementRole {
  Guide = "guide",
  InteractElementsGroup = "interact-elements-group",
  Translate = "translate",
  Resize = "resize",
  Rotate = "rotate",
}

/**
 * @group Renderer
 * @summary
 * List all svg elements resize direction
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export const enum ResizeDirection {
  North = "n-resize",
  East = "e-resize",
  South = "s-resize",
  West = "w-resize",
  NorthEast = "ne-resize",
  NorthWest = "nw-resize",
  SouthEast = "se-resize",
  SouthWest = "sw-resize",
}

/**
 * @group Renderer
 */
export const SELECTION_MARGIN = 10 as const

/**
 * Every label ever passed to `startOperation`/`endOperation`/`trackOperation` (shown on the
 * canvas state badge tooltip). `Writing`/`Translating`/`Resizing`/`Rotating` additionally
 * identify an in-progress user gesture — see {@link GESTURE_OPERATION_LABELS}.
 * @group Canvas
 */
export type TCanvasOperationLabel =
  | "Recognizing"
  | "Writing"
  | "Translating"
  | "Resizing"
  | "Rotating"
  | "Synchronizing"
  | "Applying gesture"
  | "Converting"
  | "Computing"
  | "Updating variables"
  | "Loading variables"
  | "Evaluating"
  | "Checking"
  | "Exporting"
  | "Importing"
  | "Undoing"
  | "Redoing"
  | "Clearing"
  | "Removing strokes"

/**
 * Operation labels that identify an in-progress user gesture (pointer down through pointer up).
 * While any of these is active, synchronizing with the backend should be deferred so it never
 * contends with the gesture for the main thread.
 * @group Canvas
 */
export const GESTURE_OPERATION_LABELS: readonly TCanvasOperationLabel[] = [
  "Writing",
  "Translating",
  "Resizing",
  "Rotating",
] as const

/**
 * How an edge's end is drawn, and how the recognizer reports it in JIIX.
 *
 * It lives here rather than in either layer that uses it: the symbol layer draws it, the wire types
 * carry it, and neither owns it. `Constants` is the module both may import without either depending
 * on the other.
 * @group Symbol
 */
export enum EdgeDecoration {
  Arrow = "arrow-head",
}

/**
 * @group Constants
 */
export * from "./constants/MathDiagnosticMessages"
