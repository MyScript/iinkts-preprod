import { MathDependencyService } from "../../../src/services"
import { RecognizedKind, SymbolType } from "../../../src/symbol"
import { InteractiveInkEditor } from "../../../src/editor"

describe("MathDependencyService", () =>
{
  let service: MathDependencyService
  let mockEditor: any

  beforeEach(() =>
  {
    mockEditor = {
      model: {
        symbols: []
      },
      event: {
        emitChanged: jest.fn()
      },
      history: {
        context: {}
      },
      computeMathNumericalResult: jest.fn().mockResolvedValue(undefined),
      mathComputationMode: true
    }

    service = new MathDependencyService(mockEditor as InteractiveInkEditor)
  })

  describe("findMathSymbolByJiixId", () =>
  {
    it("should find a math symbol by its JIIX ID", () =>
    {
      const mathSymbol: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-1",
        jiixId: "block-123",
        label: "x+1",
        expressions: [],
        strokes: []
      }

      mockEditor.model.symbols = [mathSymbol]

      const result = service.findMathSymbolByJiixId("block-123")

      expect(result).toBe(mathSymbol)
    })

    it("should return undefined if symbol not found", () =>
    {
      mockEditor.model.symbols = []

      const result = service.findMathSymbolByJiixId("nonexistent")

      expect(result).toBeUndefined()
    })

    it("should ignore non-math symbols", () =>
    {
      const textSymbol: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Text,
        id: "text-1",
        jiixId: "block-123"
      }

      mockEditor.model.symbols = [textSymbol]

      const result = service.findMathSymbolByJiixId("block-123")

      expect(result).toBeUndefined()
    })
  })

  describe("getMathDependencies", () =>
  {
    it("should return dependencies for a math symbol", () =>
    {
      const mathSymbol: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-1",
        jiixId: "block-123",
        variableSources: { x: "block-100", y: "block-200" },
        dependentBlocks: ["block-300", "block-400"]
      }

      mockEditor.model.symbols = [mathSymbol]

      const result = service.getMathDependencies("block-123")

      expect(result).toEqual({
        variableSources: { x: "block-100", y: "block-200" },
        dependentBlocks: ["block-300", "block-400"]
      })
    })

    it("should return null if symbol not found", () =>
    {
      mockEditor.model.symbols = []

      const result = service.getMathDependencies("nonexistent")

      expect(result).toBeNull()
    })

    it("should return dependencies even if they are undefined", () =>
    {
      const mathSymbol: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-1",
        jiixId: "block-123"
      }

      mockEditor.model.symbols = [mathSymbol]

      const result = service.getMathDependencies("block-123")

      expect(result).toEqual({
        variableSources: undefined,
        dependentBlocks: undefined
      })
    })
  })

  describe("recalculateDependentBlocks", () =>
  {
    it("should recalculate all dependent blocks", async () =>
    {
      const sourceMath: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-source",
        jiixId: "block-source",
        dependentBlocks: ["block-dep1", "block-dep2"]
      }

      const dependent1: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-dep1",
        jiixId: "block-dep1"
      }

      const dependent2: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-dep2",
        jiixId: "block-dep2"
      }

      mockEditor.model.symbols = [sourceMath, dependent1, dependent2]

      await service.recalculateDependentBlocks("block-source")

      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledTimes(2)
      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledWith(dependent1, true)
      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledWith(dependent2, true)
      expect(mockEditor.event.emitChanged).toHaveBeenCalledWith({})
    })

    it("should handle source block not found", async () =>
    {
      mockEditor.model.symbols = []

      await service.recalculateDependentBlocks("nonexistent")

      expect(mockEditor.computeMathNumericalResult).not.toHaveBeenCalled()
      expect(mockEditor.event.emitChanged).not.toHaveBeenCalled()
    })

    it("should handle no dependent blocks", async () =>
    {
      const sourceMath: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-source",
        jiixId: "block-source",
        dependentBlocks: []
      }

      mockEditor.model.symbols = [sourceMath]

      await service.recalculateDependentBlocks("block-source")

      expect(mockEditor.computeMathNumericalResult).not.toHaveBeenCalled()
      expect(mockEditor.event.emitChanged).not.toHaveBeenCalled()
    })

    it("should skip dependent block if not found", async () =>
    {
      const sourceMath: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-source",
        jiixId: "block-source",
        dependentBlocks: ["block-dep1", "nonexistent"]
      }

      const dependent1: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-dep1",
        jiixId: "block-dep1"
      }

      mockEditor.model.symbols = [sourceMath, dependent1]

      await service.recalculateDependentBlocks("block-source")

      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledTimes(1)
      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledWith(dependent1, true)
      expect(mockEditor.event.emitChanged).toHaveBeenCalledWith({})
    })

    it("should continue processing if one dependent fails", async () =>
    {
      const sourceMath: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-source",
        jiixId: "block-source",
        dependentBlocks: ["block-dep1", "block-dep2"]
      }

      const dependent1: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-dep1",
        jiixId: "block-dep1"
      }

      const dependent2: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "math-dep2",
        jiixId: "block-dep2"
      }

      mockEditor.model.symbols = [sourceMath, dependent1, dependent2]
      mockEditor.computeMathNumericalResult
        .mockRejectedValueOnce(new Error("Computation error"))
        .mockResolvedValueOnce(undefined)

      await service.recalculateDependentBlocks("block-source")

      expect(mockEditor.computeMathNumericalResult).toHaveBeenCalledTimes(2)
      expect(mockEditor.event.emitChanged).toHaveBeenCalledWith({})
    })
  })
})
