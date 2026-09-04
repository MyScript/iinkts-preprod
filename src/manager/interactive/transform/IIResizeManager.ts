import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { ResizeDirection } from "@/Constants"
import type { TBox, TPoint } from "@/core/geometry"
import { BoxOps, MatrixTransform, type TOBB } from "@/core/geometry"
import type { TIIHistoryChanges } from "@/history"
import type { TEdge, TMath, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { cloneSymbol, isMath, isText } from "@/symbol"
import { ShapeOps } from "@/symbol/shape/Shape"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

const isEasternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast].includes(direction)

const isWesternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest].includes(direction)

const isNorthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest].includes(direction)

const isSouthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest].includes(direction)

/**
 * @group Manager
 */
export class IIResizeManager extends IIAbstractTransformManager {
  protected managerName = "IIResizeManager"
  protected transformName = "resize"
  direction!: ResizeDirection
  boundingBox!: TBox
  transformOrigin!: TPoint
  keepRatio = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * Five one-liners, like the other two managers'. They survive only while
   * `IIAbstractTransformManager` still declares them abstract; IIC-2014 removes both.
   *
   * `transformOrigin` was gesture state read off `this`. It is a context field now, which is what
   * lets the ellipse and the arc scale their centre about it from inside their own util.
   */
  #throughUtil<T extends TSymbol>(symbol: T, matrix: MatrixTransform): T {
    this.logger.debug("applyToSymbol", { symbol })
    symbolRegistry.getUtilFor(symbol).resize(symbol, { matrix, origin: this.transformOrigin })
    return symbol
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke {
    return this.#throughUtil(stroke, matrix)
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape {
    return this.#throughUtil(shape, matrix)
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge {
    return this.#throughUtil(edge, matrix)
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText {
    return this.#throughUtil(text, matrix)
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath {
    return this.#throughUtil(math, matrix)
  }

  scaleElement(id: string, sx: number, sy: number): void {
    this.logger.info("scaleElement", {
      id,
      sx,
      sy,
    })
    this.canvas.renderer.setAttribute(id, "transform", `scale(${sx},${sy})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Resizing")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    this.keepRatio = this.model.symbolsSelected.some(
      (s) => isText(s) || isMath(s) || (ShapeOps.isShape(s) && ShapeOps.isCircleShape(s))
    )

    this.transformOrigin = origin
    this.boundingBox = BoxOps.createFromPoints(this.model.symbolsSelected.flatMap((s) => s.vertices))
    this.setTransformOrigin(this.interactElementsGroup!.id, this.transformOrigin.x, this.transformOrigin.y)
    this.model.symbolsSelected.forEach((s) => {
      this.setTransformOrigin(s.id, this.transformOrigin.x, this.transformOrigin.y)
    })
  }

  continue(point: TPoint): {
    scaleX: number
    scaleY: number
  } {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't resize, you must call start before")
    }
    const localPoint = point
    const horizontalResize = [
      ResizeDirection.East,
      ResizeDirection.NorthEast,
      ResizeDirection.SouthEast,
      ResizeDirection.West,
      ResizeDirection.NorthWest,
      ResizeDirection.SouthWest,
    ].includes(this.direction)
    const verticalResize = [
      ResizeDirection.North,
      ResizeDirection.NorthEast,
      ResizeDirection.NorthWest,
      ResizeDirection.South,
      ResizeDirection.SouthEast,
      ResizeDirection.SouthWest,
    ].includes(this.direction)
    const { x, y } = this.canvas.snaps.snapResize(point, horizontalResize, verticalResize)
    localPoint.x = x
    localPoint.y = y

    let deltaX = 0,
      deltaY = 0
    if (isEasternResize(this.direction)) {
      deltaX = localPoint.x - (this.boundingBox.x + this.boundingBox.width)
    } else if (isWesternResize(this.direction)) {
      deltaX = this.boundingBox.x - localPoint.x
    }
    if (isNorthernResize(this.direction)) {
      deltaY = this.boundingBox.y - localPoint.y
    } else if (isSouthernResize(this.direction)) {
      deltaY = localPoint.y - (this.boundingBox.y + this.boundingBox.height)
    }

    let scaleX = this.boundingBox.width ? 1 + deltaX / this.boundingBox.width : 1
    let scaleY = this.boundingBox.height ? 1 + deltaY / this.boundingBox.height : 1

    if (this.keepRatio) {
      if ([ResizeDirection.North, ResizeDirection.South].includes(this.direction)) {
        scaleX = scaleY
      } else if ([ResizeDirection.East, ResizeDirection.West].includes(this.direction)) {
        scaleY = scaleX
      } else {
        scaleX = Math.max(scaleX, scaleY)
        scaleY = scaleX
      }
    }
    this.scaleElement(this.interactElementsGroup.id, scaleX, scaleY)
    this.model.symbolsSelected.forEach((s) => {
      this.scaleElement(s.id, scaleX, scaleY)
    })
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.scaleElement(id, scaleX, scaleY)
    })
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
    this.canvas.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return { scaleX, scaleY }
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Resizing")
    const { scaleX, scaleY } = this.continue(point)
    this.canvas.snaps.clearSnapToElementLines()
    // Queried before anything is mutated: the pre-convert edge strokes that will rigidly follow
    // this resize need a pre-transform snapshot in history, like the selection itself. Gradient-
    // followed strokes are excluded — their shift isn't a uniform scale, so they get their own
    // pre-mutation snapshot via `updated` below instead, like the anchored converted edges.
    const followedStrokeIds = this.canvas.connector.getRigidFollowedStrokeIds(
      this.model.symbolsSelected.map((s) => s.id)
    )
    const oldSymbols = [
      ...this.model.symbolsSelected,
      ...this.resolveFollowedSymbols(followedStrokeIds, this.model.symbolsSelected),
    ].map((s) => cloneSymbol(s))
    // Snapshotted before applyAndDraw mutates the selection below: gradient-follow needs the
    // moving target's PRE-transform center (same reference point the drag preview used), not
    // its already-resized bounds, or the committed shape would snap to a different form than
    // what was just shown while dragging.
    const preTransformBoundsById = new Map<string, TOBB>()
    this.model.symbolsSelected.forEach((s) => {
      const bounds = (s as unknown as { bounds?: TOBB }).bounds
      if (bounds) {
        preTransformBoundsById.set(s.id, { ...bounds, center: { ...bounds.center } })
      }
    })
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
    this.applyAndDraw(this.model.symbolsSelected, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(this.model.symbolsSelected, matrix)
    const { oldSymbols: anchoredOldSymbols, newSymbols: anchoredNewSymbols } =
      this.canvas.connector.updateAnchoredEdges(
        this.model.symbolsSelected.map((s) => s.id),
        matrix,
        preTransformBoundsById
      )
    const strokesFromSymbols = this.canvas.extractStrokesFromSymbols(this.model.symbolsSelected)
    await Promise.all([
      this.canvas.client.transformScale(
        [...new Set([...strokesFromSymbols.map((s) => s.id), ...followedStrokeIds])],
        scaleX,
        scaleY,
        this.transformOrigin.x,
        this.transformOrigin.y
      ),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ])
    const changes: TIIHistoryChanges = {
      scale: [
        {
          symbols: oldSymbols,
          origin: { ...this.transformOrigin },
          scaleX,
          scaleY,
        },
      ],
    }
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, and
    // gradient-followed raw strokes are reshaped non-uniformly — neither has an inverse-scale to
    // replay on undo, so both need their pre-mutation snapshot restored directly via `updated`.
    if (anchoredNewSymbols.length) {
      changes.updated = { oldSymbols: anchoredOldSymbols, newSymbols: anchoredNewSymbols }
    }
    this.canvas.history.push(changes)
    this.finalizeTransform()
  }
}
