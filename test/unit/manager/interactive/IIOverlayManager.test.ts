import
{
  IIOverlayManager,
} from "../../../../src/iink"
import { InteractiveInkEditorMock } from "../../__mocks__/InteractiveInkEditorMock"

describe("IIOverlayManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIOverlayManager(editor)
    expect(manager).toBeDefined()
  })
})
