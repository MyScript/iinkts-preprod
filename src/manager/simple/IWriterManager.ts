import type { InkEditor } from "@/editor";
import type { TPointerInfo } from "@/grabber";
import type { IModel } from "@/model";
import type { TStyle } from "@/style";
import type { TStroke, TSymbol, TPointer} from "@/symbol";
import { isStroke } from "@/symbol";
import { IIStrokeHelper } from "@/symbol/helpers";
import { AbstractWriterManager } from "@/manager/base/AbstractWriterManager";

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
    this.model.currentStroke = IIStrokeHelper.create(style, pointerType)
    IIStrokeHelper.addPointer(this.model.currentStroke, pointer)
    return this.model.currentStroke
  }

  protected updateCurrentSymbol(pointer: TPointer): TStroke {
    if (this.model.currentStroke && isStroke(this.model.currentStroke)) {
      IIStrokeHelper.addPointer(this.model.currentStroke, pointer)
    }
    return this.model.currentStroke!
  }

  async end(info: TPointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentStroke = undefined
    this.renderer.drawSymbol(localSymbol)
    this.model.addStroke(localSymbol)
    this.editor.history.push(this.model, { added: [localSymbol] })
    if (this.editor.configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      this.#exportTimer = setTimeout(async () => {
        this.editor.export()
      }, this.editor.configuration.triggers.exportContent === "QUIET_PERIOD" ? this.editor.configuration.triggers.exportContentDelay : 0)
    }
  }
}
