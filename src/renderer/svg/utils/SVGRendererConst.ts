/**
 * @group Renderer
 */
export const SVGRendererConst = {
  /** Class a selected symbol's element carries; its outline is drawn by the stylesheet */
  selectedClassName: "ms-selected",
  /** Class of the wider copy drawn under a selected shape or edge; the stylesheet colours it */
  selectionHaloClassName: "ms-selection-halo",
  /** Class a symbol's element carries while the eraser passes over it; the stylesheet fades it */
  deletingClassName: "ms-deleting",
  /** Class a locked symbol's element carries; the stylesheet tones it down */
  lockedClassName: "ms-locked",
  /** Class of the padlock drawn on a locked selection or where a change was refused */
  lockIconClassName: "ms-lock-icon",
  /** Class added to a padlock shown briefly where a change was refused; the stylesheet fades it */
  lockIconFlashClassName: "ms-lock-icon-flash",
  /** How long, in milliseconds, a refused-change padlock stays on screen */
  lockIconFlashDuration: 900,
  crossMarker: "cross-marker",
  noSelection:
    "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;",
}

/**
 * Common SVG path attribute presets for guide rendering
 * @group Renderer
 */
export const GUIDE_PATH_ATTRS = {
  "stroke-width": "1",
  stroke: "grey",
  fill: "none",
} as const

/**
 * Common SVG path attribute presets for sub-guide rendering
 * @group Renderer
 */
export const SUB_GUIDE_PATH_ATTRS = {
  "stroke-width": "0.25",
  stroke: "grey",
  fill: "none",
} as const
