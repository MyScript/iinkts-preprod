import { DefaultEraserConfiguration } from "./EraserConfiguration"
import { DefaultMarginConfiguration } from "./MarginConfiguration"
import { DefaultMathUndoRedoConfiguration, DefaultSolverConfiguration, TMathConfiguration } from "./MathConfiguration"

/**
 * @group Recognizer
 * @source
 */
export const DefaultMathV2Configuration: TMathConfiguration = {
  solver: DefaultSolverConfiguration,
  margin: DefaultMarginConfiguration,
  eraser: DefaultEraserConfiguration,
  "undo-redo": DefaultMathUndoRedoConfiguration,
  mimeTypes: ["application/x-latex"],
}
