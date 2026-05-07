import { MathInteractionManager } from "../../../src/manager/math/MathInteractionManager"
import { MathOverlayManager } from "../../../src/manager/math/MathOverlayManager"
import { InteractiveInkEditor } from "../../../src/editor/InteractiveInkEditor"
import { IIModel } from "../../../src/model"
import { IIRecognizedMath, RecognizedKind, SymbolType } from "../../../src/symbol"

// Mock dependencies
jest.mock("../../../src/editor/InteractiveInkEditor")
jest.mock("../../../src/model")

describe("MathInteractionManager", () =>
{
  let manager: MathInteractionManager;;
  let mockEditor: jest.Mocked<InteractiveInkEditor>;;
  let mockOverlayManager: jest.Mocked<MathOverlayManager>;;
  let mockModel: jest.Mocked<IIModel>;;

  beforeEach(() =>
  {
    // Create mock overlay manager
    mockOverlayManager = {
      highlightAsSource: jest.fn(),
      highlightAsDependent: jest.fn(),
      addHoverGlow: jest.fn(),
      dimSymbol: jest.fn(),
      clearHighlights: jest.fn(),
      clearDimming: jest.fn(),
      clearDependencyArrows: jest.fn(),
      drawDependencyArrow: jest.fn(),
    } as any

    // Create mock model
    mockModel = {
      symbols: [],
    } as any

    // Create mock editor
    mockEditor = {
      model: mockModel,
      mathOverlays: mockOverlayManager,
      findMathSymbolByJiixId: jest.fn(),
    } as any

    manager = new MathInteractionManager(mockEditor)
  })

  describe("constructor", () =>
  {
    test("should initialize with default config", () =>
    {
      const config = manager.getConfig()
      expect(config.highlightOnHover).toBe(true)
      expect(config.highlightOnSelect).toBe(true)
      expect(config.showDependencyArrows).toBe(false)
      expect(config.dimOpacity).toBe(0.3)
    })

    test("should accept partial config override", () =>
    {
      const customManager = new MathInteractionManager(mockEditor, {
        highlightOnHover: false,
        dimOpacity: 0.5
      })

      const config = customManager.getConfig()
      expect(config.highlightOnHover).toBe(false)
      expect(config.dimOpacity).toBe(0.5)
      expect(config.highlightOnSelect).toBe(true) // default preserved
    })
  })

  describe("updateConfig", () =>
  {
    test("should update config values", () =>
    {
      manager.updateConfig({ highlightOnHover: false })
      expect(manager.getConfig().highlightOnHover).toBe(false)
    })

    test("should preserve unchanged config values", () =>
    {
      const originalDimOpacity = manager.getConfig().dimOpacity
      manager.updateConfig({ highlightOnHover: false })
      expect(manager.getConfig().dimOpacity).toBe(originalDimOpacity)
    })
  })

  describe("getRecursiveSources", () =>
  {
    test("should return empty set for symbol without sources", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "5",
      } as any

      mockModel.symbols = [mathSymbol]

      const sources = manager.getRecursiveSources("math1")
      expect(sources.size).toBe(0)
    })

    test("should return direct sources", () =>
    {
      const sourceSymbol: IIRecognizedMath = {
        id: "source1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 3",
        jiixId: "jiix-source1",
      } as any

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "x + 2",
        variableSources: { x: "jiix-source1" },
      } as any

      mockModel.symbols = [sourceSymbol, mathSymbol]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-source1") return sourceSymbol
        return undefined
      })

      const sources = manager.getRecursiveSources("math1")
      expect(sources.size).toBe(1)
      expect(sources.has("source1")).toBe(true)
    })

    test("should return recursive sources", () =>
    {
      const source1: IIRecognizedMath = {
        id: "source1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 3",
        jiixId: "jiix-source1",
      } as any

      const source2: IIRecognizedMath = {
        id: "source2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "y = x + 1",
        jiixId: "jiix-source2",
        variableSources: { x: "jiix-source1" },
      } as any

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 130, width: 100, height: 50 },
        strokes: [],
        label: "z = y + 2",
        variableSources: { y: "jiix-source2" },
      } as any

      mockModel.symbols = [source1, source2, mathSymbol]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-source1") return source1
        if (jiixId === "jiix-source2") return source2
        return undefined
      })

      const sources = manager.getRecursiveSources("math1")
      expect(sources.size).toBe(2)
      expect(sources.has("source1")).toBe(true)
      expect(sources.has("source2")).toBe(true)
    })

    test("should handle circular dependencies", () =>
    {
      const symbol1: IIRecognizedMath = {
        id: "symbol1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x",
        jiixId: "jiix-1",
        variableSources: { y: "jiix-2" },
      } as any

      const symbol2: IIRecognizedMath = {
        id: "symbol2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "y",
        jiixId: "jiix-2",
        variableSources: { x: "jiix-1" },
      } as any

      mockModel.symbols = [symbol1, symbol2]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-1") return symbol1
        if (jiixId === "jiix-2") return symbol2
        return undefined
      })

      // Should not cause infinite loop
      const sources = manager.getRecursiveSources("symbol1")
      expect(sources.size).toBe(1)
      expect(sources.has("symbol2")).toBe(true)
    })
  })

  describe("getRecursiveDependents", () =>
  {
    test("should return empty set for symbol without dependents", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 5",
        jiixId: "jiix-1",
      } as any

      mockModel.symbols = [mathSymbol]

      const dependents = manager.getRecursiveDependents("math1")
      expect(dependents.size).toBe(0)
    })

    test("should return direct dependents", () =>
    {
      const sourceSymbol: IIRecognizedMath = {
        id: "source1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 3",
        jiixId: "jiix-source1",
        dependentBlocks: ["jiix-math1"],
      } as any

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "x + 2",
        jiixId: "jiix-math1",
      } as any

      mockModel.symbols = [sourceSymbol, mathSymbol]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-math1") return mathSymbol
        return undefined
      })

      const dependents = manager.getRecursiveDependents("source1")
      expect(dependents.size).toBe(1)
      expect(dependents.has("math1")).toBe(true)
    })

    test("should return recursive dependents", () =>
    {
      const source1: IIRecognizedMath = {
        id: "source1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 3",
        jiixId: "jiix-1",
        dependentBlocks: ["jiix-2"],
      } as any

      const dependent1: IIRecognizedMath = {
        id: "dependent1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "y = x + 1",
        jiixId: "jiix-2",
        dependentBlocks: ["jiix-3"],
      } as any

      const dependent2: IIRecognizedMath = {
        id: "dependent2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 130, width: 100, height: 50 },
        strokes: [],
        label: "z = y + 2",
        jiixId: "jiix-3",
      } as any

      mockModel.symbols = [source1, dependent1, dependent2]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-2") return dependent1
        if (jiixId === "jiix-3") return dependent2
        return undefined
      })

      const dependents = manager.getRecursiveDependents("source1")
      expect(dependents.size).toBe(2)
      expect(dependents.has("dependent1")).toBe(true)
      expect(dependents.has("dependent2")).toBe(true)
    })
  })

  describe("onSymbolHover", () =>
  {
    test("should do nothing if highlightOnHover is disabled", () =>
    {
      manager.updateConfig({ highlightOnHover: false })

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 5",
      } as any

      mockModel.symbols = [mathSymbol]

      manager.onSymbolHover("math1")

      expect(mockOverlayManager.highlightAsSource).not.toHaveBeenCalled()
      expect(mockOverlayManager.highlightAsDependent).not.toHaveBeenCalled()
    })

    test("should clear highlights when hovering null", () =>
    {
      manager.onSymbolHover(null)

      expect(mockOverlayManager.clearHighlights).toHaveBeenCalled()
      expect(mockOverlayManager.clearDependencyArrows).toHaveBeenCalled()
    })

    test("should highlight sources and dependents on hover", () =>
    {
      const source: IIRecognizedMath = {
        id: "source1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 3",
        jiixId: "jiix-source1",
        dependentBlocks: ["jiix-math1"],
      } as any

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 70, width: 100, height: 50 },
        strokes: [],
        label: "y = x + 2",
        jiixId: "jiix-math1",
        variableSources: { x: "jiix-source1" },
        dependentBlocks: ["jiix-dependent1"],
      } as any

      const dependent: IIRecognizedMath = {
        id: "dependent1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 130, width: 100, height: 50 },
        strokes: [],
        label: "z = y * 2",
        jiixId: "jiix-dependent1",
      } as any

      mockModel.symbols = [source, mathSymbol, dependent]
      mockEditor.findMathSymbolByJiixId.mockImplementation((jiixId: string) => {
        if (jiixId === "jiix-source1") return source
        if (jiixId === "jiix-math1") return mathSymbol
        if (jiixId === "jiix-dependent1") return dependent
        return undefined
      })

      manager.onSymbolHover("math1")

      expect(mockOverlayManager.highlightAsSource).toHaveBeenCalledWith(source)
      expect(mockOverlayManager.highlightAsDependent).toHaveBeenCalledWith(dependent)
      expect(mockOverlayManager.addHoverGlow).toHaveBeenCalledWith(mathSymbol)
    })
  })

  describe("onSymbolSelect", () =>
  {
    test("should do nothing if highlightOnSelect is disabled", () =>
    {
      manager.updateConfig({ highlightOnSelect: false })

      manager.onSymbolSelect(["math1"])

      expect(mockOverlayManager.highlightAsSource).not.toHaveBeenCalled()
      expect(mockOverlayManager.dimSymbol).not.toHaveBeenCalled()
    })

    test("should clear highlights when selection is empty", () =>
    {
      manager.onSymbolSelect([])

      expect(mockOverlayManager.clearHighlights).toHaveBeenCalled()
      expect(mockOverlayManager.clearDimming).toHaveBeenCalled()
    })

    test("should dim non-related symbols", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x = 5",
      } as any

      const unrelatedSymbol: IIRecognizedMath = {
        id: "math2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 200, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "y = 10",
      } as any

      mockModel.symbols = [mathSymbol, unrelatedSymbol]

      manager.onSymbolSelect(["math1"])

      expect(mockOverlayManager.dimSymbol).toHaveBeenCalledWith(unrelatedSymbol, 0.3)
    })
  })

  describe("toggleDependencyArrows", () =>
  {
    test("should update config", () =>
    {
      manager.toggleDependencyArrows(true)
      expect(manager.getConfig().showDependencyArrows).toBe(true)
    })

    test("should clear arrows when disabled", () =>
    {
      manager.toggleDependencyArrows(false)
      expect(mockOverlayManager.clearDependencyArrows).toHaveBeenCalled()
    })
  })

  describe("clearAll", () =>
  {
    test("should clear all highlights and states", () =>
    {
      manager.clearAll()

      expect(mockOverlayManager.clearHighlights).toHaveBeenCalled()
      expect(mockOverlayManager.clearDimming).toHaveBeenCalled()
    })
  })
})
