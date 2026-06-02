import { IIMathOverlayManager } from "../../../../src/manager/interactive/IIMathOverlayManager"
import { ColorPaletteManager } from "../../../../src/manager/base/ColorPaletteManager"
import { InteractiveInkEditor } from "../../../../src/editor/variants/InteractiveInkEditor"
import { SVGRenderer, SVGBuilder } from "../../../../src/renderer"
import { IIModel } from "../../../../src/model"
import { IIRecognizedMath, RecognizedKind, SymbolType } from "../../../../src/symbol"

// Mock dependencies
jest.mock("../../../../src/editor/variants/InteractiveInkEditor")
jest.mock("../../../../src/model")

describe("IIMathOverlayManager", () =>
{
  let manager: IIMathOverlayManager;;
  let mockEditor: jest.Mocked<InteractiveInkEditor>;;
  let mockRenderer: jest.Mocked<SVGRenderer>;;
  let mockModel: jest.Mocked<IIModel>;;

  beforeEach(() =>
  {
    // Create real SVG layer
    const svgLayer = SVGBuilder.createLayer({ x: 0, y: 0, width: 1000, height: 1000 })

    // Create mock renderer with real SVG layer
    mockRenderer = {
      layer: svgLayer,
      removeSymbol: jest.fn(),
      clearElements: jest.fn(),
      drawConnectionBetweenBox: jest.fn(),
      getElementById: jest.fn(),
    } as any

    // Create mock model
    mockModel = {
      symbols: [],
    } as any

    // Create mock editor
    mockEditor = {
      renderer: mockRenderer,
      model: mockModel,
    } as any

    // Reset color manager between tests
    ColorPaletteManager.getInstance().clear()

    manager = new IIMathOverlayManager(mockEditor)
  })

  describe("constructor", () =>
  {
    test("should initialize with default config", () =>
    {
      const config = manager.getConfig()
      expect(config.showBlockOverlays).toBe(false)
      expect(config.showResultPanels).toBe(false)
    })

    test("should accept partial config override", () =>
    {
      const customManager = new IIMathOverlayManager(mockEditor, {
        showBlockOverlays: true,
        badgeSize: 30
      })

      const config = customManager.getConfig()
      expect(config.showBlockOverlays).toBe(true)
      expect(config.badgeSize).toBe(30)
      expect(config.showResultPanels).toBe(false) // default preserved
    })
  })

  describe("updateConfig", () =>
  {
    test("should update config values", () =>
    {
      manager.updateConfig({ showBlockOverlays: true })
      expect(manager.getConfig().showBlockOverlays).toBe(true)
    })

    test("should preserve unchanged config values", () =>
    {
      const originalBorderWidth = manager.getConfig().borderWidth
      manager.updateConfig({ showBlockOverlays: true })
      expect(manager.getConfig().borderWidth).toBe(originalBorderWidth)
    })

    test("should call refresh after config update", () =>
    {
      const refreshSpy = jest.spyOn(manager, 'refresh')
      manager.updateConfig({ showBlockOverlays: true })
      expect(refreshSpy).toHaveBeenCalled()
    })
  })

  describe("clearAll", () =>
  {
    test("should clear all overlay types", () =>
    {
      manager.clearAll()

      expect(mockRenderer.clearElements).toHaveBeenCalledWith({ attrs: { "data-overlay": "badge" } })
      expect(mockRenderer.clearElements).toHaveBeenCalledWith({ attrs: { "data-overlay": "border" } })
      expect(mockRenderer.clearElements).toHaveBeenCalledWith({ attrs: { "data-overlay": "result-panel" } })
      expect(mockRenderer.clearElements).toHaveBeenCalledWith({ attrs: { "data-overlay": "result-connection" } })
    })
  })

  describe("clearOverlaysForBlock", () =>
  {
    test("should remove all overlays for specific block", () =>
    {
      manager.clearOverlaysForBlock("block123")

      expect(mockRenderer.removeSymbol).toHaveBeenCalledWith("badge-block123")
      expect(mockRenderer.removeSymbol).toHaveBeenCalledWith("border-block123")
      expect(mockRenderer.removeSymbol).toHaveBeenCalledWith("result-panel-block123")
      expect(mockRenderer.removeSymbol).toHaveBeenCalledWith("result-connection-block123")
    })
  })

  describe("updateOverlaysForSymbol", () =>
  {
    test("should draw badge and border for recognized math symbols", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
      } as any

      manager.toggleBlockOverlays(true)
      manager.updateOverlaysForSymbol(mathSymbol)

      // Check that badge element was added to layer
      const badges = mockRenderer.layer.querySelectorAll('[data-overlay="badge"]')
      expect(badges.length).toBeGreaterThan(0)

      // Check that border element was added to layer
      const borders = mockRenderer.layer.querySelectorAll('[data-overlay="border"]')
      expect(borders.length).toBeGreaterThan(0)
    })

    test("should ignore non-math symbols", () =>
    {
      const textSymbol = {
        id: "text1",
        type: "text",
        bounds: { x: 10, y: 10, width: 100, height: 50 },
      } as any

      manager.updateOverlaysForSymbol(textSymbol)

      // No overlays should be created
      const badges = mockRenderer.layer.querySelectorAll('[data-overlay="badge"]')
      expect(badges.length).toBe(0)
    })

    test("should draw result panel for math symbols with solver output", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        solverOutputStrokeIds: ["output1"],
      } as any
      manager.toggleResultPanels(true)
      manager.updateOverlaysForSymbol(mathSymbol)

      // Check for result panel
      const panels = mockRenderer.layer.querySelectorAll('[data-overlay="result-panel"]')
      expect(panels.length).toBeGreaterThan(0)

      // Check that connection line was drawn
      expect(mockRenderer.drawConnectionBetweenBox).toHaveBeenCalled()
    })

    test("should respect config showBlockOverlays=false", () =>
    {
      manager.updateConfig({ showBlockOverlays: false })
      mockRenderer.layer.innerHTML = "" // Clear

      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
      } as any

      manager.updateOverlaysForSymbol(mathSymbol)

      const badges = mockRenderer.layer.querySelectorAll('[data-overlay="badge"]')
      expect(badges.length).toBe(0)

      const borders = mockRenderer.layer.querySelectorAll('[data-overlay="border"]')
      expect(borders.length).toBe(0)
    })
  })

  describe("refresh", () =>
  {
    test("should clear all overlays", () =>
    {
      const clearSpy = jest.spyOn(manager, 'clearAll')
      manager.refresh()
      expect(clearSpy).toHaveBeenCalled()
    })

    test("should update overlays for all recognized math symbols in model", () =>
    {
      const mathSymbol1: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
      } as any

      const mathSymbol2: IIRecognizedMath = {
        id: "math2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 120, y: 10, width: 100, height: 50 },
        strokes: [],
      } as any

      const textSymbol = {
        id: "text1",
        type: "text",
        bounds: { x: 230, y: 10, width: 100, height: 50 },
      } as any

      mockModel.symbols = [mathSymbol1, mathSymbol2, textSymbol]

      const updateSpy = jest.spyOn(manager, 'updateOverlaysForSymbol')
      manager.refresh()

      expect(updateSpy).toHaveBeenCalledWith(mathSymbol1)
      expect(updateSpy).toHaveBeenCalledWith(mathSymbol2)
      expect(updateSpy).toHaveBeenCalledWith(textSymbol)
      expect(updateSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe("getBlockColor", () =>
  {
    test("should return default color for block without variables", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "5 + 3",
      } as any

      const color = (manager as any).getBlockColor(mathSymbol)
      expect(color).toBe("#cccccc")
    })

    test("should return variable color for block with variableSources", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x + 3",
        variableSources: { x: "block-source-1" },
      } as any

      const color = (manager as any).getBlockColor(mathSymbol)

      // Should be one of the Excel palette colors
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(color).not.toBe("#cccccc")
    })

    test("should use same color for same variable across blocks", () =>
    {
      const mathSymbol1: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x + 3",
        variableSources: { x: "block-source-1" },
      } as any

      const mathSymbol2: IIRecognizedMath = {
        id: "math2",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 120, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x * 2",
        variableSources: { x: "block-source-1" },
      } as any

      const color1 = (manager as any).getBlockColor(mathSymbol1)
      const color2 = (manager as any).getBlockColor(mathSymbol2)

      expect(color1).toBe(color2)
    })

    test("should use first variable for blocks with multiple variables", () =>
    {
      const mathSymbol: IIRecognizedMath = {
        id: "math1",
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        bounds: { x: 10, y: 10, width: 100, height: 50 },
        strokes: [],
        label: "x + y",
        variableSources: { x: "block-1", y: "block-2" },
      } as any

      const color = (manager as any).getBlockColor(mathSymbol)

      // Should use color of variable "x"
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(color).not.toBe("#cccccc")
    })
  })

  describe("toggle methods", () =>
  {
    test("toggleBlockOverlays should update config", () =>
    {
      manager.toggleBlockOverlays(true)
      expect(manager.getConfig().showBlockOverlays).toBe(true)
    })

    test("toggleResultPanels should update config", () =>
    {
      manager.toggleResultPanels(false)
      expect(manager.getConfig().showResultPanels).toBe(false)
    })
  })
})
