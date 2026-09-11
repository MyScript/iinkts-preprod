import type { TBox } from "@/core/geometry"
import type { TPointer, TPointerImport } from "@/core/geometry"
import type { TPoint, TSegment } from "@/core/geometry"
import {
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  resolvePointerDelta,
  resolveStrokeOrigin,
  type TOBB,
} from "@/core/geometry"
import {
  computeAngleAxeRadian,
  computeDistance,
  computeLinksPointers,
  computeMiddlePointer,
  getClosestPoint,
} from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import { createUUID } from "@/core/std"
import type { TStyle } from "@/style"
import { computeOutlinePointers, readNibOverrides } from "@/style"
import { mergeSymbolStyle } from "@/style"
import type { DecoratorKind } from "@/symbol/decorator/Decorator"
import type { TAnchor } from "@/symbol/edge/Anchor"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
/**
 * @group Symbol
 */
export type TStrokeCapture = {
  id: string
  pointerType: string
  pointers: TPointer[]
}

/**
 * @group Symbol
 */
export type TStroke = TBaseSymbol &
  TStrokeCapture & {
    readonly type: SymbolType.Stroke
    style: TStyle

    // JIIX Block metadata
    jiixBlockId?: string
    jiixBlockType?: "Text" | "Math" | "Node" | "Edge" | "Decorator"

    // Connection metadata — pre-convert: symbolId holds a jiixBlockId (target shape block).
    // Populated by IISynchronizerManager from JIIX connected/ports, always overwritten on sync.
    startAnchor?: TAnchor
    endAnchor?: TAnchor

    // Computation metadata
    isSolverOutput?: boolean

    // Decorator metadata
    decoratorKind?: DecoratorKind
  }

/**
 * A stroke as read from a document. Identical to a deep-partial {@link TStroke} except that its
 * pointers may still carry the absolute `t` written before pointers stored a delta — which is what
 * lets {@link StrokeOps.createFromPartial} open a document saved by an earlier version.
 * @group Symbol
 */
export type TStrokeImport = Omit<TPartialDeep<TStroke>, "pointers"> & { pointers?: (TPointerImport | undefined)[] }

/**
 * @group Symbol
 * @summary Check if symbol is a stroke
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke
 */
