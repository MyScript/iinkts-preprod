import { SELECTION_MARGIN } from "@/Constants"
import type { TBox } from "@/core/geometry"
import { OBBOps, type TOBB } from "@/core/geometry"
import { isValidPoint, type TPoint, type TSegment } from "@/core/geometry"
import { computeAngleFromPointOnEllipse, computeDistance, computePointOnEllipse } from "@/core/geometry"
import { computeEllipseRadiusAverage, computeTessellationCount, isValidNumber } from "@/core/math"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import { mergeSymbolStyle, type TStyle } from "@/style"
import { SymbolType, type TBaseSymbol } from "@/symbol/Symbol"

import type { TAnchor } from "./Anchor"
import { computeEdgeBounds, type EdgeDecoration, EdgeKind } from "./Edge-enum"

/**
 * @group Symbol
 */
export type TEdgeArc = TBaseSymbol & {
  type: SymbolType.Edge
  kind: EdgeKind.Arc
  style: TStyle
  center: TPoint
  startAngle: number
  sweepAngle: number
  radiusX: number
  radiusY: number
  phi: number
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  startAnchor?: TAnchor
  endAnchor?: TAnchor
  vertices: TPoint[]
  bounds: TOBB
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 */
export const EdgeArcOps = {
  create(
    center: TPoint,
    startAngle: number,
    sweepAngle: number,
    radiusX: number,
    radiusY: number,
    phi: number,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgeArc {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const arc: TEdgeArc = {
      type: SymbolType.Edge,
      kind: EdgeKind.Arc,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      startAngle,
      sweepAngle,
      radiusX,
      radiusY,
      phi,
      startDecoration,
      endDecoration,
      vertices: [],
      bounds: OBBOps.create({ x: 0, y: 0 }, 0, 0),
      snapPoints: [],
      edges: [],
    }
    EdgeArcOps.updateDerivedFields(arc)
    return arc
  },

  createFromPartial(partial: TPartialDeep<TEdgeArc>): TEdgeArc {
    if (!isValidPoint(partial?.center)) {
      throw new Error(`Unable to create a arc, center point is invalid`)
    }
    if (!isValidNumber(partial?.startAngle)) {
      throw new Error(`Unable to create a arc, startAngle is invalid`)
    }
    if (!isValidNumber(partial?.sweepAngle)) {
      throw new Error(`Unable to create a arc, sweepAngle is invalid`)
    }
    if (!isValidNumber(partial?.radiusX)) {
      throw new Error(`Unable to create a arc, radiusX is invalid`)
    }
    if (!isValidNumber(partial?.radiusY)) {
      throw new Error(`Unable to create a arc, radiusY is invalid`)
    }
    const arc = EdgeArcOps.create(
      partial.center as TPoint,
      partial.startAngle!,
      partial.sweepAngle!,
      partial.radiusX!,
      partial.radiusY!,
      partial.phi || 0,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      arc.id = partial.id
    }
    return arc
  },

  computeVertices(arc: TEdgeArc): TPoint[] {
    const length = Math.abs(arc.sweepAngle) * computeEllipseRadiusAverage(arc.radiusX, arc.radiusY)
    const nbVertices = computeTessellationCount(length, SELECTION_MARGIN)
    const angleStep = arc.sweepAngle / nbVertices
    const v: TPoint[] = []
    const endAngle = arc.startAngle + arc.sweepAngle
    if (arc.sweepAngle > 0) {
      for (let angle = arc.startAngle; angle < endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    } else {
      for (let angle = arc.startAngle; angle > endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    }
    v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, endAngle))
    return v
  },

  updateDerivedFields(arc: TEdgeArc): void {
    const vertices = EdgeArcOps.computeVertices(arc)
    arc.vertices = vertices
    arc.bounds = computeEdgeBounds(vertices, arc.style, arc.startDecoration, arc.endDecoration)
    arc.snapPoints = [vertices[0], vertices.at(-1)!]
    arc.edges = vertices.slice(0, -1).map((p, i) => ({
      p1: p,
      p2: vertices[i + 1],
    }))
  },

  getResizePoints(arc: TEdgeArc): { point: TPoint; vertexIndex: number }[] {
    const v = arc.vertices
    const mid = Math.floor(v.length / 2)
    return [
      { point: v[0], vertexIndex: 0 },
      { point: v[mid], vertexIndex: mid },
      {
        point: v[v.length - 1],
        vertexIndex: v.length - 1,
      },
    ]
  },

  overlaps(arc: TEdgeArc, box: TBox): boolean {
    return OBBOps.polygonOverlapsBox(arc.bounds, arc.edges, box)
  },

  getSVGPath(arc: TEdgeArc): string {
    // When anchored to a shape, the arc's real geometric endpoint sits at the shape's center
    // (inside it), and the tessellation is dense — several vertices right after the true start
    // are STILL near the center, not just the first one. Swapping only vertices[0] for
    // entryPoint (where the arc crosses the shape's border) would draw a spike from the border
    // back to those near-center vertices before the visible curve even begins. Instead, drop
    // every vertex that's closer to the true endpoint than entryPoint is (i.e. still "inside"
    // the shape along the curve) and start/end the path at entryPoint itself.
    const original = arc.vertices
    const trueStart = original[0]
    const trueEnd = original[original.length - 1]

    let kept = original
    if (arc.startAnchor?.entryPoint) {
      const cutDistance = computeDistance(trueStart, arc.startAnchor.entryPoint)
      kept = kept.filter((v) => computeDistance(v, trueStart) >= cutDistance)
    }
    if (arc.endAnchor?.entryPoint) {
      const cutDistance = computeDistance(trueEnd, arc.endAnchor.entryPoint)
      kept = kept.filter((v) => computeDistance(v, trueEnd) >= cutDistance)
    }

    const vertices = [
      ...(arc.startAnchor?.entryPoint ? [arc.startAnchor.entryPoint] : []),
      ...kept,
      ...(arc.endAnchor?.entryPoint ? [arc.endAnchor.entryPoint] : []),
    ]

    let path = `M ${vertices[0].x} ${vertices[0].y} Q`
    for (let i = 0; i < vertices.length; i++) {
      path += ` ${vertices[i].x} ${vertices[i].y}`
    }
    return path
  },
}

function normalizeSweep(rawSweep: number, referenceSweep: number): number {
  const TWO_PI = Math.PI * 2
  let sweep = rawSweep % TWO_PI
  if (referenceSweep >= 0 && sweep < 0) {
    sweep += TWO_PI
  }
  if (referenceSweep < 0 && sweep > 0) {
    sweep -= TWO_PI
  }
  return sweep
}

/**
 * Recompute startAngle/sweepAngle so that the given end ("start" or "end") of the arc lands
 * on targetPoint, keeping center/radiusX/radiusY/phi and the OTHER endpoint's angle fixed.
 * @group Symbol
 */
export function reprojectArcEndpoint(
  arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">,
  changingEnd: "start" | "end",
  targetPoint: TPoint
): { startAngle: number; sweepAngle: number } {
  const newAngle = computeAngleFromPointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, targetPoint)
  const oldEndAngle = arc.startAngle + arc.sweepAngle
  if (changingEnd === "start") {
    const sweepAngle = normalizeSweep(oldEndAngle - newAngle, arc.sweepAngle)
    return { startAngle: newAngle, sweepAngle }
  }
  const sweepAngle = normalizeSweep(newAngle - arc.startAngle, arc.sweepAngle)
  return { startAngle: arc.startAngle, sweepAngle }
}

/**
 * Recompute center/radiusX/radiusY (and consequently startAngle/sweepAngle) so the arc's
 * midpoint tracks targetPoint as closely as possible, while keeping phi, the radiusX:radiusY
 * ratio, AND both endpoints' world positions exactly fixed.
 *
 * There is a 1-parameter family of (center, radius) pairs satisfying "fixed phi/ratio, both
 * endpoints on the ellipse" — eliminating the shared radius from the two "endpoint on ellipse"
 * equations collapses to a single LINEAR constraint on the ellipse's (unrotated-frame) center,
 * i.e. a line; every point on that line, paired with the radius it implies, is a valid family
 * member. This searches that line for the member whose midpoint is nearest targetPoint: an
 * exact match when targetPoint is reachable, the nearest reachable point otherwise — the same
 * search handles both cases without a separate fallback path.
 * @group Symbol
 */
export function reprojectArcMidpoint(
  arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">,
  targetPoint: TPoint
): { center: TPoint; radiusX: number; radiusY: number; startAngle: number; sweepAngle: number } {
  const phi = arc.phi
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  // The ellipse's own (unrotated) frame: rotating world points by -phi turns the ellipse into
  // an axis-aligned one, where "fixed ratio" becomes a single scalar radius (radiusY).
  const toLocal = (p: TPoint): TPoint => ({ x: cosPhi * p.x + sinPhi * p.y, y: -sinPhi * p.x + cosPhi * p.y })
  const toWorld = (p: TPoint): TPoint => ({ x: cosPhi * p.x - sinPhi * p.y, y: sinPhi * p.x + cosPhi * p.y })

  const startPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, phi, arc.startAngle)
  const endPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, phi, arc.startAngle + arc.sweepAngle)

  const ratio = Math.abs(arc.radiusY) > 1e-9 ? Math.abs(arc.radiusX) / Math.abs(arc.radiusY) : 1
  const s = toLocal(startPoint)
  const e = toLocal(endPoint)

  // Both endpoints on ellipse(Cx,Cy,ratio*radiusY,radiusY): (s.x-Cx)²/ratio² + (s.y-Cy)² =
  // (e.x-Cx)²/ratio² + (e.y-Cy)² = radiusY². Subtracting eliminates radiusY², leaving one
  // linear equation a*Cx + b*Cy = c in the local-frame center.
  const dx = s.x - e.x
  const dy = s.y - e.y
  const a = dx / (ratio * ratio)
  const b = dy
  const c = (dx * (s.x + e.x)) / (2 * ratio * ratio) + (dy * (s.y + e.y)) / 2

  // Parametrize the line by whichever coordinate has the larger coefficient, so the division
  // used to recover the other coordinate stays numerically stable near-vertical/horizontal.
  const useXAsParam = Math.abs(b) >= Math.abs(a)
  const centerLocalAt = (t: number): TPoint =>
    useXAsParam ? { x: t, y: (c - a * t) / b } : { x: (c - b * t) / a, y: t }

  const radiusYAt = (centerLocal: TPoint): number => {
    const dxs = s.x - centerLocal.x
    const dys = s.y - centerLocal.y
    return Math.sqrt((dxs * dxs) / (ratio * ratio) + dys * dys)
  }

  const TWO_PI = Math.PI * 2

  const evaluate = (
    t: number
  ): { distance: number; center: TPoint; radiusX: number; radiusY: number; startAngle: number; sweepAngle: number } => {
    const centerLocal = centerLocalAt(t)
    const radiusY = radiusYAt(centerLocal)
    const radiusX = ratio * radiusY
    const center = toWorld(centerLocal)
    const startAngle = computeAngleFromPointOnEllipse(center, radiusX, radiusY, phi, startPoint)
    const rawEndAngle = computeAngleFromPointOnEllipse(center, radiusX, radiusY, phi, endPoint)

    // Two complementary arcs connect the same two endpoints on this ellipse (short way / long
    // way around), bulging to OPPOSITE sides of the chord. Locking the sweep's rotational sign
    // to the original arc's would make "drag the bulge past the chord to the other side"
    // unreachable except in the limit of an ever-larger, near-degenerate ellipse (the actual
    // bug this fixes) — so both candidates are evaluated here and the nearer one wins.
    const wrappedSweep = (((rawEndAngle - startAngle) % TWO_PI) + TWO_PI) % TWO_PI
    const candidateSweeps = [wrappedSweep, wrappedSweep - TWO_PI]
    let best: { distance: number; sweepAngle: number } | undefined
    candidateSweeps.forEach((sweepAngle) => {
      const midAngle = startAngle + sweepAngle / 2
      const midPoint = computePointOnEllipse(center, radiusX, radiusY, phi, midAngle)
      const distance = computeDistance(midPoint, targetPoint)
      if (!best || distance < best.distance) {
        best = { distance, sweepAngle }
      }
    })

    return { distance: best!.distance, center, radiusX, radiusY, startAngle, sweepAngle: best!.sweepAngle }
  }

  const centerLocal0 = toLocal(arc.center)
  const t0 = useXAsParam ? centerLocal0.x : centerLocal0.y
  const span = 50 * (computeEllipseRadiusAverage(arc.radiusX, arc.radiusY) + computeDistance(startPoint, endPoint) + 1)

  // The family isn't guaranteed unimodal in general, so sample coarsely across a wide,
  // scale-aware range first, then refine around the best sample with a golden-section search.
  const SAMPLE_COUNT = 200
  let bestT = t0
  let bestDistance = evaluate(t0).distance
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const t = t0 - span + (2 * span * i) / SAMPLE_COUNT
    const distance = evaluate(t).distance
    if (distance < bestDistance) {
      bestDistance = distance
      bestT = t
    }
  }

  const step = (2 * span) / SAMPLE_COUNT
  let lo = bestT - step
  let hi = bestT + step
  const GOLDEN_RATIO = (Math.sqrt(5) - 1) / 2
  for (let i = 0; i < 40; i++) {
    const m1 = hi - GOLDEN_RATIO * (hi - lo)
    const m2 = lo + GOLDEN_RATIO * (hi - lo)
    if (evaluate(m1).distance < evaluate(m2).distance) {
      hi = m2
    } else {
      lo = m1
    }
  }

  const best = evaluate((lo + hi) / 2)
  return {
    center: best.center,
    radiusX: best.radiusX,
    radiusY: best.radiusY,
    startAngle: best.startAngle,
    sweepAngle: best.sweepAngle,
  }
}

