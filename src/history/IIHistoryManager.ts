import type { TPoint } from "@/core/geometry"
import type { TPartialDeep } from "@/core/std"
import type { IIModel } from "@/model"
import type { TStyle } from "@/style"
import type { TStroke, TSymbol } from "@/symbol"
import { extractStrokes } from "@/symbol"
import type { TMatrixTransform } from "@/transform"
import { MatrixTransform } from "@/transform"

import { AbstractDiffHistoryManager } from "./AbstractDiffHistoryManager"

/**
 * @group History
 */
export type TIIHistoryChanges = {
  added?: TSymbol[]
  updated?: {
    oldSymbols: TSymbol[]
    newSymbols: TSymbol[]
  }
  erased?: TSymbol[]
  replaced?: {
    oldSymbols: TSymbol[]
    newSymbols: TSymbol[]
  }
  matrix?: {
    symbols: TSymbol[]
    matrix: TMatrixTransform
  }
  translate?: {
    symbols: TSymbol[]
    tx: number
    ty: number
  }[]
  scale?: {
    symbols: TSymbol[]
    scaleX: number
    scaleY: number
    origin: TPoint
  }[]
  rotate?: {
    symbols: TSymbol[]
    angle: number
    center: TPoint
  }[]
  style?: {
    symbols: TSymbol[]
    // one full style/fontSize per symbol (parallel to `symbols`), since a batch can start
    // from heterogeneous styles - a single shared before/after value can't reverse that.
    oldStyles?: TPartialDeep<TStyle>[]
    newStyles?: TPartialDeep<TStyle>[]
    oldFontSizes?: (number | undefined)[]
    newFontSizes?: (number | undefined)[]
  }
  order?: {
    symbols: TSymbol[]
    position: "first" | "last" | "forward" | "backward"
  }
}

/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
export type TIIHistoryBackendChanges = {
  added?: TStroke[]
  erased?: TStroke[]
  replaced?: {
    oldStrokes: TStroke[]
    newStrokes: TStroke[]
  }
  matrix?: {
    strokes: TStroke[]
    matrix: TMatrixTransform
  }
  translate?: {
    strokes: TStroke[]
    tx: number
    ty: number
  }[]
  scale?: {
    strokes: TStroke[]
    scaleX: number
    scaleY: number
    origin: TPoint
  }[]
  rotate?: {
    strokes: TStroke[]
    angle: number
    center: TPoint
  }[]
}

/**
 * @group History
 * @remarks converts symbol-level history changes into the stroke-level format the backend
 * understands, so undo/redo can be replayed as a fallback list of explicit modifications.
 */
export function extractIIBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges {
  const backendChanges: TIIHistoryBackendChanges = {}
  backendChanges.added = extractStrokes(changes.added)
  backendChanges.erased = extractStrokes(changes.erased)

  const oldStrokes = extractStrokes(changes.updated?.oldSymbols).concat(extractStrokes(changes.replaced?.oldSymbols))
  const newStrokes = extractStrokes(changes.updated?.newSymbols).concat(extractStrokes(changes.replaced?.newSymbols))
  if (oldStrokes.length && newStrokes.length) {
    backendChanges.replaced = {
      oldStrokes,
      newStrokes,
    }
  } else {
    backendChanges.added.push(...newStrokes)
    backendChanges.erased.push(...oldStrokes)
  }

  if (changes.matrix) {
    backendChanges.matrix = {
      strokes: extractStrokes(changes.matrix.symbols),
      matrix: changes.matrix.matrix,
    }
  }

  if (changes.translate?.length) {
    backendChanges.translate = []
    changes.translate.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.translate!.push({
          strokes,
          tx: tr.tx,
          ty: tr.ty,
        })
      }
    })
  }
  if (changes.scale?.length) {
    backendChanges.scale = []
    changes.scale.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.scale!.push({
          strokes,
          origin: tr.origin,
          scaleX: tr.scaleX,
          scaleY: tr.scaleY,
        })
      }
    })
  }
  if (changes.rotate?.length) {
    backendChanges.rotate = []
    changes.rotate.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.rotate!.push({
          strokes,
          center: tr.center,
          angle: tr.angle,
        })
      }
    })
  }
  return backendChanges
}

