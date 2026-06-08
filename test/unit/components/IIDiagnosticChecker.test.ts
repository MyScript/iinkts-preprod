import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IIDiagnosticChecker } from "../../../src/iink"

describe("IIDiagnosticChecker.ts", () =>
{
  let editor: InteractiveInkEditorMock

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()

    // Mock getDiagnostic method
    editor.getDiagnostic = jest.fn().mockImplementation((_id: string, type: string) => {
      if (type === "numerical-computation") {
        return Promise.resolve("compute_ok")
      }
      if (type === "evaluation") {
        return Promise.resolve("eval_ok")
      }
      return Promise.resolve("unknown")
    })
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlocks", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "x + 1" },
      { id: "block-2", label: "2y" }
    ]

    const checker = new IIDiagnosticChecker(editor, jiixBlocks)
    expect(checker).toBeDefined()
  })

  test("should deduplicate jiixBlocks by id in constructor", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "x + 1" },
      { id: "block-1", label: "x + 1" },
      { id: "block-2", label: "2y" }
    ]

    const checker = new IIDiagnosticChecker(editor, jiixBlocks)
    expect(checker).toBeDefined()
  })

  describe("show()", () =>
  {
    test("should fetch diagnostics for all blocks", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "x + 1" },
        { id: "block-2", label: "2y" }
      ]

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      // Mock modal to prevent actual DOM operations
      const showSpy = jest.spyOn(checker as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await checker.show()

      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-1", "numerical-computation")
      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-1", "evaluation")
      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-2", "numerical-computation")
      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-2", "evaluation")

      showSpy.mockRestore()
    })

    test("should skip blocks without id", async () =>
    {
      const jiixBlocks = [
        { id: "", label: "x + 1" },
        { id: "block-2", label: "2y" }
      ]

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      const showSpy = jest.spyOn(checker as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      // Mock alert
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await checker.show()

      // Only block-2 should be called
      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-2", "numerical-computation")
      expect(editor.getDiagnostic).toHaveBeenCalledWith("block-2", "evaluation")

      showSpy.mockRestore()
      alertSpy.mockRestore()
    })

    test("should handle errors when fetching diagnostics", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "x + 1" }
      ]

      // Mock getDiagnostic to throw error
      editor.getDiagnostic = jest.fn().mockRejectedValue(new Error("Diagnostic error"))

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await checker.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No diagnostics"))

      alertSpy.mockRestore()
    })

    test("should show alert when no diagnostics available", async () =>
    {
      const jiixBlocks = [
        { id: "", label: "x + 1" }
      ]

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await checker.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No diagnostics"))

      alertSpy.mockRestore()
    })
  })

  describe("close()", () =>
  {
    test("should close and destroy modal", () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "x + 1" }
      ]

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      // Create a mock modal
      const mockModal = {
        destroy: jest.fn(),
        open: jest.fn()
      }
      ;(checker as any).modal = mockModal

      checker.close()

      expect(mockModal.destroy).toHaveBeenCalled()
    })

    test("should handle close when no modal exists", () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "x + 1" }
      ]

      const checker = new IIDiagnosticChecker(editor, jiixBlocks)

      expect(() => checker.close()).not.toThrow()
    })
  })
})
