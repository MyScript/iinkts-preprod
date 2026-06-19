import { InteractiveInkEditorMock } from "../../__mocks__/InteractiveInkEditorMock"
import
{
  IITransformManager,
  IITranslateManager,
  IIResizeManager,
  IIRotationManager,
} from "../../../../src/iink"

describe("IITransformManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITransformManager(editor)
    expect(manager).toBeDefined()
  })

  test("should have translate sub-manager", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITransformManager(editor)
    expect(manager.translate).toBeInstanceOf(IITranslateManager)
  })

  test("should have resize sub-manager", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITransformManager(editor)
    expect(manager.resize).toBeInstanceOf(IIResizeManager)
  })

  test("should have rotation sub-manager", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITransformManager(editor)
    expect(manager.rotation).toBeInstanceOf(IIRotationManager)
  })
})
