import type { TStroke } from "@/symbol"

import { AbstractHistoryStack } from "./AbstractHistoryStack"

/**
 * @group History
 */
export type TIHistoryChanges = {
  added?: TStroke[]
  removed?: TStroke[]
}

/**
 * @group History
 */
export class IHistoryManager extends AbstractHistoryStack<TIHistoryChanges> {
  // context.empty is only read via ClearMenuAction, which is typed to InteractiveInkCanvas
  // (IIHistoryManager), never to InkCanvas. No live model to check emptiness against here,
  // so this mirrors isChangesEmpty as a harmless default.
  protected isStackItemEmpty(item: TIHistoryChanges): boolean {
    return this.isChangesEmpty(item)
  }

  isChangesEmpty(changes: TIHistoryChanges): boolean {
    return !(changes.added?.length || changes.removed?.length)
  }

  init(): void {
    this.initStack({})
  }

  push(changes: TIHistoryChanges): void {
    this.logger.info("push", { changes })
    if (this.isChangesEmpty(changes)) {
      return
    }
    this.pushToStack(changes)
  }

  protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges {
    const reversedChanges: TIHistoryChanges = {}
    if (changes.added) {
      reversedChanges.removed = changes.added
    }
    if (changes.removed) {
      reversedChanges.added = changes.removed
    }
    return reversedChanges
  }

  undo(): TIHistoryChanges {
    this.logger.info("undo")
    const currentChanges = this.stack[this.context.stackIndex]
    this.moveStackIndex(-1, this.context.canUndo)
    const reversed = this.reverseChanges(currentChanges)
    this.logger.debug("undo", reversed)
    return reversed
  }

  redo(): TIHistoryChanges {
    this.logger.info("redo")
    this.moveStackIndex(1, this.context.canRedo)
    const nextChanges = this.stack[this.context.stackIndex]
    this.logger.debug("redo", nextChanges)
    return nextChanges
  }
}
