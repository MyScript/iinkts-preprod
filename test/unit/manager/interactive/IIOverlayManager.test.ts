import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"
import
{
  IIOverlayManager,
} from "@/iink"

describe("IIOverlayManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = createEditorMock()
    const manager = new IIOverlayManager(asEditor(editor))
    expect(manager).toBeDefined()
  })
})
