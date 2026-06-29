import type { EditorEvent } from "@/editor/EditorEvent"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { IIModel } from "@/model"
import type { TStyle } from "@/style"
import type { TPoint, TStroke, TSymbol } from "@/symbol"
import type { TMatrixTransform } from "@/transform"
import { MatrixTransform } from "@/transform"
import type { TPartialDeep } from "@/utils"

import type { THistoryConfiguration } from "./HistoryConfiguration"
import type { THistoryContext } from "./HistoryContext"
import { getInitialHistoryContext } from "./HistoryContext"

/**
 * @group History
 */
export type TIIHistoryChanges = {
  added?: TSymbol[]
  updated?: TSymbol[]
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
    style?: TPartialDeep<TStyle>
    fontSize?: number
  }
  order?: {
    symbols: TSymbol[]
    position: "first" | "last" | "forward" | "backward"
  }
  group?: { symbols: TSymbol[] }
  ungroup?: { group: TSymbol }
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
 */
export type TIIHistoryStackItem = {
  changes: TIIHistoryChanges
  model: IIModel
}

/**
 * @group History
 */
export class IIHistoryManager {
  #logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: EditorEvent
  context: THistoryContext
  stack: TIIHistoryStackItem[]

  constructor(configuration: THistoryConfiguration, event: EditorEvent) {
    this.#logger.info("constructor", {
      configuration,
    })
    this.configuration = configuration
    this.event = event
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  private updateContext(): void {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.stack[this.context.stackIndex].model.symbols.length === 0
  }

  isChangesEmpty(changes: TIIHistoryChanges): boolean {
    return !(
      changes.added?.length ||
      changes.updated?.length ||
      changes.erased?.length ||
      changes.replaced?.oldSymbols.length ||
      changes.matrix?.symbols.length ||
      changes.translate?.length ||
      changes.rotate?.length ||
      changes.scale?.length ||
      changes.style?.symbols?.length ||
      changes.order?.symbols?.length ||
      changes.group?.symbols.length ||
      changes.ungroup?.group
    )
  }

  init(model: IIModel): void {
    this.stack.push({
      model: model.clone(),
      changes: {},
    })
    this.event.emitChanged(this.context)
  }

  push(model: IIModel, changes: TIIHistoryChanges): void {
    this.#logger.info("push", { model, changes })
    if (this.isChangesEmpty(changes)) {
      return
    }

    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push({
      model: model.clone(),
      changes,
    })
    this.context.stackIndex = this.stack.length - 1

    if (this.stack.length > this.configuration.maxStackSize) {
      this.stack.shift()
      this.context.stackIndex--
    }

    this.updateContext()
    this.event.emitChanged(this.context)
  }

  update(model: IIModel): void {
    this.#logger.info("update", { model })
    const stackIdx = this.stack.findIndex((s) => s.model.modificationDate === model.modificationDate)
    if (stackIdx > -1) {
      this.stack[stackIdx].model = model
      this.updateContext()
    }
  }

  pop(): void {
    this.#logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges {
    const reversedChanges: TIIHistoryChanges = {}
    if (changes.added) {
      reversedChanges.erased = changes.added
    }
    if (changes.erased) {
      reversedChanges.added = changes.erased
    }
    if (changes.updated) {
      reversedChanges.updated = changes.updated
    }
    if (changes.replaced) {
      reversedChanges.replaced = {
        newSymbols: changes.replaced.oldSymbols,
        oldSymbols: changes.replaced.newSymbols,
      }
    }
    if (changes.matrix) {
      reversedChanges.matrix = {
        symbols: changes.matrix.symbols,
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
          symbols: tr.symbols,
          tx: -tr.tx,
          ty: -tr.ty,
        }
      })
    }
    if (changes.rotate?.length) {
      reversedChanges.rotate = changes.rotate.map((tr) => {
        return {
          symbols: tr.symbols,
          angle: -tr.angle,
          center: tr.center,
        }
      })
    }
    if (changes.scale?.length) {
      reversedChanges.scale = changes.scale.map((tr) => {
        return {
          symbols: tr.symbols,
          origin: tr.origin,
          scaleX: 1 / tr.scaleX,
          scaleY: 1 / tr.scaleY,
        }
      })
    }
    if (changes.style) {
      reversedChanges.style = changes.style
    }
    if (changes.order) {
      const positionMap: Record<string, "first" | "last" | "forward" | "backward"> = {
        first: "last",
        last: "first",
        forward: "backward",
        backward: "forward",
      }
      reversedChanges.order = {
        symbols: changes.order.symbols,
        position: positionMap[changes.order.position],
      }
    }

    return reversedChanges
  }

  undo(): TIIHistoryStackItem {
    this.#logger.info("undo")
    const currentStackItem = this.stack[this.context.stackIndex]
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const previousStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("undo", previousStackItem)
    const changes = this.reverseChanges(currentStackItem.changes)
    if (currentStackItem.changes.updated?.length) {
      changes.updated = currentStackItem.changes.updated
        .map((sym) => previousStackItem.model.symbols.find((s) => s.id === sym.id))
        .filter((s): s is TSymbol => s !== undefined)
    }
    return {
      model: previousStackItem.model,
      changes,
    }
  }

  redo(): TIIHistoryStackItem {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const nextStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("redo", nextStackItem)
    return nextStackItem
  }

  clear(): void {
    this.context = getInitialHistoryContext()
    this.stack = []
  }
}
