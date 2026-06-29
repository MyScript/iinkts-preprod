import {
  createSymbolFromPartial,
  createSymbolsFromPartial,
  SymbolType,
  ShapeKind,
  EdgeKind,
  ShapeOps,
  EdgeOps,
} from "@/iink"

const createShapeFromPartial = ShapeOps.createShapeFromPartial.bind(ShapeOps)
const createEdgeFromPartial = EdgeOps.createEdgeFromPartial.bind(EdgeOps)

describe("createSymbolFromPartial", () => {
  it("should build stroke symbol", () => {
    const partial: any = { type: SymbolType.Stroke, id: "stroke-1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} }
    const symbol = createSymbolFromPartial(partial)
    expect(symbol.type).toBe(SymbolType.Stroke)
    expect(symbol.id).toBe("stroke-1")
  })

  it("should build text symbol", () => {
    const partial: any = {
      type: SymbolType.Text,
      id: "text-1",
      chars: [{ label: "A", fontSize: 12, fontWeight: "normal" }],
      point: { x: 0, y: 0 },
      bounds: { x: 0, y: 0, width: 10, height: 10 },
    }
    const symbol = createSymbolFromPartial(partial)
    expect(symbol.type).toBe(SymbolType.Text)
    expect(symbol.id).toBe("text-1")
  })

  it("should build math symbol", () => {
    const partial: any = {
      type: SymbolType.Math,
      id: "math-1",
      elements: [
        {
          id: "e1",
          label: "1",
          fontSize: 12,
          fontWeight: "normal",
          fontFamily: "Arial",
          color: "#000",
          bounds: { x: 0, y: 0, width: 10, height: 10 },
        },
      ],
      point: { x: 0, y: 0 },
      bounds: { x: 0, y: 0, width: 10, height: 10 },
    }
    const symbol = createSymbolFromPartial(partial)
    expect(symbol.type).toBe(SymbolType.Math)
    expect(symbol.id).toBe("math-1")
  })

  it("should build shape symbol", () => {
    const partial: any = {
      type: SymbolType.Shape,
      kind: ShapeKind.Circle,
      id: "circle-1",
      center: { x: 50, y: 50 },
      radius: 25,
    }
    const symbol = createSymbolFromPartial(partial)
    expect(symbol.type).toBe(SymbolType.Shape)
  })

  it("should build edge symbol", () => {
    const partial: any = {
      type: SymbolType.Edge,
      kind: EdgeKind.Line,
      id: "line-1",
      start: { x: 0, y: 0 },
      end: { x: 10, y: 10 },
    }
    const symbol = createSymbolFromPartial(partial)
    expect(symbol.type).toBe(SymbolType.Edge)
  })

  it("should throw for unknown symbol type", () => {
    const partial: any = { type: "UnknownType" as any }
    expect(() => createSymbolFromPartial(partial)).toThrow("Unable to create symbol")
  })
})

describe("createShapeFromPartial", () => {
  it("should build circle", () => {
    const partial: any = { kind: ShapeKind.Circle, center: { x: 50, y: 50 }, radius: 25 }
    expect(createShapeFromPartial(partial).kind).toBe(ShapeKind.Circle)
  })

  it("should build ellipse", () => {
    const partial: any = { kind: ShapeKind.Ellipse, center: { x: 50, y: 50 }, radiusX: 30, radiusY: 20 }
    expect(createShapeFromPartial(partial).kind).toBe(ShapeKind.Ellipse)
  })

  it("should build polygon", () => {
    const partial: any = {
      kind: ShapeKind.Polygon,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
    }
    expect(createShapeFromPartial(partial).kind).toBe(ShapeKind.Polygon)
  })

  it("should throw for unknown kind", () => {
    expect(() => createShapeFromPartial({ kind: "Unknown" } as any)).toThrow("Unable to create shape")
  })
})

describe("createEdgeFromPartial", () => {
  it("should build arc", () => {
    const partial: any = {
      kind: EdgeKind.Arc,
      center: { x: 50, y: 50 },
      radiusX: 30,
      radiusY: 20,
      startAngle: 0,
      sweepAngle: Math.PI,
      phi: 0,
    }
    expect(createEdgeFromPartial(partial).kind).toBe(EdgeKind.Arc)
  })

  it("should build line", () => {
    const partial: any = { kind: EdgeKind.Line, start: { x: 0, y: 0 }, end: { x: 10, y: 10 } }
    expect(createEdgeFromPartial(partial).kind).toBe(EdgeKind.Line)
  })

  it("should build polyline", () => {
    const partial: any = {
      kind: EdgeKind.PolyEdge,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 0 },
      ],
    }
    expect(createEdgeFromPartial(partial).kind).toBe(EdgeKind.PolyEdge)
  })

  it("should throw for unknown kind", () => {
    expect(() => createEdgeFromPartial({ kind: "Unknown" } as any)).toThrow("Unable to create edge")
  })
})

describe("createSymbolsFromPartial", () => {
  it("should build multiple symbols", () => {
    const partials: any[] = [
      { type: SymbolType.Stroke, id: "stroke-1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} },
      { type: SymbolType.Edge, kind: EdgeKind.Line, id: "line-1", start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
    ]
    const symbols = createSymbolsFromPartial(partials)
    expect(symbols).toHaveLength(2)
    expect(symbols[0].type).toBe(SymbolType.Stroke)
    expect(symbols[1].type).toBe(SymbolType.Edge)
  })

  it("should accumulate errors for failed symbols", () => {
    const partials: any[] = [
      { type: "Invalid1" as any },
      { type: SymbolType.Stroke, id: "stroke-1", pointers: [{ t: 0, p: 1, x: 0, y: 0 }], style: {} },
      { type: "Invalid2" as any },
    ]
    expect(() => createSymbolsFromPartial(partials)).toThrow(/Failed to create 2 symbol/)
    expect(() => createSymbolsFromPartial(partials)).toThrow(/Symbol 0:/)
    expect(() => createSymbolsFromPartial(partials)).toThrow(/Symbol 2:/)
  })

  it("should return empty array for empty input", () => {
    expect(createSymbolsFromPartial([])).toEqual([])
  })
})
