import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import
{
  IIWriterManager,
  DefaultStyle,
  SymbolType,
  TPointer,
  EditorWriteTool,
  ShapeKind,
  TIIShape,
  TIIEdge,
  EdgeDecoration,
  EdgeKind,
  IIStroke,
  PointerInfo
} from "../../../src/iink"

describe("IIWriterManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIWriterManager(editor)
    expect(manager).toBeDefined()
  })

  describe("writing process", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))

    const manager = new IIWriterManager(editor)
    manager.renderer.drawSymbol = jest.fn()

    editor.init()

    test("should init model.currentSymbol with pencil", async () =>
    {
      expect(manager.model.currentSymbol).toBeUndefined()

      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.creationTime).toStrictEqual(manager.model.modificationDate)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toEqual(SymbolType.Stroke)
      expect(manager.model.currentSymbol?.style.color).toBe(DefaultStyle.color)
      expect(manager.model.currentSymbol?.style.width).toBe(DefaultStyle.width)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with pencil & custom style", () =>
    {
      editor.penStyle = { color: "red", width: 42 }
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.style.color).toBe(editor.penStyle.color)
      expect(manager.model.currentSymbol?.style.width).toBe(editor.penStyle.width)
    })
    test("should init model.currentSymbol with Rectangle", () =>
    {
      editor.penStyle = DefaultStyle
      expect(editor.layers.root.classList.contains("shape")).toBe(false)
      manager.tool = EditorWriteTool.Rectangle
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TIIShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Circle", () =>
    {
      manager.tool = EditorWriteTool.Circle
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TIIShape
      expect(shape.kind).toBe(ShapeKind.Circle)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Ellipse", () =>
    {
      manager.tool = EditorWriteTool.Ellipse
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TIIShape
      expect(shape.kind).toBe(ShapeKind.Ellipse)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Triangle", () =>
    {
      manager.tool = EditorWriteTool.Triangle
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TIIShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Parallelogram", () =>
    {
      manager.tool = EditorWriteTool.Parallelogram
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TIIShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Line", () =>
    {
      manager.tool = EditorWriteTool.Line
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TIIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toBeUndefined()
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Arrow", () =>
    {
      manager.tool = EditorWriteTool.Arrow
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TIIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with DoubleArrow", () =>
    {
      manager.tool = EditorWriteTool.DoubleArrow
      expect(editor.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TIIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should throw error if symbol type unknow when start", () =>
    {
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      //@ts-ignore
      manager.tool = "unknow"
      expect(() => manager.start(info)).toThrow("Can't create symbol, tool is unknow: \"unknow\"")
    })
    test("should update currentSymbol", () =>
    {
      manager.tool = EditorWriteTool.Pencil
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      const point2: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      manager.continue({ pointer: point2 } as PointerInfo)
      const stroke = manager.model.currentSymbol as IIStroke
      expect(stroke.pointers).toHaveLength(2)
      expect(stroke.pointers[1].x).toBe(point2.x)
      expect(stroke.pointers[1].y).toBe(point2.y)
      expect(stroke.pointers[1].t).toBe(point2.t)
      expect(stroke.pointers[1].p).toBe(point2.p)
    })
    test("should throw error when continu if currentSymbol is undefined", () =>
    {
      manager.model.clear()
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      expect(() => manager.continue(info)).toThrow("Can't update current symbol because currentSymbol is undefined")
    })
    test("should clear currentSymbol and add into model.symbols", async () =>
    {
      manager.model.clear()
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 }
      } as PointerInfo
      manager.start(info)
      manager.continue({ pointer: point } as PointerInfo)
      await manager.end({ pointer: point } as PointerInfo)
      expect(manager.model.currentSymbol).toBeUndefined()
      expect(manager.model.symbols).toHaveLength(1)
      expect(editor.recognizer.addStrokes).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.addStrokes).toHaveBeenCalledWith([manager.model.symbols[0]], true)
    })
  })
})
