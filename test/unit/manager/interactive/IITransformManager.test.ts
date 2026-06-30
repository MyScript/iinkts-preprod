import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"
import { IITransformManager, IITranslateManager, IIResizeManager, IIRotationManager } from "@/iink"

describe("IITransformManager.ts", () => {
  test("should create", () => {
    const editor = createEditorMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  test("should have translate sub-manager", () => {
    const editor = createEditorMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.translate).toBeInstanceOf(IITranslateManager)
  })

  test("should have resize sub-manager", () => {
    const editor = createEditorMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.resize).toBeInstanceOf(IIResizeManager)
  })

  test("should have rotation sub-manager", () => {
    const editor = createEditorMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.rotation).toBeInstanceOf(IIRotationManager)
  })
})