/**
 * Recompute center/radiusX/radiusY/startAngle/sweepAngle so the given end ("start" or "end")
 * of the arc lands exactly on targetPoint, keeping phi, the radiusX:radiusY ratio, AND the
 * OTHER endpoint's world position fixed — letting the ellipse stretch or shrink freely, unlike
 * reprojectArcEndpoint, which only slides the moved endpoint's ANGLE around the ellipse's
 * current, unchanged size.
 *
 * "Other endpoint" and "target" both on the ellipse leaves a 1-parameter family of (center,
 * radius) pairs — same family reprojectArcMidpoint searches — but here there's no third point
 * to search against, so the family is instead closed by requiring the center to stay equidistant
 * from both endpoints, i.e. on their perpendicular bisector. Intersecting that bisector with the
 * family's line is a direct closed-form solve, not a search.
 * @group Symbol
 */
export function stretchArcEndpoint(
  arc: Pick<TEdgeArc, "center" | "radiusX" | "radiusY" | "phi" | "startAngle" | "sweepAngle">,
  changingEnd: "start" | "end",
  targetPoint: TPoint
): { center: TPoint; radiusX: number; radiusY: number; startAngle: number; sweepAngle: number } {
  const phi = arc.phi
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const toLocal = (p: TPoint): TPoint => ({ x: cosPhi * p.x + sinPhi * p.y, y: -sinPhi * p.x + cosPhi * p.y })
  const toWorld = (p: TPoint): TPoint => ({ x: cosPhi * p.x - sinPhi * p.y, y: sinPhi * p.x + cosPhi * p.y })

  const otherWorld =
    changingEnd === "start"
      ? computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, phi, arc.startAngle + arc.sweepAngle)
      : computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, phi, arc.startAngle)

  const ratio = Math.abs(arc.radiusY) > 1e-9 ? Math.abs(arc.radiusX) / Math.abs(arc.radiusY) : 1
  const s = toLocal(otherWorld)
  const e = toLocal(targetPoint)

  const dx = s.x - e.x
  const dy = s.y - e.y
  // Degenerate: the dragged endpoint landed on (or extremely near) the other endpoint — no arc
  // can connect two coincident points, so leave the geometry untouched instead of dividing by ~0.
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return {
      center: arc.center,
      radiusX: arc.radiusX,
      radiusY: arc.radiusY,
      startAngle: arc.startAngle,
      sweepAngle: arc.sweepAngle,
    }
  }

  // Both endpoints on ellipse(Cx,Cy,ratio*radiusY,radiusY): eliminating radiusY² leaves one
  // linear equation a*Cx + b*Cy = c (same derivation as reprojectArcMidpoint's family line).
  const a = dx / (ratio * ratio)
  const b = dy
  const c = (dx * (s.x + e.x)) / (2 * ratio * ratio) + (dy * (s.y + e.y)) / 2

  // Perpendicular bisector of (s, e): every point on it is equidistant from both — the extra
  // constraint that closes the family down to one member, EXCEPT for a circle (ratio 1), where
  // it's automatically satisfied by every member (any point on a circle is equidistant from its
  // own center) and gives no new information at all — the family line and bisector are then the
  // SAME line, not two lines to intersect.
  const midX = (s.x + e.x) / 2
  const midY = (s.y + e.y) / 2
  const bx = e.x - s.x
  const by = e.y - s.y
  const bc = bx * midX + by * midY

  // Solve { a*Cx + b*Cy = c ; bx*Cx + by*Cy = bc } for their intersection.
  const det = a * by - b * bx
  const centerLocal: TPoint =
    Math.abs(det) < 1e-9
      ? // Circle case (or otherwise near-parallel lines): fall back to the point on the
        // family line nearest the ellipse's own current center, so the circle still resizes
        // to fit (s, e) instead of being stuck at its old radius.
        (() => {
          const denom = a * a + b * b
          const original = toLocal(arc.center)
          const tPerp = (a * original.x + b * original.y - c) / denom
          return { x: original.x - a * tPerp, y: original.y - b * tPerp }
        })()
      : { x: (c * by - b * bc) / det, y: (a * bc - c * bx) / det }

  const dxs = s.x - centerLocal.x
  const dys = s.y - centerLocal.y
  const radiusY = Math.sqrt((dxs * dxs) / (ratio * ratio) + dys * dys)
  const radiusX = ratio * radiusY
  const center = toWorld(centerLocal)

  const otherAngle = computeAngleFromPointOnEllipse(center, radiusX, radiusY, phi, otherWorld)
  const targetAngle = computeAngleFromPointOnEllipse(center, radiusX, radiusY, phi, targetPoint)

  if (changingEnd === "start") {
    const sweepAngle = normalizeSweep(otherAngle - targetAngle, arc.sweepAngle)
    return { center, radiusX, radiusY, startAngle: targetAngle, sweepAngle }
  }
  const sweepAngle = normalizeSweep(targetAngle - otherAngle, arc.sweepAngle)
  return { center, radiusX, radiusY, startAngle: otherAngle, sweepAngle }
}
