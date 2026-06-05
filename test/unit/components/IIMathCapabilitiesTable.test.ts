import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IIMathCapabilitiesTable } from "../../../src/components/IIMathCapabilitiesTable"

describe("IIMathCapabilitiesTable.ts", () =>
{
  let editor: InteractiveInkEditorMock

  beforeEach(() =>
  {
    editor = new InteractiveInkEditorMock()
    editor.init()

    // Mock methods for capabilities checking
    editor.getAvailableActions = jest.fn().mockResolvedValue(["numerical-computation", "evaluation"])
    editor.getVariables = jest.fn().mockResolvedValue([
      { name: "x", value: 1, sourceType: "UNDEFINED" }
    ])
    editor.getEvaluables = jest.fn().mockResolvedValue([
      { inputName: "x", outputName: "f(x)" }
    ])
  })

  afterEach(() =>
  {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor", () =>
  {
    const table = new IIMathCapabilitiesTable(editor)
    expect(table).toBeDefined()
  })

  describe("fetchSymbolCapabilities()", () =>
  {
    test("should fetch all capabilities for a symbol", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "block-1", label: "f(x) = x + 1" }

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      expect(capabilities).toBeDefined()
      expect(capabilities.jiixBlock).toEqual(jiixBlock)
      expect(capabilities.canCheckDiagnostic).toBe(true)
      expect(capabilities.canEditVariables).toBe(true)
      expect(capabilities.canCompute).toBe(true)
      expect(capabilities.canEvaluate).toBe(true)

      expect(editor.getAvailableActions).toHaveBeenCalledWith("block-1")
      expect(editor.getVariables).toHaveBeenCalledWith("block-1")
      expect(editor.getEvaluables).toHaveBeenCalledWith("block-1")
    })

    test("should handle symbol without id", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "", label: "x + 1" }

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      expect(capabilities.canCheckDiagnostic).toBe(false)
      expect(capabilities.canEditVariables).toBe(false)
      expect(capabilities.canCompute).toBe(false)
      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should handle errors gracefully", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "block-1", label: "f(x) = x + 1" }

      // Mock methods to throw errors
      editor.getAvailableActions = jest.fn().mockRejectedValue(new Error("API error"))
      editor.getVariables = jest.fn().mockRejectedValue(new Error("API error"))
      editor.getEvaluables = jest.fn().mockRejectedValue(new Error("API error"))

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      // All capabilities should be false when errors occur
      expect(capabilities.canCheckDiagnostic).toBe(false)
      expect(capabilities.canEditVariables).toBe(false)
      expect(capabilities.canCompute).toBe(false)
      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should detect when no variables available", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "block-1", label: "2 + 3" }

      editor.getVariables = jest.fn().mockResolvedValue([])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      expect(capabilities.canEditVariables).toBe(false)
    })

    test("should detect when no evaluables available", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "block-1", label: "x = 5" }

      editor.getEvaluables = jest.fn().mockResolvedValue([])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should detect when numerical-computation not available", async () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const jiixBlock = { id: "block-1", label: "f(x)" }

      editor.getAvailableActions = jest.fn().mockResolvedValue(["evaluation"])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlock)

      expect(capabilities.canCompute).toBe(false)
    })
  })

  describe("createTable()", () =>
  {
    test("should create table with capabilities data", () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const capabilities = [
        {
          jiixBlock: { id: "block-1", label: "f(x) = x + 1" },
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true
        }
      ]

      const tableElement = (table as any).createTable(capabilities)

      expect(tableElement).toBeDefined()
    })

    test("should create table with multiple capabilities", () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const capabilities = [
        {
          jiixBlock: { id: "block-1", label: "f(x) = x + 1" },
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true
        },
        {
          jiixBlock: { id: "block-2", label: "2 + 3" },
          canCheckDiagnostic: true,
          canEditVariables: false,
          canCompute: true,
          canEvaluate: false
        }
      ]

      const tableElement = (table as any).createTable(capabilities)

      expect(tableElement).toBeDefined()
    })

    test("should store capabilities for later use", () =>
    {
      const table = new IIMathCapabilitiesTable(editor)
      const capabilities = [
        {
          jiixBlock: { id: "block-1", label: "f(x) = x + 1" },
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true
        }
      ]

      ;(table as any).createTable(capabilities)

      expect((table as any).capabilities).toEqual(capabilities)
    })
  })
})
