import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"
import type { TEdge, TPoint, TShape, TStroke, TSymbol } from "@/symbol"
import type { TAnchor } from "@/symbol/edge/Anchor"
import { computeNormalizedAnchor, resolveAnchorPoint } from "@/symbol/edge/Anchor"
import { EdgeArcOps, stretchArcEndpoint } from "@/symbol/edge/Arc"
import { EdgeOps } from "@/symbol/edge/Edge"
import { EdgeLineOps } from "@/symbol/edge/Line"
import { EdgePolyLineOps } from "@/symbol/edge/PolyLine"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import { ShapeOps } from "@/symbol/shape/Shape"
import { isStroke, StrokeOps } from "@/symbol/stroke/Stroke"
import { cloneSymbol } from "@/symbol/SymbolHelpers"
import { SVGBuilder } from "@/symbol-utils/SVGBuilder"
import type { MatrixTransform } from "@/transform"
import { computeDistance, type TPartialDeep } from "@/utils"
import { findIntersectionBetween2Segment, isPointInsidePolygon } from "@/utils/geometry"

import { IIAbstractManager } from "./IIAbstractManager"

const ANCHOR_HINT_ROLE = "anchor-hint"
const ANCHOR_HINT_COLOR = "#3e68ff"
const ANCHOR_HINT_PATTERN_ID = "ms-anchor-hint-pattern"

/**
 * A pre-convert edge stroke that should follow a transform of the moving set, and how:
 * "rigid" when both of its connected shapes are moving together (nothing shifts relatively),
 * "gradient" when only one is — `movingAnchor` identifies which one to follow toward.
 */
type TFollowedStroke = { symbol: TStroke; mode: "rigid" | "gradient"; movingAnchor?: TAnchor }

/**
 * Result of committing the anchored-edges update pass (both pre-convert strokes and converted
 * Line/PolyEdge/Arc symbols).
 * `rigidStrokeIds` moved by a single uniform matrix — safe to fold into the caller's own
 * matrix-replay history entry (translate/scale/rotate), since re-applying the inverse matrix
 * correctly undoes a uniform transform.
 * `oldSymbols`/`newSymbols` are everything else: gradient-followed raw strokes, and converted
 * edges (their anchor position is *recomputed* from the target's new bounds, not transformed by
 * a matrix relative to their own prior state, so there's no inverse to replay either way). All
 * of these need their pre-mutation snapshot restored directly on undo via the `updated` history
 * entry, not re-derived.
 */
type TAnchoredEdgesUpdateResult = { rigidStrokeIds: string[]; oldSymbols: TSymbol[]; newSymbols: TSymbol[] }

/**
 * @group Manager
 */
export type TConnectorConfiguration = {
  /** Whether moving/resizing/rotating a connected shape reshapes its anchored edges (stroke or
   * converted Line/PolyEdge/Arc) to follow it. Existing anchors and connection tracking (sync,
   * survival across Convert) are unaffected either way — this only gates the visual/commit
   * follow-on-move behavior. */
  followConnectedEdges: boolean
}

/**
 * @group Manager
 * @source
 */
export const DefaultConnectorConfiguration: TConnectorConfiguration = {
  followConnectedEdges: true,
}

/**
 * @group Manager
 */
export class ConnectorConfiguration implements TConnectorConfiguration {
  followConnectedEdges: boolean

  constructor(config?: TPartialDeep<TConnectorConfiguration>) {
    this.followConnectedEdges =
      config?.followConnectedEdges !== undefined
        ? config.followConnectedEdges
        : DefaultConnectorConfiguration.followConnectedEdges
  }
}

/**
 * Manages anchored edges — edges whose endpoints are bound to other symbols.
 * When an anchored symbol moves, `updateAnchoredEdges` recomputes the
 * corresponding edge endpoints from their stored normalized anchor coordinates.
 * @group Manager
 */
export class IIConnectorManager extends IIAbstractManager {
  protected managerName = "IIConnectorManager"
  connectorConfiguration: ConnectorConfiguration

  constructor(canvas: TInteractiveInkCanvas, config?: TPartialDeep<TConnectorConfiguration>) {
    super(canvas, LoggerCategory.MANAGER)
    this.connectorConfiguration = new ConnectorConfiguration(config)
  }