/**
 * @group History
 */
export class IIHistoryManager extends AbstractDiffHistoryManager<TIIHistoryChanges> {
  #liveModel?: IIModel

  // context.empty must reflect whether the canvas is actually empty (ClearMenuAction disables
  // Clear based on it), not just "no changes recorded at this stack index" - so this reads the
  // live model instead of the generic isChangesEmpty-based default.
  protected isStackItemEmpty(): boolean {
    return (this.#liveModel?.symbolCount ?? 0) === 0
  }

  protected isChangesEmpty(changes: TIIHistoryChanges): boolean {
    return !(
      changes.added?.length ||
      changes.updated?.oldSymbols.length ||
      changes.erased?.length ||
      changes.replaced?.oldSymbols.length ||
      changes.matrix?.symbols.length ||
      changes.translate?.length ||
      changes.rotate?.length ||
      changes.scale?.length ||
      changes.style?.symbols?.length ||
      changes.order?.symbols?.length
    )
  }

  init(model: IIModel): void {
    this.#liveModel = model
    this.initStack({})
  }

  protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges {
    const reversedChanges: TIIHistoryChanges = {}
    // Every symbol list is copied, not shared: the reversed entry is a separate entry, and two
    // entries holding the same array would change together if anything ever appended to one.
    // The symbols inside stay shared — they are values, never mutated in place.
    if (changes.added) {
      reversedChanges.erased = [...changes.added]
    }
    if (changes.erased) {
      reversedChanges.added = [...changes.erased]
    }
    if (changes.updated) {
      reversedChanges.updated = {
        oldSymbols: [...changes.updated.newSymbols],
        newSymbols: [...changes.updated.oldSymbols],
      }
    }
    if (changes.replaced) {
      reversedChanges.replaced = {
        newSymbols: [...changes.replaced.oldSymbols],
        oldSymbols: [...changes.replaced.newSymbols],
      }
    }
    if (changes.matrix) {
      reversedChanges.matrix = {
        symbols: [...changes.matrix.symbols],
        matrix: new MatrixTransform(
          changes.matrix.matrix.xx,
          changes.matrix.matrix.yx,
          changes.matrix.matrix.xy,
          changes.matrix.matrix.yy,
          changes.matrix.matrix.tx,
          changes.matrix.matrix.ty
        ).invert(),
      }
    }
    if (changes.translate?.length) {
      reversedChanges.translate = changes.translate.map((tr) => {
        return {
          symbols: [...tr.symbols],
          tx: -tr.tx,
          ty: -tr.ty,
        }
      })
    }
    if (changes.rotate?.length) {
      reversedChanges.rotate = changes.rotate.map((tr) => {
        return {
          symbols: [...tr.symbols],
          angle: -tr.angle,
          center: tr.center,
        }
      })
    }
    if (changes.scale?.length) {
      reversedChanges.scale = changes.scale.map((tr) => {
        return {
          symbols: [...tr.symbols],
          origin: tr.origin,
          scaleX: 1 / tr.scaleX,
          scaleY: 1 / tr.scaleY,
        }
      })
    }
    if (changes.style) {
      reversedChanges.style = {
        symbols: [...changes.style.symbols],
        oldStyles: changes.style.newStyles,
        newStyles: changes.style.oldStyles,
        oldFontSizes: changes.style.newFontSizes,
        newFontSizes: changes.style.oldFontSizes,
      }
    }
    if (changes.order) {
      const positionMap: Record<string, "first" | "last" | "forward" | "backward"> = {
        first: "last",
        last: "first",
        forward: "backward",
        backward: "forward",
      }
      reversedChanges.order = {
        symbols: [...changes.order.symbols],
        position: positionMap[changes.order.position],
      }
    }

    return reversedChanges
  }
}
