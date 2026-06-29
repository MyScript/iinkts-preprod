/**
 * Anchor point on a symbol, expressed as normalized 0-1 coordinates within the symbol's bounds.
 * (0,0) = top-left, (1,1) = bottom-right.
 * Stored as normalized values so the anchor remains valid when the target symbol moves or resizes.
 * @group Symbol
 */
export type TAnchor = {
  symbolId: string
  normalizedX: number
  normalizedY: number
  /** Intersection of the edge with the shape border, in world coordinates. */
  entryPoint?: { x: number; y: number }
}

/**
 * Resolve a normalized anchor to an absolute TPoint given the target symbol's bounding box.
 * @group Symbol
 */
export function resolveAnchorPoint(
  anchor: TAnchor,
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
): { x: number; y: number } {
  return {
    x: bounds.x + anchor.normalizedX * bounds.width,
    y: bounds.y + anchor.normalizedY * bounds.height,
  }
}

/**
 * Compute normalized anchor coordinates from an absolute point and target bounds.
 * Result is clamped to [0, 1].
 * @group Symbol
 */
export function computeNormalizedAnchor(
  point: { x: number; y: number },
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
): { normalizedX: number; normalizedY: number } {
  const w = bounds.width || 1
  const h = bounds.height || 1
  return {
    normalizedX: Math.max(0, Math.min(1, (point.x - bounds.x) / w)),
    normalizedY: Math.max(0, Math.min(1, (point.y - bounds.y) / h)),
  }
}
