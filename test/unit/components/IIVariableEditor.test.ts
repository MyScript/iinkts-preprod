import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IIVariableEditor } from "../../../src/iink"

describe("IIVariableEditor.ts", () =>
{
  let editor: InteractiveInkEditorMock

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()

    // Mock jiix.getBlockLabel method
    editor.jiix = {
      getBlockLabel: jest.fn().mockImplementation((id: string) => {
        if (id === "block-1") return "x + y"
        if (id === "block-2") return "2x"
        return "Unknown"
      })
    } as any

    // Mock getVariables method
    editor.getVariables = jest.fn().mockResolvedValue([
      { name: "x", value: 5, sourceType: "UNDEFINED" },
      { name: "y", value: 10, sourceType: "API" }
    ])

    // Mock math.actions.getStoredVariableValues
    editor.math.actions.getStoredVariableValues = jest.fn().mockReturnValue({ x: 5, y: 10 })

    // Mock setMathVariables on editor
    editor.setMathVariables = jest.fn().mockResolvedValue(undefined)
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlockIds", () =>
  {
    const jiixBlockIds = ["block-1", "block-2"]

    const variableEditor = new IIVariableEditor(editor, jiixBlockIds)
    expect(variableEditor).toBeDefined()
  })

  test("should deduplicate jiixBlockIds in constructor", () =>
  {
    const jiixBlockIds = ["block-1", "block-1", "block-2"]

    const variableEditor = new IIVariableEditor(editor, jiixBlockIds)
    expect(variableEditor).toBeDefined()
  })

  describe("show()", () =>
  {
    test("should fetch variables for all blocks", async () =>
    {
      const jiixBlockIds = ["block-1", "block-2"]

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      // Mock modal to prevent actual DOM operations
      const showSpy = jest.spyOn(variableEditor as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await variableEditor.show()

      expect(editor.getVariables).toHaveBeenCalledWith("block-1")
      expect(editor.getVariables).toHaveBeenCalledWith("block-2")

      showSpy.mockRestore()
    })

    test("should skip empty block ids", async () =>
    {
      const jiixBlockIds = ["", "block-2"]

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      const showSpy = jest.spyOn(variableEditor as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await variableEditor.show()

      // Only block-2 should be called
      expect(editor.getVariables).toHaveBeenCalledWith("block-2")
      expect(editor.getVariables).toHaveBeenCalledTimes(1)

      showSpy.mockRestore()
    })

    test("should handle errors when fetching variables", async () =>
    {
      const jiixBlockIds = ["block-1"]

      // Mock getVariables to throw error
      editor.getVariables = jest.fn().mockRejectedValue(new Error("Variables error"))

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await variableEditor.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No variables"))

      alertSpy.mockRestore()
    })

    test("should show alert when no variables found", async () =>
    {
      const jiixBlockIds = ["block-2"]

      // Mock getVariables to return empty array
      editor.getVariables = jest.fn().mockResolvedValue([])

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await variableEditor.show()

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No variables"))

      alertSpy.mockRestore()
    })

    test("should filter blocks that have no variables", async () =>
    {
      const jiixBlockIds = ["block-1", "block-2"]

      let callCount = 0
      editor.getVariables = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve([{ name: "x", value: 5, sourceType: "UNDEFINED" }])
        }
        return Promise.resolve([])
      })

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      const showSpy = jest.spyOn(variableEditor as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await variableEditor.show()

      const blockVariables = (variableEditor as any).blockVariables
      expect(blockVariables.length).toBe(1)
      expect(blockVariables[0].jiixBlockId).toBe("block-1")

      showSpy.mockRestore()
    })
  })

  describe("createSymbolVariableSection()", () =>
  {
    test("should create variable inputs for symbol", () =>
    {
      const variableEditor = new IIVariableEditor(editor, [])

      const symVar = {
        jiixBlockId: "block-1",
        variables: [
          { name: "x", value: 5, sourceType: "UNDEFINED" },
          { name: "y", value: 10, sourceType: "API" }
        ]
      }

      const section = (variableEditor as any).createSymbolVariableSection(symVar)

      expect(section).toBeDefined()
      expect(section).toBeInstanceOf(HTMLDivElement)
    })

    test("should create inputs map for each symbol", () =>
    {
      const variableEditor = new IIVariableEditor(editor, [])

      const symVar = {
        jiixBlockId: "block-1",
        variables: [
          { name: "x", value: 5, sourceType: "UNDEFINED" }
        ]
      }

      ;(variableEditor as any).createSymbolVariableSection(symVar)

      const inputsMap = (variableEditor as any).inputsMap
      expect(inputsMap.has("block-1")).toBe(true)
    })
  })

  describe("applyChanges()", () =>
  {
    test("should apply variable changes to editor", async () =>
    {
      const jiixBlockIds = ["block-1"]

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      // Setup inputs map manually for testing
      const inputsMap = new Map()
      const symbolInputsMap = new Map()

      const inputX = document.createElement("input")
      inputX.type = "number"
      inputX.value = "15"
      symbolInputsMap.set("x", inputX)

      inputsMap.set("block-1", symbolInputsMap)
      ;(variableEditor as any).inputsMap = inputsMap

      ;(variableEditor as any).blockVariables = [
        {
          jiixBlockId: "block-1",
          variables: [{ name: "x", value: 5, sourceType: "UNDEFINED" }]
        }
      ]

      await (variableEditor as any).applyChanges()

      expect(editor.setMathVariables).toHaveBeenCalledWith(
        { id: "block-1", label: "x + y" },
        { x: 15 }
      )
    })

    test("should apply variables even if values are the same", async () =>
    {
      const jiixBlockIds = ["block-1"]

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      // Setup inputs map with same value as stored
      const inputsMap = new Map()
      const symbolInputsMap = new Map()

      const inputX = document.createElement("input")
      inputX.type = "number"
      inputX.value = "5" // Same as stored value
      symbolInputsMap.set("x", inputX)

      inputsMap.set("block-1", symbolInputsMap)
      ;(variableEditor as any).inputsMap = inputsMap

      ;(variableEditor as any).blockVariables = [
        {
          jiixBlockId: "block-1",
          variables: [{ name: "x", value: 5, sourceType: "UNDEFINED" }]
        }
      ]

      // Mock alert
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await (variableEditor as any).applyChanges()

      // Should call setMathVariables even if value is the same
      expect(editor.setMathVariables).toHaveBeenCalledWith(
        { id: "block-1", label: "x + y" },
        { x: 5 }
      )

      alertSpy.mockRestore()
    })

    test("should skip symbols when inputs are empty", async () =>
    {
      const jiixBlockIds = ["block-1"]

      const variableEditor = new IIVariableEditor(editor, jiixBlockIds)

      const inputsMap = new Map()
      const symbolInputsMap = new Map()

      const inputX = document.createElement("input")
      inputX.type = "number"
      inputX.value = "" // Empty value
      symbolInputsMap.set("x", inputX)

      inputsMap.set("block-1", symbolInputsMap)
      ;(variableEditor as any).inputsMap = inputsMap

      ;(variableEditor as any).blockVariables = [
        {
          jiixBlockId: "block-1",
          variables: [{ name: "x", value: 5, sourceType: "UNDEFINED" }]
        }
      ]

      // Mock alert
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})

      await (variableEditor as any).applyChanges()

      // Should not update if input is empty
      expect(editor.setMathVariables).not.toHaveBeenCalled()
      expect(alertSpy).toHaveBeenCalledWith("No changes to apply")

      alertSpy.mockRestore()
    })
  })
})
