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

  test("should instantiate with editor and jiixBlocks", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "2 + 3" },
      { id: "block-2", label: "x + 1" }
    ]

    const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
    expect(computationResult).toBeDefined()
  })

  test("should deduplicate jiixBlocks by id in constructor", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "2 + 3" },
      { id: "block-1", label: "2 + 3" },
      { id: "block-2", label: "x + 1" }
    ]

    const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
    expect(computationResult).toBeDefined()
  })

  describe("computeResults()", () =>
  {
    test("should compute results for all blocks", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" },
        { id: "block-2", label: "x + 1" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(2)
      expect(results[0].jiixBlock).toEqual(jiixBlocks[0])
      expect(results[0].value).toBe(42)
      expect(results[1].jiixBlock).toEqual(jiixBlocks[1])
      expect(results[1].value).toBe(42)

      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith(jiixBlocks[0], false)
      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith(jiixBlocks[1], false)
    })

    test("should handle computation errors", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "error" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].jiixBlock).toEqual(jiixBlocks[0])
      expect(results[0].error).toBe("Computation failed")
      expect(results[0].value).toBeUndefined()
    })

    test("should include results when drawComputationResult is true", async () =>
    {
      editor.drawComputationResult = true
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].value).toBe(42)
    })

    test("should include results when drawComputationResult is false and value is defined", async () =>
    {
      editor.drawComputationResult = false
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(1)
      expect(results[0].value).toBe(42)
    })

    test("should exclude results when drawComputationResult is false and value is undefined", async () =>
    {
      editor.drawComputationResult = false
      editor.computeMathNumericalResult = jest.fn().mockResolvedValue({ value: undefined })

      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)
      const results = await (computationResult as any).computeResults()

      expect(results.length).toBe(0)
    })
  })

  describe("show()", () =>
  {
    test("should compute and display results", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)

      // Mock createResultsDisplay to prevent actual DOM operations
      const displaySpy = jest.spyOn(computationResult as any, "createResultsDisplay")
      displaySpy.mockReturnValue(document.createElement("div"))

      await computationResult.show()

      expect(editor.computeMathNumericalResult).toHaveBeenCalledWith(jiixBlocks[0], false)
      expect(displaySpy).toHaveBeenCalled()

      displaySpy.mockRestore()
    })
  })

  describe("close()", () =>
  {
    test("should close and destroy modal", () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)

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
      const jiixBlocks = [
        { id: "block-1", label: "2 + 3" }
      ]

      const computationResult = new IINumericalComputationResult(editor, jiixBlocks)

      expect(() => computationResult.close()).not.toThrow()
    })
  })
})
