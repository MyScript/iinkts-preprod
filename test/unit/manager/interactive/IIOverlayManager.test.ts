import
{
  IIOverlayManager,
} from "../../../../src/iink"
import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"

describe("IIOverlayManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = createEditorMock()
    const manager = new IIOverlayManager(asEditor(editor))
    expect(manager).toBeDefined()
  })
})
