import {
  IITransientInkManager,
  SymbolType,
  InteractiveInkEditor
} from "../../../../src/iink"

// Mock the editor
jest.mock("../../../../src/editor/variants/InteractiveInkEditor")

describe("IITransientInkManager", () => {
  let manager: IITransientInkManager;
  let mockEditor: jest.Mocked<InteractiveInkEditor>;

  beforeEach(() => {
    // Create mock editor with required properties
    mockEditor = {
      renderer: {
        removeSymbol: jest.fn(),
      },
      model: {
        symbols: [],
        removeSymbol: jest.fn(),
      },
    } as any

    manager = new IITransientInkManager(mockEditor)
  })

  describe("addTransientSymbol", () => {
    test("should add transient symbol for source block", () => {
      manager.addTransientSymbol("block1", "symbol1")

      const transients = manager.getTransientsForBlock("block1")
      expect(transients).toContain("symbol1")
      expect(transients.length).toBe(1)
    })

    test("should add multiple transients for same block", () => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol2")

      const transients = manager.getTransientsForBlock("block1")
      expect(transients).toContain("symbol1")
      expect(transients).toContain("symbol2")
      expect(transients.length).toBe(2)
    })

    test("should not duplicate same symbol ID", () => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol1")

      const transients = manager.getTransientsForBlock("block1")
      expect(transients.length).toBe(1)
    })

    test("should handle multiple source blocks", () => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block2", "symbol2")

      expect(manager.getTransientsForBlock("block1")).toContain("symbol1")
      expect(manager.getTransientsForBlock("block2")).toContain("symbol2")
    })
  })

  describe("clearTransientsForBlock", () => {
    beforeEach(() => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol2")
    })

    test("should remove symbols from renderer", () => {
      manager.clearTransientsForBlock("block1")

      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledWith("symbol1")
      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledWith("symbol2")
      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledTimes(2)
    })

    test("should remove symbols from model if they exist", () => {
      const mockSymbol1 = { id: "symbol1", type: SymbolType.Stroke } as any
      const mockSymbol2 = { id: "symbol2", type: SymbolType.Stroke } as any
      mockEditor.model.symbols = [mockSymbol1, mockSymbol2]

      manager.clearTransientsForBlock("block1")

      expect(mockEditor.model.removeSymbol).toHaveBeenCalledWith("symbol1")
      expect(mockEditor.model.removeSymbol).toHaveBeenCalledWith("symbol2")
    })

    test("should handle missing symbols gracefully", () => {
      mockEditor.model.symbols = []

      expect(() => {
        manager.clearTransientsForBlock("block1")
      }).not.toThrow()
    })

    test("should remove block from tracking", () => {
      manager.clearTransientsForBlock("block1")

      const transients = manager.getTransientsForBlock("block1")
      expect(transients.length).toBe(0)
    })

    test("should not affect other blocks", () => {
      manager.addTransientSymbol("block2", "symbol3")
      manager.clearTransientsForBlock("block1")

      const transients = manager.getTransientsForBlock("block2")
      expect(transients).toContain("symbol3")
    })
  })

  describe("clearAll", () => {
    beforeEach(() => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol2")
      manager.addTransientSymbol("block2", "symbol3")
    })

    test("should clear all transient symbols", () => {
      manager.clearAll()

      expect(manager.getTransientsForBlock("block1").length).toBe(0)
      expect(manager.getTransientsForBlock("block2").length).toBe(0)
    })

    test("should call removeSymbol for all symbols", () => {
      manager.clearAll()

      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledWith("symbol1")
      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledWith("symbol2")
      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledWith("symbol3")
      expect(mockEditor.renderer.removeSymbol).toHaveBeenCalledTimes(3)
    })
  })

  describe("getTransientsForBlock", () => {
    test("should return empty array for unknown block", () => {
      const transients = manager.getTransientsForBlock("unknown")
      expect(transients).toEqual([])
    })

    test("should return transient symbol IDs", () => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol2")

      const transients = manager.getTransientsForBlock("block1")
      expect(transients).toEqual(["symbol1", "symbol2"])
    })
  })

  describe("isTransient", () => {
    beforeEach(() => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block2", "symbol2")
    })

    test("should return true for transient symbols", () => {
      expect(manager.isTransient("symbol1")).toBe(true)
      expect(manager.isTransient("symbol2")).toBe(true)
    })

    test("should return false for non-transient symbols", () => {
      expect(manager.isTransient("symbol3")).toBe(false)
      expect(manager.isTransient("unknown")).toBe(false)
    })
  })

  describe("getAllTransients", () => {
    test("should return empty map initially", () => {
      const all = manager.getAllTransients()
      expect(all.size).toBe(0)
    })

    test("should return all transients across blocks", () => {
      manager.addTransientSymbol("block1", "symbol1")
      manager.addTransientSymbol("block1", "symbol2")
      manager.addTransientSymbol("block2", "symbol3")

      const all = manager.getAllTransients()
      expect(all.size).toBe(2)
      expect(all.get("block1")).toEqual(["symbol1", "symbol2"])
      expect(all.get("block2")).toEqual(["symbol3"])
    })

    test("should return copy not reference", () => {
      manager.addTransientSymbol("block1", "symbol1")
      const all = manager.getAllTransients()
      all.set("block2", ["symbol2"])

      // Original should not be affected
      const originalAll = manager.getAllTransients()
      expect(originalAll.has("block2")).toBe(false)
    })
  })
})