export function isStroke(symbol: TBaseSymbol): symbol is TStroke {
  return symbol.type === SymbolType.Stroke
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Math JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Math JIIX block type
 */
export function isRecognizedMath(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Math"
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Solver Output JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Solver Output JIIX block type
 */
export function isStrokeSolverOutput(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.isSolverOutput === true
}

/**
 * @group Symbol
 * @summary Check if symbol is a stroke with Text JIIX metadata
 * @param symbol - Symbol to check
 * @returns True if symbol is a stroke with Text JIIX block type
 */
export function isRecognizedText(symbol: TBaseSymbol): symbol is TStroke {
  return isStroke(symbol) && symbol.jiixBlockType === "Text"
}

/**
 * @group Symbol
 */
export const StrokeOps = {
  /**
   * @param creationTime - Epoch instant the stroke began, defaulting to now. Pass the instant the
   * capture actually started: it is the origin every pointer's {@link TPointer.dt} counts from, so
   * it is what turns them back into the absolute times the recognizer orders strokes by.
   */
  create(style?: TPartialDeep<TStyle>, pointerType = "pen", creationTime?: number): TStroke {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const pointers: TPointer[] = []
    return {
      type: SymbolType.Stroke,
      id: `${SymbolType.Stroke}-${createUUID()}`,
      style: mergedStyle,
      creationTime: creationTime ?? now,
      modificationDate: now,
      pointerType,
      pointers,
      transform: MatrixTransform.identity(),
    }
  },

  computeBounds(stroke: TStroke): TOBB {
    return OBBOps.createFromPoints(stroke.pointers)
  },

  computeSnapPoints(bounds: TOBB): TPoint[] {
    return OBBOps.getSnapPoints(bounds)
  },

  computeEdges(stroke: TStroke): TSegment[] {
    return stroke.pointers.slice(0, -1).map((p, i) => ({
      p1: p,
      p2: stroke.pointers[i + 1],
    }))
  },

  /** A stroke's vertices are its pointers verbatim — the same array, not a copy. */
  computeVertices(stroke: TStroke): TPointer[] {
    return stroke.pointers
  },

  /** Path length: the sum of the distances between consecutive pointers. */
  computeLength(stroke: TStroke): number {
    return stroke.pointers.reduce((sum, ptr, idx, arr) => (idx === 0 ? 0 : sum + computeDistance(ptr, arr[idx - 1])), 0)
  },

  _filterPointByAcquisitionDelta(stroke: TStroke, point: TPointer): boolean {
    if (stroke.pointers.length === 0) {
      return true
    }
    const lastPointer = stroke.pointers.at(-1)!
    const delta: number = 2 + (stroke.style.width || 1) / 4
    return Math.abs(lastPointer.x - point.x) >= delta || Math.abs(lastPointer.y - point.y) >= delta
  },

  addPointer(stroke: TStroke, pointer: TPointer): void {
    if (StrokeOps._filterPointByAcquisitionDelta(stroke, pointer)) {
      // `p` is left exactly as the device reported it. It used to be overwritten here with a value
      // derived from the gap to the previous pointer, which made the drawn thickness depend on how
      // densely the stroke happened to be sampled - so the same gesture rendered differently under
      // main-thread load. The renderer derives width from speed instead, at draw time.
      stroke.pointers.push(pointer)
      stroke.modificationDate = Date.now()
    }
  },

  overlaps(stroke: TStroke, box: TBox): boolean {
    return stroke.pointers.some(
      (p) => p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height
    )
  },

  split(strokeToSplit: TStroke, i: number): { before: TStroke; after: TStroke } {
    // Both halves keep the origin of the stroke they came from. Their pointers still carry the
    // `dt` they were captured with, which counts from that origin - give a half a fresh
    // `creationTime` and every one of its points would claim to have been drawn just now.
    const { style, pointerType, creationTime } = strokeToSplit
    const before = StrokeOps.create(style, pointerType, creationTime)
    before.pointers.push(...strokeToSplit.pointers.slice(0, i))

    const after = StrokeOps.create(style, pointerType, creationTime)
    after.pointers.push(...strokeToSplit.pointers.slice(i))

    return { before, after }
  },

  substract(stroke: TStroke, partStroke: TStroke): { before?: TStroke; after?: TStroke } {
    if (!StrokeOps.computeLength(partStroke)) {
      return { before: stroke }
    }
    const result: {
      before?: TStroke
      after?: TStroke
    } = {}
    const lastPointBeforeStroke = {
      x: partStroke.pointers[0].x,
      y: partStroke.pointers[0].y,
    }
    const closestLastPointBeforeStroke = getClosestPoint(stroke.pointers, lastPointBeforeStroke)
    if (closestLastPointBeforeStroke.index > -1) {
      const newStrokes = StrokeOps.split(stroke, closestLastPointBeforeStroke.index)
      result.before = newStrokes.before
      result.after = newStrokes.after
    }
    const strokeAfter = result.after || stroke
    const firstPointAfterStroke = {
      x: partStroke.pointers.at(-1)!.x,
      y: partStroke.pointers.at(-1)!.y,
    }
    const closestFirstPointStrokeAfter = getClosestPoint(strokeAfter.pointers, firstPointAfterStroke)
    if (closestFirstPointStrokeAfter.index > -1) {
      const newStrokes = StrokeOps.split(strokeAfter, closestFirstPointStrokeAfter.index)
      result.after = newStrokes.after
    }
    if (!result.before?.pointers.length) {
      result.before = undefined
    }
    if (!result.after?.pointers.length) {
      result.after = undefined
    }
    return result
  },

  createFromPartial(partial: TStrokeImport): TStroke {
    if (!partial.pointers?.length) {
      throw new Error(`not pointers`)
    }
    // Keeping the original origin matters as much as keeping the pointers: it is what places this
    // stroke against the others on the timeline. Dropped, every imported stroke would look like it
    // was written the instant the document was opened, all at once.
    const stroke = StrokeOps.create(
      partial.style,
      partial.pointerType,
      resolveStrokeOrigin(partial.pointers ?? [], partial.creationTime)
    )
    if (partial.id) {
      stroke.id = partial.id
    }
    stroke.transform = mergeSymbolTransform(partial.transform)
    stroke.isSolverOutput = partial.isSolverOutput
    stroke.jiixBlockId = partial.jiixBlockId
    const errors: string[] = []
    let flag = true
    const sourcePointers = partial.pointers ?? []
    sourcePointers.forEach((pp, pIndex) => {
      if (!pp) {
        errors.push(`no pointer at ${pIndex}`)
        flag = false
        return
      }
      const pointer: TPointer = {
        p: pp.p || 1,
        dt: resolvePointerDelta(sourcePointers, pIndex),
        x: 0,
        y: 0,
      }
      if (pp?.x == undefined || pp?.x == null) {
        errors.push(`no x at pointer at ${pIndex}`)
        flag = false
        return
      } else {
        pointer.x = pp.x
      }
      if (pp?.y == undefined || pp?.y == null) {
        errors.push(`no y at pointer at ${pIndex}`)
        flag = false
        return
      } else {
        pointer.y = pp.y
      }
      if (flag) {
        StrokeOps.addPointer(stroke, pointer)
      }
    })
    if (errors.length) {
      throw new Error(errors.join(" and "))
    }
    return stroke
  },

  _getArcPath(center: TPointer, radius: number): string {
    return [
      `M ${center.x} ${center.y}`,
      `m ${-radius} 0`,
      `a ${radius} ${radius} 0 1 0 ${radius * 2} 0`,
      `a ${radius} ${radius} 0 1 0 ${-(radius * 2)} 0`,
    ].join(" ")
  },

  _getLinePath(begin: TPointer, end: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, end), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `L ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `L ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  },

  _getFinalPath(begin: TPointer, end: TPointer, width: number): string {
    const ARCSPLIT = 6
    const angle = computeAngleAxeRadian(begin, end)
    const linkPoints = computeLinksPointers(end, angle, width)
    const parts = [`M ${linkPoints[0].x} ${linkPoints[0].y}`]
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - i * (Math.PI / ARCSPLIT)
      const x = +(end.x - end.p * width * Math.sin(newAngle)).toFixed(3)
      const y = +(end.y + end.p * width * Math.cos(newAngle)).toFixed(3)
      parts.push(`L ${x} ${y}`)
    }
    return parts.join(" ")
  },

  _getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, central), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(central, end), width)
    const linkPoints3 = computeLinksPointers(central, computeAngleAxeRadian(begin, end), width)
    return [
      `M ${linkPoints1[0].x} ${linkPoints1[0].y}`,
      `Q ${linkPoints3[0].x} ${linkPoints3[0].y} ${linkPoints2[0].x} ${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x} ${linkPoints2[1].y}`,
      `Q ${linkPoints3[1].x} ${linkPoints3[1].y} ${linkPoints1[1].x} ${linkPoints1[1].y}`,
    ].join(" ")
  },

  getSVGPath(stroke: TStroke): string {
    const STROKE_LENGTH = stroke.pointers.length
    if (!STROKE_LENGTH) {
      return ""
    }
    const STROKE_WIDTH = stroke.style.width
    const NB_QUADRATICS = STROKE_LENGTH - 2
    // Width comes from the pen's speed, computed here rather than read off the stored pointers:
    // `p` on a stored pointer is what the device measured, not a drawing instruction.
    const pointers = computeOutlinePointers(
      stroke.pointers,
      stroke.pointerType,
      stroke.style.pen,
      readNibOverrides(stroke.style)
    )
    const firstPoint = pointers[0]
    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(StrokeOps._getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(StrokeOps._getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(StrokeOps._getLinePath(firstPoint, computeMiddlePointer(firstPoint, pointers[1]), STROKE_WIDTH))
      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePointer(pointers[i], pointers[i + 1])
        const end = computeMiddlePointer(pointers[i + 1], pointers[i + 2])
        const central = pointers[i + 1]
        parts.push(StrokeOps._getQuadraticPath(begin, end, central, STROKE_WIDTH))
      }
      const beforeLastPoint = pointers[STROKE_LENGTH - 2]
      const lastPoint = pointers[STROKE_LENGTH - 1]
      parts.push(StrokeOps._getLinePath(computeMiddlePointer(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(StrokeOps._getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  },
}
