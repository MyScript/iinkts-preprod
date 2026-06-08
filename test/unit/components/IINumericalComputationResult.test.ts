import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IINumericalComputationResult } from "../../../src/iink"

describe("IINumericalComputationResult.ts", () =>
{
  let editor: InteractiveInkEditorMock

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()
    editor.drawComputationResult = false

    // Mock jiix.getBlockLabel method
    editor.jiix = {
      getBlockLabel: jest.fn().mockImplementation((id: string) => {
        if (id === "block-1") return "2 + 3"
        if (id === "block-2") return "x + 1"
        if (id === "block-error") return "error"
        return "Unknown"
      })
    } as any

    // Mock computeMathNumericalResult method
    editor.computeMathNumericalResult = jest.fn().mockImplementation((jiixBlock) => {
      if (jiixBlock.label === "error") {
        return Promise.reject(new Error("Computation failed"))
      }
      return Promise.resolve({ value: 42 })
    })
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlockIds", () =>
  {
    const jiixBlockIds = ["block-1", "block-2"]

    const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
    expect(computationResult).toBeDefined()
  })

  test("should deduplicate jiixBlockIds in constructor", () =>
  {
    const jiixBlockIds = ["block-1", "block-1", "block-2"]

    const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
    expect(computationResult).toBeDefined()
  })

  describe("computeResults()", () =>
  {
    test("should compute results for all blocks", async () =>
    {
      const jiixBlockIds = ["block-1", "block-2"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(2)
      expect(results[0].jiixBlockId).toBe("block-1")
      expect(results[0].value).toBe(42)
      expect(results[1].jiixBlockId).toBe("block-2")
      expect(results[1].value).toBe(42)

      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith({ id: "block-1", label: "2 + 3" }, false)
      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith({ id: "block-2", label: "x + 1" }, false)
    })

    test("should handle computation errors", async () =>
    {
      const jiixBlockIds = ["block-error"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].jiixBlockId).toBe("block-error")
      expect(results[0].error).toBe("Computation failed")
      expect(results[0].value).toBeUndefined()
    })

    test("should include results when drawComputationResult is true", async () =>
    {
      editor.drawComputationResult = true
      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].value).toBe(42)
    })

    test("should include results when drawComputationResult is false and value is defined", async () =>
    {
      editor.drawComputationResult = false
      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].value).toBe(42)
    })

    test("should exclude results when drawComputationResult is false and value is undefined", async () =>
    {
      editor.drawComputationResult = false
      editor.computeMathNumericalResult = jest.fn().mockResolvedValue({ value: undefined })

      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(0)
    })
  })

  describe("show()", () =>
  {
    test("should compute and display results", async () =>
    {
      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)

      // Mock createResultsDisplay to prevent actual DOM operations
      const displaySpy = jest.spyOn(computationResult as any, "createResultsDisplay")
      displaySpy.mockReturnValue(document.createElement("div"))

      await computationResult.show()

      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith({ id: "block-1", label: "2 + 3" }, false)
      expect(displaySpy).toHaveBeenCalled()

      displaySpy.mockRestore()
    })
  })

  describe("close()", () =>
  {
    test("should close and destroy modal", () =>
    {
      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)

      // Create a mock modal
      const mockModal = {
        destroy: jest.fn(),
        open: jest.fn()
      }
      ;(computationResult as any).modal = mockModal

      computationResult.close()

      expect(mockModal.destroy).toHaveBeenCalled()
    })

    test("should handle close when no modal exists", () =>
    {
      const jiixBlockIds = ["block-1"]

      const computationResult = new IINumericalComputationResult(editor, jiixBlockIds)

      expect(() => computationResult.close()).not.toThrow()
    })
  })
})
