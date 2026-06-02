import { SymbolFactory } from "../../../src/factories/SymbolFactory"
import { SymbolType, ShapeKind, EdgeKind, RecognizedKind } from "../../../src/symbol"

describe("SymbolFactory", () =>
{
  let factory: SymbolFactory

  beforeEach(() =>
  {
    factory = new SymbolFactory()
  })

  describe("buildStroke", () =>
  {
    it("should build a stroke from partial data", () =>
    {
      const partial: any = {
        type: SymbolType.Stroke,
        id: "stroke-1",
        pointers: [{ t: 0, p: 1, x: 0, y: 0 }],
        style: {}
      }
      const stroke = factory.buildStroke(partial)
      expect(stroke.type).toBe(SymbolType.Stroke)
      expect(stroke.id).toBe("stroke-1")
    })
  })

  describe("buildText", () =>
  {
    it("should build a text from partial data", () =>
    {
      const partial: any = {
        type: SymbolType.Text,
        id: "text-1",
        chars: [{ label: "A", fontSize: 12, fontWeight: "normal" }],
        point: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      }
      const text = factory.buildText(partial)
      expect(text.type).toBe(SymbolType.Text)
      expect(text.id).toBe("text-1")
    })
  })

  describe("buildMath", () =>
  {
    it("should build a math from partial data", () =>
    {
      const partial: any = {
        type: SymbolType.Math,
        id: "math-1",
        elements: [{ type: "number", label: "1", bounds: { x: 0, y: 0, width: 10, height: 10 } }],
        point: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      }
      const math = factory.buildMath(partial)
      expect(math.type).toBe(SymbolType.Math)
      expect(math.id).toBe("math-1")
    })
  })

  describe("buildShape", () =>
  {
    it("should build a circle shape", () =>
    {
      const partial: any = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        id: "circle-1",
        center: { x: 50, y: 50 },
        radius: 25
      }
      const shape = factory.buildShape(partial)
      expect(shape.kind).toBe(ShapeKind.Circle)
    })

    it("should build an ellipse shape", () =>
    {
      const partial: any = {
        type: SymbolType.Shape,
        kind: ShapeKind.Ellipse,
        id: "ellipse-1",
        center: { x: 50, y: 50 },
        radiusX: 30,
        radiusY: 20
      }
      const shape = factory.buildShape(partial)
      expect(shape.kind).toBe(ShapeKind.Ellipse)
    })

    it("should build a polygon shape", () =>
    {
      const partial: any = {
        type: SymbolType.Shape,
        kind: ShapeKind.Polygon,
        id: "polygon-1",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 }
        ]
      }
      const shape = factory.buildShape(partial)
      expect(shape.kind).toBe(ShapeKind.Polygon)
    })

    it("should throw error for unknown shape kind", () =>
    {
      const partial: any = {
        type: SymbolType.Shape,
        kind: "UnknownKind" as any
      }
      expect(() => factory.buildShape(partial)).toThrow("Unable to create shape")
    })
  })

  describe("buildEdge", () =>
  {
    it("should build an arc edge", () =>
    {
      const partial: any = {
        type: SymbolType.Edge,
        kind: EdgeKind.Arc,
        id: "arc-1",
        center: { x: 50, y: 50 },
        radiusX: 30,
        radiusY: 20,
        startAngle: 0,
        sweepAngle: Math.PI
      }
      const edge = factory.buildEdge(partial)
      expect(edge.kind).toBe(EdgeKind.Arc)
    })

    it("should build a line edge", () =>
    {
      const partial: any = {
        type: SymbolType.Edge,
        kind: EdgeKind.Line,
        id: "line-1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 10 }
      }
      const edge = factory.buildEdge(partial)
      expect(edge.kind).toBe(EdgeKind.Line)
    })

    it("should build a polyline edge", () =>
    {
      const partial: any = {
        type: SymbolType.Edge,
        kind: EdgeKind.PolyEdge,
        id: "polyline-1",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 }
        ]
      }
      const edge = factory.buildEdge(partial)
      expect(edge.kind).toBe(EdgeKind.PolyEdge)
    })

    it("should throw error for unknown edge kind", () =>
    {
      const partial: any = {
        type: SymbolType.Edge,
        kind: "UnknownKind" as any
      }
      expect(() => factory.buildEdge(partial)).toThrow("Unable to create edge")
    })
  })

  describe("buildRecognized", () =>
  {
    it("should build recognized text", () =>
    {
      const partial: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Text,
        id: "recognized-text-1",
        label: "Hello",
        words: [],
        strokes: [{ id: "s1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} }]
      }
      const recognized = factory.buildRecognized(partial)
      expect(recognized.kind).toBe(RecognizedKind.Text)
    })

    it("should build recognized math", () =>
    {
      const partial: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Math,
        id: "recognized-math-1",
        label: "x+1",
        expressions: [],
        strokes: [{ id: "s1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} }]
      }
      const recognized = factory.buildRecognized(partial)
      expect(recognized.kind).toBe(RecognizedKind.Math)
    })

    it("should throw error for unknown recognized kind", () =>
    {
      const partial: any = {
        type: SymbolType.Recognized,
        kind: "UnknownKind" as any
      }
      expect(() => factory.buildRecognized(partial)).toThrow("Unable to create recognized")
    })
  })

  describe("buildSymbol", () =>
  {
    it("should build stroke symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Stroke,
        id: "stroke-1",
        pointers: [{ t: 0, p: 1, x: 0, y: 0 }],
        style: {}
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Stroke)
    })

    it("should build text symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Text,
        id: "text-1",
        chars: [{ label: "A", fontSize: 12, fontWeight: "normal" }],
        point: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Text)
    })

    it("should build math symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Math,
        id: "math-1",
        elements: [{ type: "number", label: "1", bounds: { x: 0, y: 0, width: 10, height: 10 } }],
        point: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Math)
    })

    it("should build shape symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        id: "circle-1",
        center: { x: 50, y: 50 },
        radius: 25
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Shape)
    })

    it("should build edge symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Edge,
        kind: EdgeKind.Line,
        id: "line-1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 10 }
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Edge)
    })

    it("should build recognized symbol", () =>
    {
      const partial: any = {
        type: SymbolType.Recognized,
        kind: RecognizedKind.Text,
        id: "recognized-text-1",
        label: "Hello",
        words: [],
        strokes: [{ id: "s1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} }]
      }
      const symbol = factory.buildSymbol(partial)
      expect(symbol.type).toBe(SymbolType.Recognized)
    })

    it("should throw error for unknown symbol type", () =>
    {
      const partial: any = {
        type: "UnknownType" as any
      }
      expect(() => factory.buildSymbol(partial)).toThrow("Unable to build symbol")
    })
  })

  describe("buildSymbols", () =>
  {
    it("should build multiple symbols", () =>
    {
      const partials: any[] = [
        {
          type: SymbolType.Stroke,
          id: "stroke-1",
          pointers: [{ t: 0, p: 1, x: 0, y: 0 }],
          style: {}
        },
        {
          type: SymbolType.Text,
          id: "text-1",
          chars: [{ label: "A", fontSize: 12, fontWeight: "normal" }],
          point: { x: 0, y: 0 },
          bounds: { x: 0, y: 0, width: 10, height: 10 }
        }
      ]
      const symbols = factory.buildSymbols(partials)
      expect(symbols).toHaveLength(2)
      expect(symbols[0].type).toBe(SymbolType.Stroke)
      expect(symbols[1].type).toBe(SymbolType.Text)
    })

    it("should accumulate all errors when multiple symbols fail", () =>
    {
      const partials: any[] = [
        { type: "Invalid1" as any },
        {
          type: SymbolType.Stroke,
          id: "stroke-1",
          pointers: [{ t: 0, p: 1, x: 0, y: 0 }],
          style: {}
        },
        { type: "Invalid2" as any }
      ]
      expect(() => factory.buildSymbols(partials)).toThrow(/Failed to build 2 symbol/)
      expect(() => factory.buildSymbols(partials)).toThrow(/Symbol 0:/)
      expect(() => factory.buildSymbols(partials)).toThrow(/Symbol 2:/)
    })

    it("should return empty array for empty input", () =>
    {
      const symbols = factory.buildSymbols([])
      expect(symbols).toEqual([])
    })
  })
})
