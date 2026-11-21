import { LoggerCategory, LoggerManager } from "@/logger"

import type { THistoryConfiguration } from "./HistoryConfiguration"
import type { THistoryContext } from "./HistoryContext"
import { getInitialHistoryContext } from "./HistoryContext"

/**
 * @group History
 * @remarks the only part of the canvas events the history uses; `CanvasEvent` satisfies it.
 */
export type THistoryEvent = {
  emitChanged(context: THistoryContext): void
}

/**
 * @group History
 * @remarks the steps of a history and the one it stands at, to save it and pick it up again
 */
export type THistoryStack<TStackItem> = {
  stack: TStackItem[]
  stackIndex: number
}

/**
 * @group History
 * @remarks shared stack/context bookkeeping for HistoryManager, IHistoryManager and IIHistoryManager,
 * which only differ in the shape of the stack item and of the recorded changes.
 */
export abstract class AbstractHistoryStack<TStackItem> {
  protected logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: THistoryEvent
  context: THistoryContext
  stack: TStackItem[]

  constructor(configuration: THistoryConfiguration, event: THistoryEvent) {
    this.logger.info("constructor", {
      configuration,
    })
    this.configuration = configuration
    this.event = event
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  protected abstract isStackItemEmpty(item: TStackItem): boolean

  protected updateContext(): void {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.isStackItemEmpty(this.stack[this.context.stackIndex])
    this.context.possibleUndoCount = this.context.stackIndex
  }

  protected initStack(item: TStackItem): void {
    this.stack.push(item)
    // Started on content already there (a restored session), the history is not empty
    this.updateContext()
    this.event.emitChanged(this.context)
  }

  protected pushToStack(item: TStackItem): void {
    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push(item)
    this.context.stackIndex = this.stack.length - 1

    if (this.stack.length > this.configuration.maxStackSize) {
      this.stack.shift()
      this.context.stackIndex--
    }

    this.updateContext()
    this.event.emitChanged(this.context)
  }

  protected moveStackIndex(delta: 1 | -1, allowed: boolean): void {
    if (allowed) {
      this.context.stackIndex += delta
      this.updateContext()
      this.event.emitChanged(this.context)
    }
  }

  pop(): void {
    this.logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  clear(): void {
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  /** The steps and where the history stands, the steps that can be redone included */
  exportStack(): THistoryStack<TStackItem> {
    return { stack: [...this.stack], stackIndex: this.context.stackIndex }
  }

  /**
   * Picks a history up where {@link exportStack} left it. Beyond `maxStackSize`, the oldest steps
   * are dropped; an empty stack changes nothing.
   */
  importStack({ stack, stackIndex }: THistoryStack<TStackItem>): void {
    if (!stack.length) {
      return
    }
    const dropped = Math.max(0, stack.length - this.configuration.maxStackSize)
    this.stack = stack.slice(dropped)
    this.context.stackIndex = Math.min(Math.max(stackIndex - dropped, 0), this.stack.length - 1)
    this.updateContext()
    this.event.emitChanged(this.context)
  }
}
