import { InteractiveInkEditor } from "@/editor/variants/InteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import { IIAbstractManager } from "./IIAbstractManager"
import { IITranslateManager } from "./transform/IITranslateManager"
import { IIResizeManager } from "./transform/IIResizeManager"
import { IIRotationManager } from "./transform/IIRotationManager"

/**
 * Orchestrates the three transform sub-managers (translate, resize, rotation).
 * Access via editor.transform.translate / .resize / .rotation
 * @group Manager
 */
export class IITransformManager extends IIAbstractManager
{
  protected managerName = "IITransformManager"

  readonly translate: IITranslateManager
  readonly resize: IIResizeManager
  readonly rotation: IIRotationManager

  constructor(editor: InteractiveInkEditor)
  {
    super(editor, LoggerCategory.TRANSFORMER)
    this.translate = new IITranslateManager(editor)
    this.resize = new IIResizeManager(editor)
    this.rotation = new IIRotationManager(editor)
  }
}
