import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TPoint } from "@/core/geometry"
import { BoxOps, computeAngleRadian, MatrixTransform, type TOBB } from "@/core/geometry"
import { convertDegreeToRadian, convertRadianToDegree, TWO_PI } from "@/core/math"
import type { TIIHistoryChanges } from "@/history"
import type { TEdge, TMath, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { cloneSymbol } from "@/symbol"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IIRotationManager extends IIAbstractTransformManager {
  protected managerName = "IIRotationManager"
  protected transformName = "rotate"
  center!: TPoint
  origin!: TPoint

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * Five one-liners, for the reason `IITranslateManager`'s are: the behaviour lives on each
   * symbol's util now, and these survive only while `IIAbstractTransformManager` still declares
   * them abstract. IIC-2014 removes both.
   *
   * `center` was gesture state read straight off `this`, declared `center!: TPoint` and undefined
   * until a gesture started. Passing it in retires that definite-assignment assertion for the
   * behaviour that needed it.
   */
  #throughUtil<T extends TSymbol>(symbol: T, matrix: MatrixTransform): T {
    symbolRegistry.getUtilFor(symbol).rotate(symbol, { matrix, center: this.center, typeset: this.canvas.typeset })
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

  rotateElement(id: string, degree: number): void {
    this.logger.info("rotateElement", {
      id,
      degree,
    })
    this.canvas.renderer.setAttribute(id, "transform", `rotate(${degree})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Rotating")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    const boundingBox = BoxOps.createFromPoints(this.model.symbolsSelected.flatMap((s) => s.vertices))

    this.center = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2,
    }
    this.origin = origin
    this.setTransformOrigin(this.interactElementsGroup.id, this.center.x, this.center.y)
    this.model.symbolsSelected.forEach((s) => {
      this.setTransformOrigin(s.id, this.center.x, this.center.y)
    })
  }

  continue(point: TPoint): number {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = Math.round(convertRadianToDegree(computeAngleRadian(this.origin, this.center, point)))

    angleDegree = this.canvas.snaps.snapRotation(angleDegree)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }

    this.rotateElement(this.interactElementsGroup.id, angleDegree)
    this.model.symbolsSelected.forEach((s) => {
      this.rotateElement(s.id, angleDegree)
    })
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.rotateElement(id, angleDegree)
    })
    const angleRad = convertDegreeToRadian(angleDegree)
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    this.canvas.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return angleDegree
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Rotating")
    const angleDegree = this.continue(point)
    const angleRad = convertDegreeToRadian(angleDegree) % TWO_PI
    // Queried before anything is mutated: the pre-convert edge strokes that will rigidly follow
    // this rotation need a pre-transform snapshot in history, like the selection itself. Gradient-
    // followed strokes are excluded — their shift isn't a uniform rotation, so they get their own
    // pre-mutation snapshot via `updated` below instead, like the anchored converted edges.
    const followedStrokeIds = this.canvas.connector.getRigidFollowedStrokeIds(
      this.model.symbolsSelected.map((s) => s.id)
    )
    const oldSymbols = [
      ...this.model.symbolsSelected,
      ...this.resolveFollowedSymbols(followedStrokeIds, this.model.symbolsSelected),
    ].map((s) => cloneSymbol(s))
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    const preTransformBoundsById = new Map<string, TOBB>()
    this.model.symbolsSelected.forEach((s) => {
      const bounds = (s as unknown as { bounds?: TOBB }).bounds
      if (bounds) {
        preTransformBoundsById.set(s.id, {
          ...bounds,
          center: { ...bounds.center },
        })
      }
    })
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
      this.canvas.client.transformRotate(
        [...new Set([...strokesFromSymbols.map((s) => s.id), ...followedStrokeIds])],
        angleRad,
        this.center.x,
        this.center.y
      ),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ])
    const changes: TIIHistoryChanges = {
      rotate: [
        {
          symbols: oldSymbols,
          angle: angleRad,
          center: { ...this.center },
        },
      ],
    }
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, and
    // gradient-followed raw strokes are reshaped non-uniformly — neither has an inverse-rotation
    // to replay on undo, so both need their pre-mutation snapshot restored directly via `updated`.
    if (anchoredNewSymbols.length) {
      changes.updated = { oldSymbols: anchoredOldSymbols, newSymbols: anchoredNewSymbols }
    }
    this.canvas.history.push(changes)
    this.finalizeTransform()
  }
}
