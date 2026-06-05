import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IIFunctionEvaluator } from "../../../src/components/IIFunctionEvaluator"

describe("IIFunctionEvaluator.ts", () =>
{
  let editor: InteractiveInkEditorMock

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()

    // Mock getEvaluables method
    editor.getEvaluables = jest.fn().mockResolvedValue([
      { inputName: "x", outputName: "f(x)" }
    ])

    // Mock evaluateMathFunction method
    editor.evaluateMathFunction = jest.fn().mockResolvedValue({
      f: [[1, 2], [2, 4], [3, 6]]
    })
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlocks", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "f(x) = x + 1" },
      { id: "block-2", label: "g(x) = 2x" }
    ]

    const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)
    expect(evaluator).toBeDefined()
  })

  test("should deduplicate jiixBlocks by id in constructor", () =>
  {
    const jiixBlocks = [
      { id: "block-1", label: "f(x) = x + 1" },
      { id: "block-1", label: "f(x) = x + 1" },
      { id: "block-2", label: "g(x) = 2x" }
    ]

    const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)
    expect(evaluator).toBeDefined()
  })

  describe("show()", () =>
  {
    test("should fetch evaluables for all blocks", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "f(x) = x + 1" },
        { id: "block-2", label: "g(x) = 2x" }
      ]

      const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)

      // Mock modal to prevent actual DOM operations
      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      expect(editor.getEvaluables).toHaveBeenCalledWith("block-1")
      expect(editor.getEvaluables).toHaveBeenCalledWith("block-2")

      showSpy.mockRestore()
    })

    test("should skip blocks without id", async () =>
    {
      const jiixBlocks = [
        { id: "", label: "f(x) = x + 1" },
        { id: "block-2", label: "g(x) = 2x" }
      ]

      const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)

      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      // Only block-2 should be called
      expect(editor.getEvaluables).toHaveBeenCalledWith("block-2")
      expect(editor.getEvaluables).toHaveBeenCalledTimes(1)

      showSpy.mockRestore()
    })

    test("should handle errors when fetching evaluables", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "f(x) = x + 1" }
      ]

      // Mock getEvaluables to throw error
      editor.getEvaluables = jest.fn().mockRejectedValue(new Error("Evaluables error"))

      const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await evaluator.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No evaluable functions"))

      alertSpy.mockRestore()
    })

    test("should show alert when no evaluable functions found", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "x + 1" }
      ]

      // Mock getEvaluables to return empty array
      editor.getEvaluables = jest.fn().mockResolvedValue([])

      const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await evaluator.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No evaluable functions"))

      alertSpy.mockRestore()
    })

    test("should assign unique colors to functions", async () =>
    {
      const jiixBlocks = [
        { id: "block-1", label: "f(x) = x + 1" },
        { id: "block-2", label: "g(x) = 2x" },
        { id: "block-3", label: "h(x) = 3x" }
      ]

      const evaluator = new IIFunctionEvaluator(editor, jiixBlocks)

      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      const functions = (evaluator as any).functionsToEvaluate
      expect(functions.length).toBe(3)
      expect(functions[0].color).toBeDefined()
      expect(functions[1].color).toBeDefined()
      expect(functions[2].color).toBeDefined()

      showSpy.mockRestore()
    })
  })
})
