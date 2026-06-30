import type { InkEditor } from "@/editor"
import type { TPointerInfo } from "@/grabber"
import { AbstractWriterManager } from "@/manager/base/AbstractWriterManager"
import type { IModel } from "@/model"
import type { TStyle } from "@/style"
import type { TPointer, TStroke, TSymbol } from "@/symbol"
import { isStroke } from "@/symbol"
import { StrokeOps } from "@/symbol/stroke/Stroke"

/**
 * @group Manager
 */
export class IWriterManager extends AbstractWriterManager {
  editor: InkEditor
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(editor: InkEditor) {
    super(editor)
    this.editor = editor
  }

  get model(): IModel {
    return this.editor.model
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol {
    this.model.currentStroke = StrokeOps.create(style, pointerType)
    StrokeOps.addPointer(this.model.currentStroke, pointer)
    return this.model.currentStroke
  }

  protected updateCurrentSymbol(pointer: TPointer): TStroke {
    if (this.model.currentStroke && isStroke(this.model.currentStroke)) {
      StrokeOps.addPointer(this.model.currentStroke, pointer)
    }
    return this.model.currentStroke!
  }

  async end(info: TPointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentStroke = undefined
    this.renderer.drawSymbol(localSymbol)
    this.model.addStroke(localSymbol)
    this.editor.history.push(this.model, {
      added: [localSymbol],
    })
    if (this.editor.configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      this.#exportTimer = setTimeout(
        async () => {
          this.editor.export()
        },
        this.editor.configuration.triggers.exportContent === "QUIET_PERIOD"
          ? this.editor.configuration.triggers.exportContentDelay
          : 0
      )
    }
  }
}