  /**
   * Find the first non-edge symbol whose bounds contain the given point.
   * `excludeId` prevents matching the edge being dragged.
   */
  findSymbolAtPoint(point: TPoint, excludeId: string): TSymbol | undefined {
    return this.model.symbols.find((s) => {
      if (s.id === excludeId) {
        return false
      }
      if (EdgeOps.isEdge(s)) {
        return false
      }
      if (ShapeOps.isShape(s)) {
        return isPointInsidePolygon(point, (s as TShape).vertices)
      }
      return OBBOps.containsPoint((s as unknown as { bounds: TOBB }).bounds, point)
    })
  }

  /**
   * Draw a dashed highlight rect around a symbol's bounds to indicate an
   * active anchor snap target. Clears any previously shown hint first.
   */
  showAnchorHint(point: TPoint, excludeId: string): TSymbol | undefined {
    this.clearAnchorHint()
    const target = this.findSymbolAtPoint(point, excludeId)
    if (target) {
      const bounds = OBBOps.toBox((target as unknown as { bounds: TOBB }).bounds)
      // Tagging the pattern with the same role as the rect lets clearAnchorHint's single
      // clearElements() sweep remove both together.
      const pattern = SVGBuilder.createPattern(
        ANCHOR_HINT_PATTERN_ID,
        { x: 0, y: 0, width: 8, height: 8 },
        { role: ANCHOR_HINT_ROLE, patternTransform: "rotate(45)" }
      )
      pattern.appendChild(
        SVGBuilder.createLine(
          { x: 0, y: 0 },
          { x: 0, y: 8 },
          { stroke: ANCHOR_HINT_COLOR, "stroke-width": "2", opacity: "0.35" }
        )
      )
      this.canvas.renderer.appendElement(pattern)
      this.canvas.renderer.drawRect(bounds, {
        role: ANCHOR_HINT_ROLE,
        fill: `url(#${ANCHOR_HINT_PATTERN_ID})`,
        stroke: ANCHOR_HINT_COLOR,
        "stroke-width": "2",
        "stroke-dasharray": "6 3",
        "pointer-events": "none",
        style: "pointer-events:none",
      })
    }
    return target
  }

  /** Remove the anchor snap hint from the interaction layer. */
  clearAnchorHint(): void {
    this.canvas.renderer.clearElements({
      attrs: { role: ANCHOR_HINT_ROLE },
    })
  }

