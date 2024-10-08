
/**
 * @group Gesture
 * @description List all authorized gestures
 */
export type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND"

/**
 * @group Gesture
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: { fullStrokeId: string, x: number[], y: number[] }[]
}

/**
 * @group Gesture
 * @description List all action allowed on surround detected
 * @remarks only usable in the case of offscreen
 */
export enum SurroundAction
{
  Select = "select",
  Surround = "surround",
  Highlight = "highlight"
}

/**
 * @group Gesture
 * @description List all action allowed on strikeThrough detected
 * @remarks only usable in the case of offscreen
 */
export enum StrikeThroughAction
{
  Erase = "erase",
  Draw = "draw"
}

/**
 * @group Gesture
 * @description List all action allowed on split detected
 * @remarks only usable in the case of offscreen
 */
export enum InsertAction
{
  /**
   * Add lien break on gesture place
   */
  LineBreak = "line-break",
  /**
   * Insert place in gesture place
   */
  Insert = "insert"
}
