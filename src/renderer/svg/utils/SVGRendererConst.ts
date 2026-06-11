/**
 * @group Renderer
 */
export const SVGRendererConst =
{
  arrowHeadStartMarker: "arrow-head-start",
  arrowHeadEndMaker: "arrow-head-end",
  selectionFilterId: "selection-filter",
  removalFilterId: "removal-filter",
  crossMarker: "cross-marker",
  noSelection: "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;",
}

/**
 * Common SVG path attribute presets for guide rendering
 * @group Renderer
 */
export const GUIDE_PATH_ATTRS = {
  "stroke-width": "1",
  stroke: "grey",
  fill: "none"
} as const

/**
 * Common SVG path attribute presets for sub-guide rendering
 * @group Renderer
 */
export const SUB_GUIDE_PATH_ATTRS = {
  "stroke-width": "0.25",
  stroke: "grey",
  fill: "none"
} as const