  /**
   * Find where the ray from `anchoredPoint` toward `otherPoint` exits the polygon
   * defined by `shapeVertices`. Using a ray (not a segment) ensures a result even when
   * shapes overlap and `otherPoint` is inside the polygon.
   */
  private computeEntryPoint(
    anchoredPoint: TPoint,
    otherPoint: TPoint,
    shapeVertices: TPoint[]
  ): { x: number; y: number } | undefined {
    const dx = otherPoint.x - anchoredPoint.x
    const dy = otherPoint.y - anchoredPoint.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) {
      return undefined
    }
    const FAR = 100000
    const edgeSeg = {
      p1: anchoredPoint,
      p2: {
        x: anchoredPoint.x + (dx / len) * FAR,
        y: anchoredPoint.y + (dy / len) * FAR,
      },
    }
    for (let i = 0; i < shapeVertices.length; i++) {
      const shapeSeg = {
        p1: shapeVertices[i],
        p2: shapeVertices[(i + 1) % shapeVertices.length],
      }
      const hit = findIntersectionBetween2Segment(edgeSeg, shapeSeg)
      if (hit) {
        return hit
      }
    }
    return undefined
  }

  /**
   * Recompute `entryPoint` on every anchor currently set on `edge`.
   * Must be called after the edge endpoints and anchor target shape are in their final positions.
   */
  private recomputeAllEntryPoints(edge: TEdge): void {
    if (EdgeOps.isLineEdge(edge)) {
      if (edge.startAnchor) {
        const target = this.model.getRootSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.start, edge.end, (target as TShape).vertices)
            : undefined
      }
      if (edge.endAnchor) {
        const target = this.model.getRootSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.end, edge.start, (target as TShape).vertices)
            : undefined
      }
    } else if (EdgeOps.isPolyEdge(edge)) {
      const n = edge.points.length
      if (edge.startAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.points[0], edge.points[1], (target as TShape).vertices)
            : undefined
      }
      if (edge.endAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.points[n - 1], edge.points[n - 2], (target as TShape).vertices)
            : undefined
      }
    } else if (EdgeOps.isArcEdge(edge)) {
      const n = edge.vertices.length
      if (edge.startAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.startAnchor.symbolId)
        edge.startAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.vertices[0], edge.vertices[1], (target as TShape).vertices)
            : undefined
      }
      if (edge.endAnchor && n >= 2) {
        const target = this.model.getRootSymbol(edge.endAnchor.symbolId)
        edge.endAnchor.entryPoint =
          target && ShapeOps.isShape(target)
            ? this.computeEntryPoint(edge.vertices[n - 1], edge.vertices[n - 2], (target as TShape).vertices)
            : undefined
      }
    }
  }

  /**
   * Assign or clear the start/end anchor on a Line or PolyLine edge endpoint.
   * When a target shape is found, snaps the endpoint to the shape center and
   * computes `entryPoint` (intersection with shape border) for split rendering.
   * Called after the user releases an edge endpoint drag.
   */
  applyEndpointAnchor(edge: TEdge, pointIndex: number, point: TPoint): void {
    if (!EdgeOps.isLineEdge(edge) && !EdgeOps.isPolyEdge(edge) && !EdgeOps.isArcEdge(edge)) {
      return
    }
    const isStart = pointIndex === 0
    const isEnd = pointIndex === edge.vertices.length - 1
    if (!isStart && !isEnd) {
      return
    }

    const target = this.findSymbolAtPoint(point, edge.id)

    if (target !== undefined) {
      const center: TPoint = {
        ...(target as unknown as { bounds: TOBB }).bounds.center,
      }
      const anchor: TAnchor = {
        symbolId: target.id,
        normalizedX: 0.5,
        normalizedY: 0.5,
      }
      if (EdgeOps.isLineEdge(edge)) {
        if (isStart) {
          edge.start = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.end = center
          edge.endAnchor = anchor
        }
        EdgeLineOps.updateDerivedFields(edge)
      } else if (EdgeOps.isPolyEdge(edge)) {
        if (isStart) {
          edge.points[0] = center
          edge.startAnchor = anchor
        }
        if (isEnd) {
          edge.points[edge.points.length - 1] = center
          edge.endAnchor = anchor
        }
        EdgePolyLineOps.updateDerivedFields(edge)
      } else if (EdgeOps.isArcEdge(edge)) {
        // An arc has no independent start/end coordinate to overwrite directly — stretch the
        // ellipse (keeping the other endpoint fixed) so the anchored endpoint lands exactly on
        // the target's center, same as a manual endpoint drag.
        if (isStart) {
          Object.assign(edge, stretchArcEndpoint(edge, "start", center))
          edge.startAnchor = anchor
        }
        if (isEnd) {
          Object.assign(edge, stretchArcEndpoint(edge, "end", center))
          edge.endAnchor = anchor
        }
        EdgeArcOps.updateDerivedFields(edge)
      }
    } else {
      if (isStart) {
        edge.startAnchor = undefined
      }
      if (isEnd) {
        edge.endAnchor = undefined
      }
    }

    this.recomputeAllEntryPoints(edge)
  }

  /**
   * Visually reposition anchored edge endpoints by applying `matrix` to the
   * stored anchor point (original position) — no model update.
   * Call from transform `continue()` for real-time edge following.
   */
  drawAnchoredEdgesForMatrix(symbolIds: string[], matrix: MatrixTransform): void {
    if (symbolIds.length === 0 || !this.connectorConfiguration.followConnectedEdges) {
      return
    }
    const idSet = new Set(symbolIds)

    // Always recompute both anchor entry points using final endpoint positions —
    // even when only one shape is moving, the other endpoint's exit angle changes.
    const recomputeAnchor = (anchor: TAnchor, from: TPoint, to: TPoint): TAnchor => {
      const target = this.model.getRootSymbol(anchor.symbolId)
      if (!target || !ShapeOps.isShape(target)) {
        return anchor
      }
      const vertices = idSet.has(anchor.symbolId)
        ? (target as TShape).vertices.map((v) => matrix.applyToPoint(v))
        : (target as TShape).vertices
      return {
        ...anchor,
        entryPoint: this.computeEntryPoint(from, to, vertices),
      }
    }

    this.model.symbols.forEach((symbol) => {
      if (EdgeOps.isEdge(symbol) && EdgeOps.isArcEdge(symbol)) {
        let clone = symbol
        let changed = false
        // No `isShape` filter on the target here: neither the Line/PolyEdge preview branches
        // below nor the commit path (resolveAndUpdateAnchor) apply one, and a preview that
        // skips what the commit path moves makes the arc jump on pointer-up.
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const targetSymbol = this.model.getRootSymbol(symbol.startAnchor.symbolId)
          if (targetSymbol) {
            const box = OBBOps.toBox((targetSymbol as unknown as { bounds: TOBB }).bounds)
            const point = matrix.applyToPoint(resolveAnchorPoint(symbol.startAnchor!, box))
            clone = { ...clone, ...stretchArcEndpoint(clone, "start", point) }
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const targetSymbol = this.model.getRootSymbol(symbol.endAnchor.symbolId)
          if (targetSymbol) {
            const box = OBBOps.toBox((targetSymbol as unknown as { bounds: TOBB }).bounds)
            const point = matrix.applyToPoint(resolveAnchorPoint(symbol.endAnchor!, box))
            clone = { ...clone, ...stretchArcEndpoint(clone, "end", point) }
            changed = true
          }
        }
        if (changed) {
          EdgeArcOps.updateDerivedFields(clone)
          // Entry points must be refreshed from the STRETCHED geometry's own vertices, or they
          // go stale the instant the anchored shape moves — same "M ... Q ..." spike bug as an
          // un-recomputed entry point, just self-inflicted on every subsequent move instead of
          // only at first anchoring.
          const n = clone.vertices.length
          if (clone.startAnchor && n >= 2) {
            clone.startAnchor = recomputeAnchor(clone.startAnchor, clone.vertices[0], clone.vertices[1])
          }
          if (clone.endAnchor && n >= 2) {
            clone.endAnchor = recomputeAnchor(clone.endAnchor, clone.vertices[n - 1], clone.vertices[n - 2])
          }
          this.canvas.renderer.drawSymbol(clone)
        }
        return
      }

      if (!EdgeOps.isEdge(symbol)) {
        return
      }
      if (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol)) {
        return
      }

      let changed = false

      if (EdgeOps.isLineEdge(symbol)) {
        let start = symbol.start
        let end = symbol.end
        const startTargetSymbol =
          symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.startAnchor.symbolId)
            : undefined
        const endTargetSymbol =
          symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.endAnchor.symbolId)
            : undefined

        if (startTargetSymbol) {
          start = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.startAnchor!,
              OBBOps.toBox(
                (
                  startTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (endTargetSymbol) {
          end = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.endAnchor!,
              OBBOps.toBox(
                (
                  endTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (changed) {
          const cloneStartAnchor = symbol.startAnchor
            ? recomputeAnchor(symbol.startAnchor, start, end)
            : symbol.startAnchor
          const cloneEndAnchor = symbol.endAnchor ? recomputeAnchor(symbol.endAnchor, end, start) : symbol.endAnchor
          const clone = {
            ...symbol,
            start,
            end,
            startAnchor: cloneStartAnchor,
            endAnchor: cloneEndAnchor,
          }
          EdgeLineOps.updateDerivedFields(clone)
          this.canvas.renderer.drawSymbol(clone)
        }
      } else if (EdgeOps.isPolyEdge(symbol)) {
        const points = symbol.points.map((p) => ({
          ...p,
        }))
        const startTargetSymbol =
          symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.startAnchor.symbolId)
            : undefined
        const endTargetSymbol =
          symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)
            ? this.model.getRootSymbol(symbol.endAnchor.symbolId)
            : undefined

        if (startTargetSymbol) {
          points[0] = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.startAnchor!,
              OBBOps.toBox(
                (
                  startTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (endTargetSymbol) {
          points[points.length - 1] = matrix.applyToPoint(
            resolveAnchorPoint(
              symbol.endAnchor!,
              OBBOps.toBox(
                (
                  endTargetSymbol as {
                    bounds: TOBB
                  }
                ).bounds
              )
            )
          )
          changed = true
        }
        if (changed) {
          const n = points.length
          const cloneStartAnchor =
            symbol.startAnchor && n >= 2
              ? recomputeAnchor(symbol.startAnchor, points[0], points[1])
              : symbol.startAnchor
          const cloneEndAnchor =
            symbol.endAnchor && n >= 2
              ? recomputeAnchor(symbol.endAnchor, points[n - 1], points[n - 2])
              : symbol.endAnchor
          const clone = {
            ...symbol,
            points,
            startAnchor: cloneStartAnchor,
            endAnchor: cloneEndAnchor,
          }
          EdgePolyLineOps.updateDerivedFields(clone)
          this.canvas.renderer.drawSymbol(clone)
        }
      }
    })

    this.#followConnectedStrokes(idSet, matrix, /* commit */ false)
  }

  /**
   * Resolve an anchor to a world point, optionally using pre-transform bounds + matrix.
   * When matrix and preTransformBoundsById are provided (rotation case), resolves in the
   * pre-transform AABB then applies the matrix — this preserves the physical point on
   * the shape regardless of AABB size change. Also updates normalizedXY on the anchor
   * so subsequent transforms resolve correctly in the new AABB.
   */
  private resolveAndUpdateAnchor(
    anchor: TAnchor,
    matrix: MatrixTransform | undefined,
    preTransformBoundsById: Map<string, TOBB> | undefined
  ): { x: number; y: number } | undefined {
    const target = this.model.getRootSymbol(anchor.symbolId) as { bounds: TOBB } | undefined
    if (!target) {
      return undefined
    }
    const targetBox = OBBOps.toBox(target.bounds)
    if (matrix && preTransformBoundsById) {
      const preBounds = preTransformBoundsById.get(anchor.symbolId)
      if (preBounds) {
        const worldPoint = matrix.applyToPoint(resolveAnchorPoint(anchor, OBBOps.toBox(preBounds)))
        const { normalizedX, normalizedY } = computeNormalizedAnchor(worldPoint, targetBox)
        anchor.normalizedX = normalizedX
        anchor.normalizedY = normalizedY
        return worldPoint
      }
    }
    return resolveAnchorPoint(anchor, targetBox)
  }

  /**
   * Clear anchors from any edges in `symbols` that are being directly translated.
   * An anchored edge that the user explicitly moves becomes a free edge.
   * Covers all three anchor-carrying edge kinds (Line, PolyLine, Arc).
   */
  clearAnchoredEdgesFor(symbols: TSymbol[]): void {
    symbols.forEach((symbol) => {
      if (!EdgeOps.isEdge(symbol)) {
        return
      }
      if (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol) && !EdgeOps.isArcEdge(symbol)) {
        return
      }
      if (!symbol.startAnchor && !symbol.endAnchor) {
        return
      }
      symbol.startAnchor = undefined
      symbol.endAnchor = undefined
      EdgeOps.updateEdgeDerivedFields(symbol)
      this.model.updateSymbol(symbol)
      this.canvas.renderer.drawSymbol(symbol)
    })
  }

  /**
   * Recompute endpoints of all edges anchored to any of the given symbol IDs.
   * Called by transform managers after translate / resize / rotate.
   * Pass `matrix` and `preTransformBoundsById` when called from rotation so that
   * anchor resolution uses the pre-transform AABB rather than the post-rotation AABB.
   * @returns ids of the pre-convert edge strokes rigidly moved by this call — callers must add
   * them to their history entry and to their backend transform message.
   */
  updateAnchoredEdges(
    symbolIds: string[],
    matrix?: MatrixTransform,
    preTransformBoundsById?: Map<string, TOBB>
  ): TAnchoredEdgesUpdateResult {
    if (symbolIds.length === 0 || !this.connectorConfiguration.followConnectedEdges) {
      return { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }
    }
    this.logger.info("updateAnchoredEdges", {
      symbolIds,
    })

    const idSet = new Set(symbolIds)
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, not
    // transformed by a matrix relative to their own prior position — there's no "inverse" of
    // that to replay on undo, so every mutation here needs its own pre-mutation snapshot,
    // same as a gradient-followed raw stroke.
    const oldSymbols: TSymbol[] = []
    const newSymbols: TSymbol[] = []

    this.model.symbols.forEach((symbol) => {
      if (EdgeOps.isEdge(symbol) && EdgeOps.isArcEdge(symbol)) {
        let changed = false
        const oldSymbol = cloneSymbol(symbol)
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, matrix, preTransformBoundsById)
          if (point) {
            Object.assign(symbol, stretchArcEndpoint(symbol, "start", point))
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, matrix, preTransformBoundsById)
          if (point) {
            Object.assign(symbol, stretchArcEndpoint(symbol, "end", point))
            changed = true
          }
        }
        if (changed) {
          EdgeArcOps.updateDerivedFields(symbol)
          this.recomputeAllEntryPoints(symbol)
          this.canvas.renderer.drawSymbol(symbol)
          this.model.updateSymbol(symbol)
          oldSymbols.push(oldSymbol)
          newSymbols.push(symbol)
        }
        return
      }

      if (!EdgeOps.isEdge(symbol) || (!EdgeOps.isLineEdge(symbol) && !EdgeOps.isPolyEdge(symbol))) {
        return
      }

      let changed = false
      const oldSymbol = cloneSymbol(symbol)

      if (EdgeOps.isLineEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, matrix, preTransformBoundsById)
          if (point) {
            symbol.start = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, matrix, preTransformBoundsById)
          if (point) {
            symbol.end = point
            changed = true
          }
        }
        if (changed) {
          EdgeLineOps.updateDerivedFields(symbol)
          this.recomputeAllEntryPoints(symbol)
        }
      } else if (EdgeOps.isPolyEdge(symbol)) {
        if (symbol.startAnchor && idSet.has(symbol.startAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.startAnchor, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[0] = point
            changed = true
          }
        }
        if (symbol.endAnchor && idSet.has(symbol.endAnchor.symbolId)) {
          const point = this.resolveAndUpdateAnchor(symbol.endAnchor, matrix, preTransformBoundsById)
          if (point && symbol.points.length > 0) {
            symbol.points[symbol.points.length - 1] = point
            changed = true
          }
        }
        if (changed) {
          EdgePolyLineOps.updateDerivedFields(symbol)
          this.recomputeAllEntryPoints(symbol)
        }
      }

      if (changed) {
        this.canvas.renderer.drawSymbol(symbol)
        this.model.updateSymbol(symbol)
        oldSymbols.push(oldSymbol)
        newSymbols.push(symbol)
      }
    })

    // Raw-stroke follow only has a transform to apply when the caller supplies one —
    // Arc/Line/PolyEdge branches above don't need it (they reproject from the target's
    // already-updated model bounds), but freehand strokes have no per-point anchor formula.
    const strokeFollowResult = matrix
      ? this.#followConnectedStrokes(idSet, matrix, /* commit */ true, preTransformBoundsById)
      : { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }

    return {
      rigidStrokeIds: strokeFollowResult.rigidStrokeIds,
      oldSymbols: [...oldSymbols, ...strokeFollowResult.oldSymbols],
      newSymbols: [...newSymbols, ...strokeFollowResult.newSymbols],
    }
  }

  /**
   * Ids of the pre-convert edge strokes that would rigidly follow a transform of `symbolIds`.
   * Read-only counterpart of the follow pass, for transform managers that need the list *before*
   * mutating anything (history snapshots, backend stroke ids).
   */
  getFollowedStrokeIds(symbolIds: string[]): string[] {
    if (symbolIds.length === 0) {
      return []
    }
    return this.#collectFollowedStrokes(new Set(symbolIds)).map((f) => f.symbol.id)
  }

  /**
   * Like `getFollowedStrokeIds`, but only the rigidly-followed ones (both connected shapes
   * moving together — safe to fold into a uniform matrix-replay transform). Gradient-followed
   * strokes are excluded: their shift isn't uniform, so callers must snapshot and undo them via
   * `updateAnchoredEdges`'s `oldSymbols`/`newSymbols` instead, and must send their new content to
   * the backend via `client.replaceStrokes` rather than a uniform transform call.
   */
  getRigidFollowedStrokeIds(symbolIds: string[]): string[] {
    if (symbolIds.length === 0) {
      return []
    }
    return this.#collectFollowedStrokes(new Set(symbolIds))
      .filter((f) => f.mode === "rigid")
      .map((f) => f.symbol.id)
  }

  /**
   * Single source of truth for the pre-convert follow predicate: a raw ink stroke classified as
   * an Edge, anchored to exactly one shape block that is part of the moving set.
   * Dual-anchor edge strokes are skipped — independent per-endpoint repositioning isn't possible
   * on freehand ink without warping; they wait for Convert.
   * Strokes already in `idSet` are skipped too: the caller's own transform path owns them, and
   * following them as well would apply the matrix twice.
   */
  #collectFollowedStrokes(idSet: Set<string>): TFollowedStroke[] {
    if (!this.connectorConfiguration.followConnectedEdges) {
      return []
    }
    const isAnchorTargetMoving = (anchor: TAnchor): boolean => {
      const blockStrokeIds = this.canvas.jiix.getStrokesForElement(anchor.symbolId)
      return blockStrokeIds.some((id) => idSet.has(id)) || idSet.has(anchor.symbolId)
    }

    const followed: TFollowedStroke[] = []
    this.model.symbols.forEach((symbol) => {
      if (!isStroke(symbol) || symbol.jiixBlockType !== "Edge" || idSet.has(symbol.id)) {
        return
      }
      const anchors = [symbol.startAnchor, symbol.endAnchor].filter((a): a is TAnchor => !!a)
      if (anchors.length === 0) {
        return
      }
      const movingAnchors = anchors.filter(isAnchorTargetMoving)
      if (movingAnchors.length === 0) {
        return
      }
      if (anchors.length === 2 && movingAnchors.length === 2) {
        // Both connected shapes are moving together (same matrix) — nothing shifts
        // relatively, so the whole stroke can move as one rigid body.
        followed.push({ symbol, mode: "rigid" })
      } else {
        // Exactly one connected shape is moving — reposition points on a gradient
        // instead of translating the whole stroke, since rigidly moving it would
        // drag the end anchored to the shape that ISN'T moving (or the free end of
        // a single-anchor edge) along for no reason.
        followed.push({ symbol, mode: "gradient", movingAnchor: movingAnchors[0] })
      }
    })
    return followed
  }

  /**
   * Pre-convert rigid-follow: every point of each followed edge stroke gets the same matrix as
   * the block it is anchored to.
   * @returns the ids of the strokes mutated in the model (empty for the preview pass).
   */
  #followConnectedStrokes(
    idSet: Set<string>,
    matrix: MatrixTransform,
    commit: boolean,
    preTransformBoundsById?: Map<string, TOBB>
  ): TAnchoredEdgesUpdateResult {
    const followed = this.#collectFollowedStrokes(idSet)
    const rigidStrokeIds: string[] = []
    const oldSymbols: TStroke[] = []
    const newSymbols: TStroke[] = []

    // Gradient-mode strokes are grouped by their edge's own jiixBlockId so a multi-stroke edge
    // (e.g. a line's bar plus its arrowhead chevron) shares ONE near/far distance range instead
    // of each stroke computing its own in isolation — a short chevron has no reliable "own"
    // direction, but it does have a position relative to the rest of its block.
    const rigidEntries: TFollowedStroke[] = []
    const gradientGroups = new Map<string, TFollowedStroke[]>()
    followed.forEach((entry) => {
      if (entry.mode === "rigid") {
        rigidEntries.push(entry)
        return
      }
      const blockId = entry.symbol.jiixBlockId ?? entry.symbol.id
      const group = gradientGroups.get(blockId) ?? []
      group.push(entry)
      gradientGroups.set(blockId, group)
    })

    const newPointsByStrokeId = new Map<string, TPoint[]>()
    rigidEntries.forEach(({ symbol }) => {
      newPointsByStrokeId.set(
        symbol.id,
        symbol.pointers.map((p) => matrix.applyToPoint(p))
      )
    })
    gradientGroups.forEach((entries) => {
      const groupPoints = this.#computeGroupGradientPoints(
        entries.map((entry) => entry.symbol),
        matrix,
        entries[0].movingAnchor!,
        preTransformBoundsById
      )
      groupPoints.forEach((points, strokeId) => newPointsByStrokeId.set(strokeId, points))
    })

    followed.forEach(({ symbol, mode }) => {
      const newPoints = newPointsByStrokeId.get(symbol.id)!

      if (commit) {
        // A rigid (uniform matrix) move is safe to undo by re-applying the inverse matrix, so it
        // can ride along in the caller's own matrix-replay history entry. A gradient move is NOT
        // uniform — undoing it requires restoring this pre-mutation snapshot directly instead.
        const oldSymbol = mode === "gradient" ? (cloneSymbol(symbol) as TStroke) : undefined

        symbol.pointers.forEach((p, i) => {
          p.x = +newPoints[i].x.toFixed(3)
          p.y = +newPoints[i].y.toFixed(3)
        })
        StrokeOps.updateBounds(symbol)
        this.canvas.renderer.drawSymbol(symbol)
        this.model.updateSymbol(symbol)

        if (mode === "rigid") {
          rigidStrokeIds.push(symbol.id)
        } else {
          oldSymbols.push(oldSymbol!)
          newSymbols.push(symbol)
        }
      } else {
        const clone = {
          ...symbol,
          pointers: symbol.pointers.map((p, i) => ({
            ...p,
            x: +newPoints[i].x.toFixed(3),
            y: +newPoints[i].y.toFixed(3),
          })),
        }
        this.canvas.renderer.drawSymbol(clone)
      }
    })

    return commit ? { rigidStrokeIds, oldSymbols, newSymbols } : { rigidStrokeIds: [], oldSymbols: [], newSymbols: [] }
  }

  /**
   * Center of a pre-convert shape block, from the union of its raw strokes' bounds.
   * Used as the reference point for gradient-follow direction — there's no single
   * symbol to read `.bounds` from pre-convert, only a block of strokes sharing a jiixBlockId.
   */
  #resolveBlockCenter(blockId: string, preTransformBoundsById?: Map<string, TOBB>): TPoint | undefined {
    const boxes = this.canvas.jiix
      .getStrokesForElement(blockId)
      .map(
        (id) =>
          preTransformBoundsById?.get(id) ??
          (this.model.getRootSymbol(id) as (TSymbol & { bounds: TOBB }) | undefined)?.bounds
      )
      .filter((b): b is TOBB => !!b)
      .map((b) => OBBOps.toBox(b))
    if (boxes.length === 0) {
      return undefined
    }
    const box = BoxOps.createFromBoxes(boxes)
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  // All points of all strokes sharing the same jiixBlockId share one near/far distance range,
  // computed against the moving target's center — a lone short stroke (e.g. an arrowhead
  // chevron) has no reliable "own" direction, but a position relative to its whole block.
  #computeGroupGradientPoints(
    strokes: TStroke[],
    matrix: MatrixTransform,
    movingAnchor: TAnchor,
    preTransformBoundsById?: Map<string, TOBB>
  ): Map<string, TPoint[]> {
    const identity = (): Map<string, TPoint[]> =>
      new Map(strokes.map((s) => [s.id, s.pointers.map((p) => matrix.applyToPoint(p))]))

    const allPoints = strokes.flatMap((s) => s.pointers)
    // Must resolve the target's PRE-transform center: by commit time the target has usually
    // already been mutated to its final position (applyAndDraw runs before updateAnchoredEdges),
    // so resolving from live model bounds here would use a different reference point than the
    // preview pass did (which runs before the target moves) — same final matrix, different
    // target center, different weights, so the committed shape would visibly snap to a
    // different form than what was just shown while dragging.
    const targetCenter = this.#resolveBlockCenter(movingAnchor.symbolId, preTransformBoundsById)
    if (allPoints.length <= 1 || !targetCenter) {
      return identity()
    }

    const distances = allPoints.map((p) => computeDistance(p, targetCenter))
    const groupMin = Math.min(...distances)
    const groupMax = Math.max(...distances)
    const range = groupMax - groupMin

    const weightOf = (point: TPoint): number => {
      if (range <= 0) {
        return 1
      }
      return 1 - (computeDistance(point, targetCenter) - groupMin) / range
    }

    return new Map(
      strokes.map((s) => [
        s.id,
        s.pointers.map((p) => {
          const weight = weightOf(p)
          const transformed = matrix.applyToPoint(p)
          return {
            x: p.x + weight * (transformed.x - p.x),
            y: p.y + weight * (transformed.y - p.y),
          }
        }),
      ])
    )
  }
}
